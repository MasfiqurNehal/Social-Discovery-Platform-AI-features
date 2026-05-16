<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 150)->unique();
            $table->string('type', 30);
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('places', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('category')->constrained('categories')->nullOnDelete();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('category')->constrained('categories')->nullOnDelete();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('place_id')->nullable()->constrained('places')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->string('booking_reference', 40)->unique();
            $table->string('status', 30)->default('confirmed');
            $table->unsignedSmallInteger('party_size')->default(1);
            $table->timestamp('scheduled_for');
            $table->string('booking_channel', 30)->default('app');
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->string('currency', 3)->default('BDT');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('place_id')->nullable()->constrained('places')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->unsignedSmallInteger('score');
            $table->jsonb('dimensions')->nullable();
            $table->timestamps();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('channel', 30)->default('assistant');
            $table->string('status', 30)->default('active');
            $table->string('topic', 160)->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('last_message_at')->nullable();
            $table->jsonb('context')->nullable();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_role', 20);
            $table->string('message_type', 20)->default('text');
            $table->text('body');
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('search_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('query', 255);
            $table->jsonb('filters')->nullable();
            $table->unsignedInteger('result_count')->default(0);
            $table->string('clicked_entity_type', 20)->nullable();
            $table->unsignedBigInteger('clicked_entity_id')->nullable();
            $table->timestamp('searched_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('target_type', 20);
            $table->unsignedBigInteger('target_id');
            $table->string('source_type', 40)->default('hybrid');
            $table->string('algorithm_version', 40)->default('v1');
            $table->decimal('rank_score', 8, 4);
            $table->text('reason')->nullable();
            $table->jsonb('context')->nullable();
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('review_sentiments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->unique()->constrained('reviews')->cascadeOnDelete();
            $table->decimal('polarity_score', 5, 4);
            $table->decimal('confidence_score', 5, 4);
            $table->string('sentiment_label', 20);
            $table->string('emotion_label', 30)->nullable();
            $table->string('language_code', 10)->default('en');
            $table->jsonb('keywords')->nullable();
            $table->timestamp('analyzed_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('place_id')->nullable()->constrained('places')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->string('action', 40);
            $table->string('entity_type', 30)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('CREATE UNIQUE INDEX wishlist_items_unique_user_place ON wishlist_items (user_id, place_id) WHERE place_id IS NOT NULL');
        DB::statement('CREATE UNIQUE INDEX wishlist_items_unique_user_event ON wishlist_items (user_id, event_id) WHERE event_id IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS wishlist_items_unique_user_place');
        DB::statement('DROP INDEX IF EXISTS wishlist_items_unique_user_event');

        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('review_sentiments');
        Schema::dropIfExists('recommendations');
        Schema::dropIfExists('search_histories');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('bookings');

        Schema::table('events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });

        Schema::table('places', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });

        Schema::dropIfExists('categories');
    }
};
