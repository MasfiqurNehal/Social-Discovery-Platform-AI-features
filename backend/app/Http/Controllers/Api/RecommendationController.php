<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Event;
use App\Models\Place;
use App\Models\User;
use App\Services\FastApiRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendationController extends Controller
{
    public function __construct(private readonly FastApiRecommendationService $service)
    {
    }

    public function recommend(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'limit' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $user = $request->user();
        $targetUserId = (int) ($validated['user_id'] ?? $user->id);

        if ($targetUserId !== (int) $user->id && !($user instanceof Admin) && !($user->tokenCan('admin'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to request recommendations for another user.',
            ], 403);
        }

        $limit = (int) ($validated['limit'] ?? $validated['per_page'] ?? 20);
        $result = $this->service->recommend(userId: $targetUserId, limit: $limit);

        // AI service is down or errored — serve popular content directly from DB
        if (!$result['ok']) {
            return $this->popularFallback($limit, $targetUserId);
        }

        $payload = $result['data'];
        $places = data_get($payload, 'data.places', []);
        $events = data_get($payload, 'data.events', []);

        $placeIds = collect($places)->pluck('target_id')->filter()->map(fn ($id) => (int) $id)->values();
        $eventIds = collect($events)->pluck('target_id')->filter()->map(fn ($id) => (int) $id)->values();

        $placeDetails = Place::query()
            ->select(['id', 'name', 'category', 'area_name', 'cover_image_url', 'average_rating', 'total_reviews'])
            ->whereIn('id', $placeIds)
            ->get();

        $eventDetails = Event::query()
            ->select(['id', 'title', 'category', 'area_name', 'cover_image_url', 'event_date', 'average_rating', 'total_reviews'])
            ->whereIn('id', $eventIds)
            ->get();

        $aiDescriptions = $this->generateAiDescriptions($user, $places, $events, $placeDetails, $eventDetails);

        return response()->json([
            'status' => 'success',
            'data' => [
                'user_id'         => $targetUserId,
                'places'          => $places,
                'events'          => $events,
                'place_details'   => $placeDetails,
                'event_details'   => $eventDetails,
                'ai_descriptions' => $aiDescriptions,
            ],
            'meta' => [
                'current_page'    => 1,
                'last_page'       => 1,
                'per_page'        => $limit,
                'total'           => count($places) + count($events),
                'returned_places' => count($places),
                'returned_events' => count($events),
            ],
        ]);
    }

    /**
     * Fallback when the AI service is unavailable.
     * Queries top-rated published places and events directly from the database.
     * Score is normalized to 0–1 so the frontend "% match" badge shows correctly.
     */
    private function popularFallback(int $limit, int $userId): JsonResponse
    {
        $placeModels = Place::query()
            ->where('is_published', true)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->limit($limit)
            ->get(['id', 'name', 'category', 'area_name', 'cover_image_url', 'average_rating', 'total_reviews']);

        $eventModels = Event::query()
            ->where('is_published', true)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->limit($limit)
            ->get(['id', 'title', 'category', 'area_name', 'cover_image_url', 'event_date', 'average_rating', 'total_reviews']);

        $places = $placeModels->map(fn ($p) => [
            'target_type' => 'place',
            'target_id'   => $p->id,
            'score'       => $p->average_rating ? round(min(1.0, (float) $p->average_rating / 5.0), 4) : 0.0,
            'category'    => $p->category,
        ])->values()->all();

        $events = $eventModels->map(fn ($e) => [
            'target_type' => 'event',
            'target_id'   => $e->id,
            'score'       => $e->average_rating ? round(min(1.0, (float) $e->average_rating / 5.0), 4) : 0.0,
            'category'    => $e->category,
        ])->values()->all();

        $user = User::find($userId);
        $aiDescriptions = $user
            ? $this->generateAiDescriptions($user, $places, $events, $placeModels, $eventModels)
            : [];

        return response()->json([
            'status' => 'success',
            'data' => [
                'user_id'         => $userId,
                'places'          => $places,
                'events'          => $events,
                'place_details'   => $placeModels,
                'event_details'   => $eventModels,
                'ai_descriptions' => $aiDescriptions,
                'fallback'        => 'popularity',
            ],
            'meta' => [
                'current_page'    => 1,
                'last_page'       => 1,
                'per_page'        => $limit,
                'total'           => count($places) + count($events),
                'returned_places' => count($places),
                'returned_events' => count($events),
            ],
        ]);
    }

    /**
     * Call Gemini 2.5 Flash to generate unique, personalized 2-sentence descriptions
     * for each recommended place/event. Uses JSON response mode to avoid markdown parsing.
     * Each item is assigned a distinct reason_hint so Gemini writes varied angles.
     */
    private function generateAiDescriptions(
        User $user,
        array $placeRecs,
        array $eventRecs,
        $placeDetails,
        $eventDetails
    ): array {
        $apiKey = config('services.fastapi.gemini_api_key');
        if (!$apiKey) {
            Log::warning('Gemini descriptions skipped: GEMINI_API_KEY not configured');
            return [];
        }

        $userName      = $user->display_name ?? 'Explorer';
        $userLocation  = $user->location ?? 'Dhaka';
        $reviewCount   = $user->review_count ?? 0;
        $wishlistCount = $user->wishlist_count ?? 0;

        // Category frequency → user interest signal
        $categoryFreq = [];
        foreach (array_merge($placeRecs, $eventRecs) as $rec) {
            $cat = $rec['category'] ?? 'General';
            $categoryFreq[$cat] = ($categoryFreq[$cat] ?? 0) + 1;
        }
        arsort($categoryFreq);
        $topCategories = implode(', ', array_keys(array_slice($categoryFreq, 0, 3, true)));

        // Reason types to rotate — ensures every card description uses a different angle
        $reasonPool = [
            'high_match_score',    // "X% match — built for your exact taste in [category]"
            'top_rated_locally',   // "Rated X/5 by locals in [area] — one of the highest in the city"
            'trending_now',        // "Trending in [area] right now with a surge of recent visitors"
            'near_your_location',  // "Close to [userLocation] — easy to reach from your area"
            'category_history',    // "You consistently visit [category] spots — this is a prime example"
            'hidden_gem',          // "A lesser-known gem in [area] that perfectly fits your profile"
            'community_favourite', // "A community favourite with repeat visitors and strong word-of-mouth"
            'new_and_popular',     // "Recently gaining popularity and matching your activity patterns"
            'perfect_weekend',     // "An ideal weekend hangout based on your wishlist and bookings"
        ];

        $placeMap = collect($placeDetails)->keyBy('id');
        $eventMap = collect($eventDetails)->keyBy('id');
        $items    = [];
        $idx      = 0;

        foreach ($placeRecs as $rec) {
            $p = $placeMap->get($rec['target_id']);
            if (!$p) continue;
            $score   = (float) ($rec['score'] ?? 0);
            $rating  = (float) ($p->average_rating ?? 0);

            // Pick reason hint: data-driven first, then rotate pool
            if ($score >= 0.9) {
                $hint = 'high_match_score';
            } elseif ($rating >= 4.8) {
                $hint = 'top_rated_locally';
            } else {
                $hint = $reasonPool[$idx % count($reasonPool)];
            }

            // Strip trailing seeder number from name before sending to Gemini
            $cleanedName = preg_replace('/\s+\d+$/', '', $p->name);

            $items[] = [
                'key'         => 'place_' . $p->id,
                'type'        => 'place',
                'name'        => $cleanedName,
                'category'    => $rec['category'] ?? $p->category,
                'area'        => $p->area_name,
                'rating'      => round($rating, 1),
                'match_pct'   => (int) round($score * 100),
                'reason_hint' => $hint,
            ];
            $idx++;
        }

        foreach ($eventRecs as $rec) {
            $e = $eventMap->get($rec['target_id']);
            if (!$e) continue;
            $score  = (float) ($rec['score'] ?? 0);
            $rating = (float) ($e->average_rating ?? 0);

            if ($score >= 0.9) {
                $hint = 'high_match_score';
            } elseif ($rating >= 4.8) {
                $hint = 'top_rated_locally';
            } else {
                $hint = $reasonPool[$idx % count($reasonPool)];
            }

            $cleanedName = preg_replace('/\s+\d+$/', '', $e->title);

            $items[] = [
                'key'         => 'event_' . $e->id,
                'type'        => 'event',
                'name'        => $cleanedName,
                'category'    => $rec['category'] ?? $e->category,
                'area'        => $e->area_name,
                'rating'      => round($rating, 1),
                'match_pct'   => (int) round($score * 100),
                'reason_hint' => $hint,
            ];
            $idx++;
        }

        if (empty($items)) return [];

        $systemInstruction = <<<PROMPT
You are VibeSpot's recommendation AI for Bangladesh. Write exactly 2 sentences (25–40 words total) per item explaining why THIS specific item suits THIS specific user.

RULES — read carefully:
1. Every description MUST sound different. No two cards can start with the same phrase or use the same sentence structure.
2. Use the "reason_hint" field to pick the PRIMARY angle for each card:
   - high_match_score  → lead with "X% match" and explain what in the user's history drives it
   - top_rated_locally → lead with the rating and mention community approval in that area
   - trending_now      → say it's currently popular/trending and gaining momentum in that area
   - near_your_location → highlight proximity to the user's location and convenience
   - category_history  → mention the user's repeated visits to this category
   - hidden_gem        → frame it as an underrated spot that fits the user's specific taste
   - community_favourite → highlight repeat visitors and strong word-of-mouth
   - new_and_popular   → mention recent growth in popularity matching their pattern
   - perfect_weekend   → suggest it as an ideal outing based on wishlist/booking patterns
3. Always include: the place/event's area and category naturally in the text.
4. Do NOT mention trailing numbers in names. Do NOT say "based on your recent activity and wishlist" — that phrase is banned.
5. Write in warm, natural English. Be specific, not generic.
PROMPT;

        $userCtx = "User: {$userName} | Location: {$userLocation} | Top interests: {$topCategories} | Reviews written: {$reviewCount} | Wishlist size: {$wishlistCount}";

        $prompt = "Generate personalized recommendation descriptions.\n\nUser profile: {$userCtx}\n\nItems:\n"
            . json_encode($items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
            . "\n\nReturn a JSON object: {\"place_ID\": \"description\", \"event_ID\": \"description\", ...}";

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

        try {
            $response = Http::timeout(25)->post($url, [
                'system_instruction' => ['parts' => [['text' => $systemInstruction]]],
                'contents'           => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                'generationConfig'   => [
                    'temperature'        => 0.95,
                    'maxOutputTokens'    => 4096,
                    'responseMimeType'   => 'application/json',  // Forces clean JSON — no markdown fences
                ],
            ]);

            if ($response->ok()) {
                $text    = trim(data_get($response->json(), 'candidates.0.content.parts.0.text', ''));
                $decoded = json_decode($text, true);

                if (is_array($decoded) && !empty($decoded)) {
                    Log::info('Gemini descriptions generated', ['count' => count($decoded)]);
                    return $decoded;
                }

                Log::warning('Gemini descriptions: empty or unparseable JSON', [
                    'snippet' => substr($text, 0, 300),
                ]);
            } else {
                Log::warning('Gemini descriptions: non-OK response', [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 400),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Gemini descriptions call failed', ['error' => $e->getMessage()]);
        }

        return [];
    }

    public function train(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!($user instanceof Admin) && !($user->tokenCan('admin'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admin users can trigger recommendation training.',
            ], 403);
        }

        $validated = $request->validate([
            'training_user_limit' => 'nullable|integer|min:100|max:20000',
            'user_offset' => 'nullable|integer|min:0',
        ]);

        $trainingUserLimit = (int) ($validated['training_user_limit'] ?? 3000);
        $userOffset = (int) ($validated['user_offset'] ?? 0);

        $result = $this->service->train(
            trainingUserLimit: $trainingUserLimit,
            userOffset: $userOffset,
        );

        if (!$result['ok']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'error' => $result['error'] ?? null,
            ], $result['status_code']);
        }

        return response()->json([
            'status' => 'success',
            'data' => data_get($result, 'data.data', data_get($result, 'data', [])),
        ]);
    }
}
