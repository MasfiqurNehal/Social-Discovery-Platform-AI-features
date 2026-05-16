<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Place;
use App\Services\FastApiChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    public function __construct(private readonly FastApiChatbotService $service)
    {
    }

    public function ask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|min:2|max:2000',
            'conversation_id' => 'nullable|integer|min:1',
        ]);

        $user = $request->user();
        $conversationId = isset($validated['conversation_id']) ? (int) $validated['conversation_id'] : null;

        $result = $this->service->ask(
            userId: (int) $user->id,
            message: $validated['message'],
            conversationId: $conversationId,
        );

        if (!$result['ok']) {
            // AI service is down — respond via direct Gemini + DB context
            return $this->directGeminiChat($validated['message'], (int) $user->id, $conversationId);
        }

        return response()->json([
            'status' => 'success',
            'data' => data_get($result, 'data.data', []),
        ]);
    }

    public function askPublic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|min:2|max:2000',
            'conversation_id' => 'nullable|integer|min:1',
        ]);

        $conversationId = isset($validated['conversation_id']) ? (int) $validated['conversation_id'] : null;

        $result = $this->service->ask(
            userId: null,
            message: $validated['message'],
            conversationId: $conversationId,
        );

        if (!$result['ok']) {
            return $this->directGeminiChat($validated['message'], null, $conversationId);
        }

        return response()->json([
            'status' => 'success',
            'data' => data_get($result, 'data.data', []),
        ]);
    }

    public function history(Request $request, int $conversationId): JsonResponse
    {
        $limit = max(1, min((int) $request->integer('limit', 30), 100));

        $result = $this->service->history(conversationId: $conversationId, limit: $limit);

        if (!$result['ok']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'error' => $result['error'] ?? null,
            ], $result['status_code']);
        }

        return response()->json([
            'status' => 'success',
            'data' => data_get($result, 'data.data', []),
            'meta' => data_get($result, 'data.meta', ['limit' => $limit]),
        ]);
    }

    /** Dhaka neighbourhood → city alias map used by directGeminiChat() */
    private static array $cityAliases = [
        'dhaka'      => ['Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Old Dhaka', 'Panthapath', 'Mohakhali', 'Bashundhara', 'Tejgaon'],
        'chattogram' => ['Chattogram'],
        'chittagong' => ['Chattogram'],
        'sylhet'     => ['Sylhet'],
        'rajshahi'   => ['Rajshahi'],
        'khulna'     => ['Khulna'],
        'cox'        => ['Coxs Bazar'],
    ];

    private function directGeminiChat(string $message, ?int $userId, ?int $conversationId): JsonResponse
    {
        // Strip punctuation per-word so "city?" and "cafe!" both match
        $lowerMsg = strtolower($message);
        $cleanMsg = (string) preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $lowerMsg);
        $words = array_values(array_filter(
            array_unique(explode(' ', $cleanMsg)),
            fn ($w) => mb_strlen(trim($w)) > 2
        ));

        // Split words into location words (expand to DB area names) vs. content words (name/category)
        $expandedAreas = [];
        $locationWords = [];
        foreach ($words as $word) {
            foreach (self::$cityAliases as $cityKey => $areas) {
                if (str_contains($word, $cityKey)) {
                    $expandedAreas = array_merge($expandedAreas, $areas);
                    $locationWords[] = $word;
                }
            }
        }
        $expandedAreas = array_unique($expandedAreas);
        // Content words: remove pure location words so "dhaka"/"city" don't pollute name search
        $contentWords = array_values(array_filter($words, fn ($w) => !in_array($w, $locationWords, true)));
        if (empty($contentWords)) {
            $contentWords = $words; // fallback: use all words if everything was location
        }

        // Place search: match content keywords in name/category AND optionally filter to expanded areas
        $placeQuery = Place::where('is_published', true)
            ->where(function ($q) use ($contentWords) {
                foreach ($contentWords as $term) {
                    $q->orWhereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                      ->orWhereRaw('LOWER(category) LIKE ?', ["%{$term}%"]);
                }
            });

        if (!empty($expandedAreas)) {
            $placeQuery->whereIn('area_name', $expandedAreas);
        }

        $places = $placeQuery->orderByDesc('average_rating')->limit(8)
            ->get(['id', 'name', 'category', 'area_name', 'average_rating', 'total_reviews']);

        // If no results, relax: drop area filter and try again
        if ($places->isEmpty() && !empty($expandedAreas)) {
            $places = Place::where('is_published', true)
                ->where(function ($q) use ($contentWords) {
                    foreach ($contentWords as $term) {
                        $q->orWhereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                          ->orWhereRaw('LOWER(category) LIKE ?', ["%{$term}%"]);
                    }
                })
                ->orderByDesc('average_rating')->limit(8)
                ->get(['id', 'name', 'category', 'area_name', 'average_rating', 'total_reviews']);
        }

        // Final fallback: top-rated published places
        if ($places->isEmpty()) {
            $places = Place::where('is_published', true)
                ->orderByDesc('average_rating')->limit(8)
                ->get(['id', 'name', 'category', 'area_name', 'average_rating', 'total_reviews']);
        }

        // Event search: same pattern
        $eventQuery = Event::where('is_published', true)
            ->where(function ($q) use ($contentWords) {
                foreach ($contentWords as $term) {
                    $q->orWhereRaw('LOWER(title) LIKE ?', ["%{$term}%"])
                      ->orWhereRaw('LOWER(category) LIKE ?', ["%{$term}%"]);
                }
            });

        if (!empty($expandedAreas)) {
            $eventQuery->whereIn('area_name', $expandedAreas);
        }

        $events = $eventQuery->orderByDesc('average_rating')->limit(8)
            ->get(['id', 'title', 'category', 'area_name', 'event_date', 'average_rating', 'total_reviews']);

        if ($events->isEmpty() && !empty($expandedAreas)) {
            $events = Event::where('is_published', true)
                ->where(function ($q) use ($contentWords) {
                    foreach ($contentWords as $term) {
                        $q->orWhereRaw('LOWER(title) LIKE ?', ["%{$term}%"])
                          ->orWhereRaw('LOWER(category) LIKE ?', ["%{$term}%"]);
                    }
                })
                ->orderByDesc('average_rating')->limit(8)
                ->get(['id', 'title', 'category', 'area_name', 'event_date', 'average_rating', 'total_reviews']);
        }

        if ($events->isEmpty()) {
            $events = Event::where('is_published', true)
                ->orderByDesc('average_rating')->limit(8)
                ->get(['id', 'title', 'category', 'area_name', 'event_date', 'average_rating', 'total_reviews']);
        }

        $dhakaAreas = array_map('strtolower', self::$cityAliases['dhaka']);

        $placesCtx = $places->map(fn ($p) => [
            'name' => $p->name,
            'category' => $p->category,
            'area' => $p->area_name,
            'city' => in_array(strtolower((string) $p->area_name), $dhakaAreas, true) ? 'Dhaka' : 'Bangladesh',
            'rating' => $p->average_rating,
            'reviews' => $p->total_reviews,
        ])->all();

        $eventsCtx = $events->map(fn ($e) => [
            'title' => $e->title,
            'category' => $e->category,
            'area' => $e->area_name,
            'city' => in_array(strtolower((string) $e->area_name), $dhakaAreas, true) ? 'Dhaka' : 'Bangladesh',
            'date' => $e->event_date,
            'rating' => $e->average_rating,
        ])->all();

        $reply = $this->callGeminiApi($message, $placesCtx, $eventsCtx);

        return response()->json([
            'status' => 'success',
            'data' => [
                'message' => $reply,
                'conversation_id' => $conversationId,
            ],
        ]);
    }

    private function callGeminiApi(string $message, array $places, array $events): string
    {
        $apiKey = config('services.fastapi.gemini_api_key');
        $model = 'gemini-2.5-flash';

        if (!$apiKey) {
            Log::error('GEMINI_API_KEY not configured in Laravel services.fastapi');
            return $this->buildFallbackReply($places, $events);
        }

        $systemInstruction =
            'You are VibeSpot Assistant, a friendly local guide helping users discover places and events in Bangladesh. '
            . 'IMPORTANT GEOGRAPHY: Gulshan, Banani, Dhanmondi, Uttara, Mirpur, Old Dhaka, Panthapath, Mohakhali, Bashundhara, and Tejgaon are all neighbourhoods INSIDE Dhaka city. '
            . 'When a user says "Dhaka" or "Dhaka City", places listed with area=Gulshan, Banani, Dhanmondi etc. ARE in Dhaka — recommend them confidently. '
            . 'Place names use the pattern "[Adjective] [Area] [Type] [Number]" — "North Gulshan Cafe 42" is a cafe in Gulshan (Dhaka), "Golden Banani Bistro 7" is a bistro in Banani (Dhaka). '
            . 'STRICT RULE: If the context contains ANY results, you MUST recommend them. Never say "I could not find" or "I am sorry". '
            . 'Always start your answer by naming the top 3–5 options from the context using bullet points starting with "- ". '
            . 'Format: "- **[Name]** ([Area], Dhaka) — [category], rated [rating]/5". '
            . 'Use ONLY the provided context data — never invent places not listed. '
            . 'Be warm, concise, and end with a helpful tip or follow-up question.';

        $contextText = "Available places (all located in Bangladesh):\n" . json_encode($places, JSON_UNESCAPED_UNICODE)
            . "\n\nAvailable events (all located in Bangladesh):\n" . json_encode($events, JSON_UNESCAPED_UNICODE);

        $userText = "User question: {$message}\n\nContext data:\n{$contextText}";

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        try {
            $response = Http::timeout(25)->post($url, [
                'system_instruction' => ['parts' => [['text' => $systemInstruction]]],
                'contents' => [['role' => 'user', 'parts' => [['text' => $userText]]]],
                'generationConfig' => ['temperature' => 0.3, 'maxOutputTokens' => 1500],
            ]);

            if ($response->ok()) {
                $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
                if ($text) {
                    return trim($text);
                }
            }

            $status = $response->status();
            if ($status === 429) {
                Log::warning('Gemini API quota exceeded (429)', ['key_hint' => substr((string) $apiKey, 0, 8)]);
            } else {
                Log::warning('Gemini API returned non-OK or empty', [
                    'status' => $status,
                    'body' => substr($response->body(), 0, 400),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Direct Gemini call failed', ['error' => $e->getMessage()]);
        }

        return $this->buildFallbackReply($places, $events);
    }

    private function buildFallbackReply(array $places, array $events): string
    {
        $hasPlaces = !empty($places);
        $hasEvents = !empty($events);

        if (!$hasPlaces && !$hasEvents) {
            return "I couldn't find specific matches, but VibeSpot has tons of great spots across Bangladesh! "
                . "Try asking about 'cafes in Gulshan', 'rooftop places in Banani', or 'events this weekend'.";
        }

        $lines = ["Here are some top picks I found for you on VibeSpot:"];

        if ($hasPlaces) {
            $lines[] = '';
            $lines[] = '**Top Places:**';
            foreach (array_slice($places, 0, 4) as $p) {
                $lines[] = "- **{$p['name']}** ({$p['area']}) — {$p['category']}, rated {$p['rating']}/5";
            }
        }

        if ($hasEvents) {
            $lines[] = '';
            $lines[] = '**Upcoming Events:**';
            foreach (array_slice($events, 0, 3) as $e) {
                $date = !empty($e['date']) ? ' · ' . date('M j, Y', strtotime((string) $e['date'])) : '';
                $lines[] = "- **{$e['title']}** ({$e['area']}){$date} — {$e['category']}";
            }
        }

        $lines[] = '';
        $lines[] = 'Want more details or a different area? Just ask!';

        return implode("\n", $lines);
    }
}
