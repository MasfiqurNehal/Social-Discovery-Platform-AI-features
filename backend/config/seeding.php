<?php

return [
    'massive' => [
        'admins' => (int) env('VIBESPOT_SEED_ADMINS', 50),
        'users' => (int) env('VIBESPOT_SEED_USERS', 1000000),
        'places' => (int) env('VIBESPOT_SEED_PLACES', 1000000),
        'events' => (int) env('VIBESPOT_SEED_EVENTS', 1000000),
        'bookings' => (int) env('VIBESPOT_SEED_BOOKINGS', 1000000),
        'reviews' => (int) env('VIBESPOT_SEED_REVIEWS', 1000000),
        'ratings' => (int) env('VIBESPOT_SEED_RATINGS', 1000000),
        'wishlist_items' => (int) env('VIBESPOT_SEED_WISHLIST_ITEMS', 1000000),
        'check_ins' => (int) env('VIBESPOT_SEED_CHECK_INS', 1000000),
        'notifications' => (int) env('VIBESPOT_SEED_NOTIFICATIONS', 1000000),
        'search_histories' => (int) env('VIBESPOT_SEED_SEARCH_HISTORIES', 1000000),
        'recommendations' => (int) env('VIBESPOT_SEED_RECOMMENDATIONS', 1000000),
        'activity_logs' => (int) env('VIBESPOT_SEED_ACTIVITY_LOGS', 1000000),
        'conversations' => (int) env('VIBESPOT_SEED_CONVERSATIONS', 250000),
        'messages' => (int) env('VIBESPOT_SEED_MESSAGES', 1000000),
        'blog_posts' => (int) env('VIBESPOT_SEED_BLOG_POSTS', 50000),
    ],
];
