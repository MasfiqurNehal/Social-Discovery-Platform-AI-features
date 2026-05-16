<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CheckInController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'place_id' => 'nullable|exists:places,id',
            'event_id' => 'nullable|exists:events,id',
        ]);

        if (!$request->place_id && !$request->event_id) {
            return response()->json(['message' => 'Specify a place or event.'], 422);
        }

        $user = $request->user();

        // Check for 24-hour restriction (Per Venue)
        $query = CheckIn::where('user_id', $user->id);
        if ($request->place_id) {
            $query->where('place_id', $request->place_id);
        } else {
            $query->where('event_id', $request->event_id);
        }
        
        $lastCheckIn = $query->orderBy('checked_in_at', 'desc')->first();

        if ($lastCheckIn && Carbon::parse($lastCheckIn->checked_in_at)->addHours(24)->isFuture()) {
            $timeLeft = Carbon::parse($lastCheckIn->checked_in_at)->addHours(24)->diffForHumans();
            return response()->json([
                'status' => 'error',
                'message' => "You've already checked in here recently. You can check in again {$timeLeft}."
            ], 422);
        }
        
        $checkIn = CheckIn::create([
            'user_id' => $user->id,
            'place_id' => $request->place_id,
            'event_id' => $request->event_id,
            'checked_in_at' => Carbon::now(),
        ]);

        // Trigger Notification
        $entityName = $request->place_id 
            ? \App\Models\Place::find($request->place_id)->name 
            : \App\Models\Event::find($request->event_id)->title;

        \App\Models\Notification::create([
            'user_id' => $user->id,
            'type' => 'checkin',
            'title' => 'Checked In!',
            'message' => "You've successfully checked in at \"{$entityName}\". Keep exploring!",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Checked in successfully!',
            'data' => $checkIn
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = max(1, min((int) $request->integer('per_page', 15), 50));
        $checkIns = CheckIn::where('user_id', $user->id)
            ->where(function($q) {
                $q->whereHas('place')->orWhereHas('event');
            })
            ->with(['place', 'event'])
            ->orderBy('checked_in_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'status' => 'success',
            'data' => $checkIns->items(),
            'meta' => [
                'current_page' => $checkIns->currentPage(),
                'last_page' => $checkIns->lastPage(),
                'per_page' => $checkIns->perPage(),
                'total' => $checkIns->total(),
            ],
        ]);
    }

    public function status(Request $request)
    {
        $request->validate([
            'place_id' => 'nullable|exists:places,id',
            'event_id' => 'nullable|exists:events,id',
        ]);

        $user = $request->user();
        $query = CheckIn::where('user_id', $user->id);
        
        if ($request->place_id) {
            $query->where('place_id', $request->place_id);
        } else {
            $query->where('event_id', $request->event_id);
        }

        $lastCheckIn = $query->orderBy('checked_in_at', 'desc')->first();

        return response()->json([
            'status' => 'success',
            'last_check_in_at' => $lastCheckIn ? $lastCheckIn->checked_in_at : null
        ]);
    }
}
