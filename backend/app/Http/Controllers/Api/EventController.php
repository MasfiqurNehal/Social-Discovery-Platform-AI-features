<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

class EventController extends Controller
{
    private function perPage(Request $request, int $default = 12, int $max = 48): int
    {
        return max(1, min((int) $request->integer('per_page', $default), $max));
    }

    public function index(Request $request)
    {
        $query = Event::where('is_published', true);

        // Full-text search across title, description, organiser_name
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereRaw('title ILIKE ?', ['%' . $search . '%'])
                  ->orWhereRaw('description ILIKE ?', ['%' . $search . '%'])
                  ->orWhereRaw('organiser_name ILIKE ?', ['%' . $search . '%']);
            });
        }

        // Category filter
        if ($request->filled('category') && $request->input('category') !== 'All') {
            $query->where('category', $request->input('category'));
        }

        // Area filter
        if ($request->filled('area') && $request->input('area') !== 'All') {
            $query->where('area_name', $request->input('area'));
        }

        // Sorting
        $sort = $request->input('sort', 'smart');

        match ($sort) {
            'date_asc'    => $query->orderBy('event_date', 'asc'),
            'date_desc'   => $query->orderBy('event_date', 'desc'),
            'rating_desc' => $query->orderBy('average_rating', 'desc'),
            'rating_asc'  => $query->orderBy('average_rating', 'asc'),
            'newest'      => $query->orderBy('created_at', 'desc'),

            // Smart default: ongoing/upcoming first (soonest start), then most-recent past
            default => $query
                ->orderByRaw("CASE WHEN COALESCE(end_date, event_date) >= CURRENT_DATE THEN 0 ELSE 1 END ASC")
                ->orderByRaw("CASE WHEN COALESCE(end_date, event_date) >= CURRENT_DATE THEN event_date END ASC NULLS LAST")
                ->orderByRaw("CASE WHEN COALESCE(end_date, event_date)  < CURRENT_DATE THEN event_date END DESC NULLS LAST"),
        };

        $events = $query->paginate($this->perPage($request))->withQueryString();

        return response()->json([
            'status' => 'success',
            'data'   => $events->items(),
            'meta'   => [
                'current_page' => $events->currentPage(),
                'last_page'    => $events->lastPage(),
                'total'        => $events->total(),
                'per_page'     => $events->perPage(),
            ],
        ]);
    }

    public function show(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $reviews = $event->reviews()
            ->with('user:id,display_name,profile_photo_url')
            ->orderBy('created_at', 'desc')
            ->paginate($this->perPage($request, 10, 30), ['*'], 'reviews_page')
            ->withQueryString();

        $isWishlisted = false;
        $user = auth('sanctum')->user();
        if ($user) {
            $isWishlisted = WishlistItem::where('user_id', $user->id)
                ->where('event_id', $id)
                ->exists();
        }

        return response()->json([
            'status'       => 'success',
            'data'         => array_merge($event->toArray(), ['is_wishlisted' => $isWishlisted]),
            'reviews'      => $reviews->items(),
            'reviews_meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page'    => $reviews->lastPage(),
                'per_page'     => $reviews->perPage(),
                'total'        => $reviews->total(),
            ],
        ]);
    }
}
