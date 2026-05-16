<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ManageBlogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 50));
        $query = BlogPost::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('title', 'ilike', "%{$search}%");
        }

        $sort = $request->input('sort', 'created_desc');
        if ($sort === 'created_asc') {
            $query->orderBy('created_at', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $posts = $query->paginate($perPage)->withQueryString();
        return response()->json([
            'status' => 'success',
            'data' => $posts->items(),
            'meta' => [
                'total' => $posts->total(),
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'cover_image_url' => 'nullable|string',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'string'
        ]);

        $user = $request->user();
        $authorId = $user instanceof \App\Models\Admin ? $user->id : \App\Models\Admin::first()->id;

        if ($validated['is_featured'] ?? false) {
            BlogPost::query()->update(['is_featured' => false]);
        }

        $postData = [
            'title' => $validated['title'],
            'body' => $validated['content'],
            'excerpt' => $validated['excerpt'] ?? null,
            'featured_image_url' => $validated['cover_image_url'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
            'is_featured' => $validated['is_featured'] ?? false,
            'tags' => $validated['tags'] ?? [],
            'author_id' => $authorId,
            'slug' => Str::slug($validated['title']) . '-' . rand(1000, 9999),
        ];

        if ($postData['is_published']) {
            $postData['published_at'] = now();
        }
        
        $post = BlogPost::create($postData);

        return response()->json([
            'status' => 'success',
            'data' => $post
        ], 201);
    }

    public function show($id)
    {
        $post = BlogPost::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $post
        ]);
    }

    public function update(Request $request, $id)
    {
        $post = BlogPost::findOrFail($id);
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'excerpt' => 'nullable|string',
            'cover_image_url' => 'nullable|string',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'string'
        ]);

        $updateData = [];
        if (isset($validated['title'])) $updateData['title'] = $validated['title'];
        if (isset($validated['content'])) $updateData['body'] = $validated['content'];
        if (isset($validated['excerpt'])) $updateData['excerpt'] = $validated['excerpt'];
        if (isset($validated['cover_image_url'])) $updateData['featured_image_url'] = $validated['cover_image_url'];
        if (isset($validated['tags'])) $updateData['tags'] = $validated['tags'];
        if (isset($validated['is_published'])) {
            $updateData['is_published'] = $validated['is_published'];
            if ($validated['is_published'] && !$post->published_at) {
                $updateData['published_at'] = now();
            }
        }

        if (isset($validated['is_featured'])) {
            if ($validated['is_featured']) {
                // Remove featured status from all other posts
                BlogPost::where('id', '!=', $id)->update(['is_featured' => false]);
            }
            $updateData['is_featured'] = $validated['is_featured'];
        }

        $post->update($updateData);

        return response()->json([
            'status' => 'success',
            'data' => $post
        ]);
    }

    public function destroy($id)
    {
        $post = BlogPost::findOrFail($id);
        $post->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Blog post deleted successfully'
        ]);
    }
}
