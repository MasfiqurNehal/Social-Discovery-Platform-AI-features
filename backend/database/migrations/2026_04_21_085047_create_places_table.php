<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('category', 50);
            $table->string('area_name', 100);
            $table->string('area_zone', 10);
            $table->text('address');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('description')->nullable();
            $table->string('cover_image_url', 500)->nullable();
            $table->jsonb('images')->nullable();
            $table->jsonb('operating_hours')->nullable();
            $table->jsonb('tags')->nullable();
            $table->string('budget_tier', 20)->nullable();
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->boolean('is_published')->default(false);
            $table->foreignId('created_by')->constrained('admins')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};
