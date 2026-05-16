<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Place;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    private function perPage(Request $request, int $default = 20, int $max = 50): int
    {
        return max(1, min((int) $request->integer('per_page', $default), $max));
    }

    public function index(Request $request)
    {
        $query = Review::with('user:id,display_name,profile_photo_url');

        if ($request->has('place_id')) {
            $query->where('place_id', $request->place_id);
        }

        if ($request->has('event_id')) {
            $query->where('event_id', $request->event_id);
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate($this->perPage($request))->withQueryString();

        return response()->json([
            'status' => 'success',
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total()
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'place_id' => 'nullable|exists:places,id',
            'event_id' => 'nullable|exists:events,id',
            'rating' => 'required|integer|min:1|max:5',
            'body' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();

        $review = Review::create([
            'user_id' => $user->id,
            'reviewable_type' => $request->place_id ? 'place' : 'event',
            'place_id' => $request->place_id,
            'event_id' => $request->event_id,
            'rating' => $request->rating,
            'body' => $request->body,
        ]);

        $this->syncRatings($request->place_id ? 'place' : 'event', $request->place_id ?? $request->event_id);

        // Trigger Notification
        $name = $request->place_id ? Place::find($request->place_id)->name : Event::find($request->event_id)->title;
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'type' => 'review',
            'title' => 'Review Published!',
            'message' => "Thanks for sharing your experience at \"{$name}\". Your review is now live!",
        ]);

        $review->load('user:id,display_name,profile_photo_url');

        return response()->json([
            'status' => 'success',
            'data' => $review
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        
        // Authorization check
        if ($review->user_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'body' => 'nullable|string|max:2000',
        ]);

        $review->update([
            'rating' => $request->rating,
            'body' => $request->body,
        ]);

        $this->syncRatings($review->place_id ? 'place' : 'event', $review->place_id ?? $review->event_id);

        $review->load('user:id,display_name,profile_photo_url');

        return response()->json([
            'status' => 'success',
            'data' => $review
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        // Authorization check
        if ((int)$review->user_id !== (int)$request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $type = $review->place_id ? 'place' : 'event';
        $entityId = $review->place_id ?? $review->event_id;

        $review->delete();

        $this->syncRatings($type, $entityId);

        return response()->json([
            'status' => 'success',
            'message' => 'Review deleted successfully'
        ]);
    }

    private function syncRatings($type, $id)
    {
        if ($type === 'place') {
            $place = Place::find($id);
            if ($place) {
                $reviews = Review::where('place_id', $id);
                $place->average_rating = $reviews->avg('rating') ?: 0;
                $place->total_reviews = $reviews->count();
                $place->save();
            }
        } else {
            $event = Event::find($id);
            if ($event) {
                $reviews = Review::where('event_id', $id);
                $event->average_rating = $reviews->avg('rating') ?: 0;
                $event->total_reviews = $reviews->count();
                $event->save();
            }
        }
    }
}
