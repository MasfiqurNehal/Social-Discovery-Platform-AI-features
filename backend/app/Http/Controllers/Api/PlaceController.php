<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlaceController extends Controller
{
    private function perPage(Request $request, int $default = 24, int $max = 60): int
    {
        return max(1, min((int) $request->integer('per_page', $default), $max));
    }

    public function index(Request $request)
    {
        $query = Place::where('is_published', true);

        if ($request->has('search') && !empty($request->search)) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ['%' . $search . '%'])
                  ->orWhereRaw('LOWER(description) LIKE ?', ['%' . $search . '%']);
            });
        }

        if ($request->has('category') && $request->category !== 'All' && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        if ($request->has('area') && $request->area !== 'All' && !empty($request->area)) {
            $query->where('area_name', $request->area);
        }

        $sort = $request->input('sort', 'rating_desc');
        if ($sort === 'rating_desc') {
            $query->orderBy('average_rating', 'desc');
        } elseif ($sort === 'rating_asc') {
            $query->orderBy('average_rating', 'asc');
        } elseif ($sort === 'newest') {
            $query->orderBy('created_at', 'desc');
        }

        $places = $query->paginate($this->perPage($request))->withQueryString();
            
        return response()->json([
            'status' => 'success',
            'data' => $places->items(),
            'meta' => [
                'current_page' => $places->currentPage(),
                'last_page' => $places->lastPage(),
                'total' => $places->total()
            ]
        ]);
    }

    public function show(Request $request, $id)
    {
        $place = Place::findOrFail($id);
        $reviews = $place->reviews()
            ->with('user:id,display_name,profile_photo_url')
            ->orderBy('created_at', 'desc')
            ->paginate($this->perPage($request, 10, 30), ['*'], 'reviews_page')
            ->withQueryString();
        
        $isWishlisted = false;
        $user = auth('sanctum')->user();
        if ($user) {
            $isWishlisted = \App\Models\WishlistItem::where('user_id', $user->id)
                ->where('place_id', $id)
                ->exists();
        }
        
        return response()->json([
            'status' => 'success',
            'data' => array_merge($place->toArray(), ['is_wishlisted' => $isWishlisted]),
            'reviews' => $reviews->items(),
            'reviews_meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function stats()
    {
        $categoryCounts = Place::where('is_published', true)
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->pluck('count', 'category');

        return response()->json([
            'status' => 'success',
            'data' => [
                'places_count' => Place::where('is_published', true)->count(),
                'events_count' => \App\Models\Event::where('is_published', true)->count(),
                'reviews_count' => \App\Models\Review::count(),
                'categories' => $categoryCounts
            ]
        ]);
    }
}
