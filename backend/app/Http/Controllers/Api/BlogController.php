<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->integer('per_page', 12), 36));
        $posts = BlogPost::with('author')
            ->where('is_published', true)
            ->orderBy('published_at', 'desc')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'featured_image_url' => $post->featured_image_url,
                    'tags' => $post->tags,
                    'author_name' => $post->author->display_name ?? 'VibeSpot',
                    'published_at' => $post->published_at?->toDateString(),
                    'excerpt' => str($post->body)->words(30)->toString(),
                    'is_featured' => $post->is_featured,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $posts->items(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function show(string $slug)
    {
        $post = BlogPost::with('author')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'featured_image_url' => $post->featured_image_url,
                'body' => $post->body,
                'tags' => $post->tags,
                'author_name' => $post->author->display_name ?? 'VibeSpot',
                'published_at' => $post->published_at?->toDateString(),
            ],
        ]);
    }
}
