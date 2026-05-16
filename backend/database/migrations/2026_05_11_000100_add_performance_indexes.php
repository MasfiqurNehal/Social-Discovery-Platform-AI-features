<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index(['is_active', 'created_at'], 'users_active_created_idx');
            $table->index('location', 'users_location_idx');
        });

        Schema::table('places', function (Blueprint $table) {
            $table->index(['is_published', 'average_rating'], 'places_published_rating_idx');
            $table->index(['is_published', 'created_at'], 'places_published_created_idx');
            $table->index(['category', 'area_name'], 'places_category_area_idx');
            $table->index('area_zone', 'places_area_zone_idx');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->index(['is_published', 'event_date'], 'events_published_date_idx');
            $table->index(['is_published', 'average_rating'], 'events_published_rating_idx');
            $table->index(['category', 'area_name'], 'events_category_area_idx');
            $table->index('place_id', 'events_place_idx');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index(['place_id', 'created_at'], 'reviews_place_created_idx');
            $table->index(['event_id', 'created_at'], 'reviews_event_created_idx');
            $table->index(['user_id', 'created_at'], 'reviews_user_created_idx');
        });

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->index(['user_id', 'added_at'], 'wishlist_user_added_idx');
        });

        Schema::table('check_ins', function (Blueprint $table) {
            $table->index(['user_id', 'checked_in_at'], 'checkins_user_time_idx');
            $table->index(['place_id', 'checked_in_at'], 'checkins_place_time_idx');
            $table->index(['event_id', 'checked_in_at'], 'checkins_event_time_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'notifications_user_created_idx');
            $table->index(['user_id', 'is_read', 'created_at'], 'notifications_user_read_idx');
        });

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->index(['is_published', 'published_at'], 'blog_posts_published_idx');
            $table->index('is_featured', 'blog_posts_featured_idx');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['user_id', 'scheduled_for'], 'bookings_user_scheduled_idx');
            $table->index(['place_id', 'scheduled_for'], 'bookings_place_scheduled_idx');
            $table->index(['event_id', 'scheduled_for'], 'bookings_event_scheduled_idx');
            $table->index('status', 'bookings_status_idx');
        });

        Schema::table('ratings', function (Blueprint $table) {
            $table->index(['place_id', 'score'], 'ratings_place_score_idx');
            $table->index(['event_id', 'score'], 'ratings_event_score_idx');
            $table->index(['user_id', 'created_at'], 'ratings_user_created_idx');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->index(['user_id', 'last_message_at'], 'conversations_user_last_message_idx');
            $table->index('status', 'conversations_status_idx');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at'], 'messages_conversation_created_idx');
            $table->index(['user_id', 'created_at'], 'messages_user_created_idx');
        });

        Schema::table('search_histories', function (Blueprint $table) {
            $table->index(['user_id', 'searched_at'], 'search_histories_user_time_idx');
            $table->index('query', 'search_histories_query_idx');
        });

        Schema::table('recommendations', function (Blueprint $table) {
            $table->index(['user_id', 'generated_at'], 'recommendations_user_generated_idx');
            $table->index(['target_type', 'target_id'], 'recommendations_target_idx');
        });

        Schema::table('review_sentiments', function (Blueprint $table) {
            $table->index('sentiment_label', 'review_sentiments_label_idx');
            $table->index('emotion_label', 'review_sentiments_emotion_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'activity_logs_user_created_idx');
            $table->index(['action', 'created_at'], 'activity_logs_action_created_idx');
            $table->index(['entity_type', 'entity_id'], 'activity_logs_entity_idx');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_user_created_idx');
            $table->dropIndex('activity_logs_action_created_idx');
            $table->dropIndex('activity_logs_entity_idx');
        });

        Schema::table('review_sentiments', function (Blueprint $table) {
            $table->dropIndex('review_sentiments_label_idx');
            $table->dropIndex('review_sentiments_emotion_idx');
        });

        Schema::table('recommendations', function (Blueprint $table) {
            $table->dropIndex('recommendations_user_generated_idx');
            $table->dropIndex('recommendations_target_idx');
        });

        Schema::table('search_histories', function (Blueprint $table) {
            $table->dropIndex('search_histories_user_time_idx');
            $table->dropIndex('search_histories_query_idx');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_conversation_created_idx');
            $table->dropIndex('messages_user_created_idx');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex('conversations_user_last_message_idx');
            $table->dropIndex('conversations_status_idx');
        });

        Schema::table('ratings', function (Blueprint $table) {
            $table->dropIndex('ratings_place_score_idx');
            $table->dropIndex('ratings_event_score_idx');
            $table->dropIndex('ratings_user_created_idx');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('bookings_user_scheduled_idx');
            $table->dropIndex('bookings_place_scheduled_idx');
            $table->dropIndex('bookings_event_scheduled_idx');
            $table->dropIndex('bookings_status_idx');
        });

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropIndex('blog_posts_published_idx');
            $table->dropIndex('blog_posts_featured_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_created_idx');
            $table->dropIndex('notifications_user_read_idx');
        });

        Schema::table('check_ins', function (Blueprint $table) {
            $table->dropIndex('checkins_user_time_idx');
            $table->dropIndex('checkins_place_time_idx');
            $table->dropIndex('checkins_event_time_idx');
        });

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropIndex('wishlist_user_added_idx');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_place_created_idx');
            $table->dropIndex('reviews_event_created_idx');
            $table->dropIndex('reviews_user_created_idx');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_published_date_idx');
            $table->dropIndex('events_published_rating_idx');
            $table->dropIndex('events_category_area_idx');
            $table->dropIndex('events_place_idx');
        });

        Schema::table('places', function (Blueprint $table) {
            $table->dropIndex('places_published_rating_idx');
            $table->dropIndex('places_published_created_idx');
            $table->dropIndex('places_category_area_idx');
            $table->dropIndex('places_area_zone_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_active_created_idx');
            $table->dropIndex('users_location_idx');
        });
    }
};
