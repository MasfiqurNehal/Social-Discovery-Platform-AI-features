<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ManageReviewsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 50));
        $query = Review::with(['user:id,display_name,profile_photo_url', 'place:id,name', 'event:id,title'])
            ->orderBy('created_at', 'desc');

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('user', function($q) use ($search) {
                    $q->where('display_name', 'ilike', "%{$search}%");
                })->orWhere('body', 'ilike', "%{$search}%");
            });
        }

        $reviews = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'status' => 'success',
            'data' => $reviews->items(),
            'meta' => [
                'total' => $reviews->total(),
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
            ]
        ]);
    }

    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        
        // Store entity info for rating sync if needed
        $placeId = $review->place_id;
        $eventId = $review->event_id;
        $type = $placeId ? 'place' : 'event';
        $entityId = $placeId ?? $eventId;

        $review->delete();

        // Sync ratings after deletion
        $this->syncRatings($type, $entityId);

        return response()->json([
            'status' => 'success',
            'message' => 'Review deleted successfully'
        ]);
    }

    private function syncRatings($type, $id)
    {
        $model = $type === 'place' ? \App\Models\Place::find($id) : \App\Models\Event::find($id);
        if (!$model) return;

        $avgRating = \App\Models\Review::where($type . '_id', $id)->avg('rating') ?: 0;
        $totalReviews = \App\Models\Review::where($type . '_id', $id)->count();

        $model->update([
            'average_rating' => $avgRating,
            'total_reviews' => $totalReviews
        ]);
    }
}
