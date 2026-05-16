<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WishlistItem;
use App\Models\Place;
use App\Models\Event;
use Illuminate\Http\Request;
use Carbon\Carbon;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = max(1, min((int) $request->integer('per_page', 12), 30));

        $places = WishlistItem::where('user_id', $user->id)
            ->whereNotNull('place_id')
            ->whereHas('place')
            ->with('place')
            ->orderBy('added_at', 'desc')
            ->paginate($perPage, ['*'], 'places_page')
            ->withQueryString();

        $events = WishlistItem::where('user_id', $user->id)
            ->whereNotNull('event_id')
            ->whereHas('event')
            ->with('event')
            ->orderBy('added_at', 'desc')
            ->paginate($perPage, ['*'], 'events_page')
            ->withQueryString();

        return response()->json([
            'status' => 'success',
            'data' => [
                'places' => collect($places->items())->pluck('place')->values(),
                'events' => collect($events->items())->pluck('event')->values(),
            ],
            'meta' => [
                'places' => [
                    'current_page' => $places->currentPage(),
                    'last_page' => $places->lastPage(),
                    'per_page' => $places->perPage(),
                    'total' => $places->total(),
                ],
                'events' => [
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                    'per_page' => $events->perPage(),
                    'total' => $events->total(),
                ],
            ]
        ]);
    }

    /**
     * Toggle an item in the user's wishlist.
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'place_id' => 'nullable|exists:places,id',
            'event_id' => 'nullable|exists:events,id',
        ]);

        $user = $request->user();
        $placeId = $request->place_id;
        $eventId = $request->event_id;

        $query = WishlistItem::where('user_id', $user->id);
        if ($placeId) {
            $query->where('place_id', $placeId);
        } else {
            $query->where('event_id', $eventId);
        }

        $item = $query->first();

        if ($item) {
            $item->delete();
            $status = 'removed';
        } else {
            WishlistItem::create([
                'user_id' => $user->id,
                'place_id' => $placeId,
                'event_id' => $eventId,
                'wishlistable_type' => $placeId ? 'place' : 'event',
                'added_at' => Carbon::now(),
            ]);
            $status = 'added';

            // Trigger Notification
            $title = $placeId ? 'Place Wishlisted!' : 'Event Wishlisted!';
            $name = $placeId ? Place::find($placeId)->name : Event::find($eventId)->title;
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'type' => 'wishlist',
                'title' => $title,
                'message' => "You've added \"{$name}\" to your wishlist.",
            ]);
        }

        // Optional: Update wishlist count on user model
        $user->wishlist_count = WishlistItem::where('user_id', $user->id)->count();
        $user->save();

        return response()->json([
            'status' => 'success',
            'wishlist_status' => $status,
            'wishlist_count' => $user->wishlist_count
        ]);
    }

    public function ids(Request $request)
    {
        $user = $request->user();

        $placeIds = WishlistItem::where('user_id', $user->id)
            ->whereNotNull('place_id')
            ->whereHas('place')
            ->pluck('place_id');
            
        $eventIds = WishlistItem::where('user_id', $user->id)
            ->whereNotNull('event_id')
            ->whereHas('event')
            ->pluck('event_id');

        return response()->json([
            'status' => 'success',
            'data' => [
                'places' => $placeIds->values(),
                'events' => $eventIds->values()
            ]
        ]);
    }
}
