<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ManagePlacesController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 50));
        $query = Place::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'ilike', "%{$search}%")
                    ->orWhere('category', 'ilike', "%{$search}%")
                    ->orWhere('area_name', 'ilike', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'created_desc');
        if ($sort === 'created_asc') {
            $query->orderBy('created_at', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $places = $query->paginate($perPage)->withQueryString();
        return response()->json([
            'status' => 'success',
            'data' => $places->items(),
            'meta' => [
                'total' => $places->total(),
                'current_page' => $places->currentPage(),
                'last_page' => $places->lastPage(),
                'per_page' => $places->perPage(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'area_name' => 'required|string|in:' . implode(',', Place::DHAKA_THANAS),
            'address' => 'required|string',
            'description' => 'required|string',
            'cover_image_url' => 'nullable|string',
            'budget_tier' => 'nullable|string',
            'budget_label' => 'nullable|string',
            'budget_range' => 'nullable|string',
            'tags' => 'nullable|array',
            'operating_hours' => 'nullable|array',
            'is_published' => 'boolean',
        ]);

        $user = $request->user();
        $adminId = $user instanceof \App\Models\Admin ? $user->id : \App\Models\Admin::first()->id;

        $placeData = $validated;
        $placeData['created_by'] = $adminId;
        $placeData['area_zone'] = 'DNCC'; // Default zone

        $place = Place::create($placeData);

        return response()->json([
            'status' => 'success',
            'data' => $place
        ], 201);
    }

    public function show($id)
    {
        $place = Place::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $place
        ]);
    }

    public function update(Request $request, $id)
    {
        $place = Place::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string',
            'area_name' => 'sometimes|required|string|in:' . implode(',', Place::DHAKA_THANAS),
            'address' => 'sometimes|required|string',
            'description' => 'sometimes|required|string',
            'cover_image_url' => 'nullable|string',
            'budget_tier' => 'nullable|string',
            'budget_label' => 'nullable|string',
            'budget_range' => 'nullable|string',
            'tags' => 'nullable|array',
            'operating_hours' => 'nullable|array',
            'is_published' => 'boolean',
        ]);

        $place->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $place
        ]);
    }

    public function destroy($id)
    {
        $place = Place::findOrFail($id);
        $place->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Place deleted successfully'
        ]);
    }
}
