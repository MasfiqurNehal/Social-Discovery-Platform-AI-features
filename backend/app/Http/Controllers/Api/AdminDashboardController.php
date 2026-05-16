<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use App\Models\Event;
use App\Models\User;
use App\Models\Review;
use App\Models\CheckIn;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $last14Days = collect(range(0, 13))->map(function ($i) {
            return Carbon::now()->subDays($i)->format('Y-m-d');
        })->reverse()->values();

        $last7Days = collect(range(0, 6))->map(function ($i) {
            return Carbon::now()->subDays($i)->format('Y-m-d');
        })->reverse()->values();

        // 14-day user growth trend
        $userGrowth = $last14Days->map(function ($date) {
            return [
                'date'  => Carbon::parse($date)->format('M d'),
                'users' => User::whereDate('created_at', $date)->count(),
            ];
        });

        // 7-day reviews + check-ins combined activity
        $recentActivity = $last7Days->map(function ($date) {
            return [
                'date'     => Carbon::parse($date)->format('M d'),
                'reviews'  => Review::whereDate('created_at', $date)->count(),
                'checkins' => CheckIn::whereDate('checked_in_at', $date)->count(),
            ];
        });

        // Category distribution for places
        $categoryDistribution = Place::selectRaw('category, count(*) as count')
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        // Rating distribution (1–5 stars)
        $ratingDistribution = collect([1, 2, 3, 4, 5])->map(function ($star) {
            return [
                'star'  => $star,
                'label' => $star . ' Star',
                'count' => Review::where('rating', $star)->count(),
            ];
        });

        // Top 5 highest-rated published places
        $topPlaces = Place::where('is_published', true)
            ->where('total_reviews', '>', 0)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->take(5)
            ->select(['name', 'category', 'average_rating', 'total_reviews', 'area_name'])
            ->get();

        // Top 8 areas by place count
        $areaDistribution = Place::selectRaw('area_name, count(*) as count')
            ->whereNotNull('area_name')
            ->groupBy('area_name')
            ->orderByDesc('count')
            ->take(8)
            ->get();

        // Event category breakdown
        $eventCategoryDistribution = Event::selectRaw('category, count(*) as count')
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        // Published vs draft content
        $publishedStats = [
            'places_published' => Place::where('is_published', true)->count(),
            'places_draft'     => Place::where('is_published', false)->count(),
            'events_published' => Event::where('is_published', true)->count(),
            'events_draft'     => Event::where('is_published', false)->count(),
        ];

        $stats = [
            'total_users'                => User::count(),
            'total_places'               => Place::count(),
            'total_events'               => Event::count(),
            'total_reviews'              => Review::count(),
            'total_checkins'             => CheckIn::count(),
            'blog_count'                 => BlogPost::count(),
            'active_users'               => User::where('review_count', '>', 0)->count(),
            'avg_platform_rating'        => round(Review::avg('rating') ?? 0, 1),
            'user_growth'                => $userGrowth,
            'recent_activity'            => $recentActivity,
            'category_distribution'      => $categoryDistribution,
            'rating_distribution'        => $ratingDistribution,
            'top_places'                 => $topPlaces,
            'area_distribution'          => $areaDistribution,
            'event_category_distribution'=> $eventCategoryDistribution,
            'published_stats'            => $publishedStats,
        ];

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }
}
