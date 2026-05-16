<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ChatbotController;
// use App\Http\Controllers\Api\WishlistController; (Commented to force IDE refresh)

use App\Http\Controllers\Api\AuthController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/admin-login', [AuthController::class, 'adminLogin']);
Route::post('/chatbot/ask-public', [ChatbotController::class, 'askPublic']);

Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\AdminDashboardController::class, 'stats']);
        
        // Places Management
        Route::apiResource('places', \App\Http\Controllers\Api\Admin\ManagePlacesController::class);
        
        // Events Management
        Route::apiResource('events', \App\Http\Controllers\Api\Admin\ManageEventsController::class);
        
        // Users Management
        Route::get('/users', [\App\Http\Controllers\Api\Admin\ManageUsersController::class, 'index']);
        Route::post('/users/{id}/toggle-status', [\App\Http\Controllers\Api\Admin\ManageUsersController::class, 'toggleStatus']);
        Route::post('/recommendations/train', [RecommendationController::class, 'train']);
        
        // Blog Management
        Route::apiResource('blog-posts', \App\Http\Controllers\Api\Admin\ManageBlogController::class);
        
        // Reviews Management
        Route::apiResource('reviews', \App\Http\Controllers\Api\Admin\ManageReviewsController::class)->only(['index', 'destroy']);
    });
    
    // User routes
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::get('/profile/activity', [ProfileController::class, 'activity']);
    
    Route::post('/wishlist/toggle', [\App\Http\Controllers\Api\WishlistController::class, 'toggle']);
    Route::get('/wishlist/ids', [\App\Http\Controllers\Api\WishlistController::class, 'ids']);
    Route::get('/wishlist', [\App\Http\Controllers\Api\WishlistController::class, 'index']);
    
    Route::post('/check-ins', [\App\Http\Controllers\Api\CheckInController::class, 'store']);
    Route::get('/check-ins', [\App\Http\Controllers\Api\CheckInController::class, 'index']);
    Route::get('/check-ins/status', [\App\Http\Controllers\Api\CheckInController::class, 'status']);

    Route::get('/recommendations', [RecommendationController::class, 'recommend']);
    Route::post('/recommendations', [RecommendationController::class, 'recommend']);
    Route::post('/chatbot/ask', [ChatbotController::class, 'ask']);
    Route::get('/chatbot/conversations/{conversationId}/messages', [ChatbotController::class, 'history']);

    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/clear-all', [\App\Http\Controllers\Api\NotificationController::class, 'clearAll']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/discovery/stats', [PlaceController::class, 'stats']);
Route::get('/places', [PlaceController::class, 'index']);
Route::get('/places/{id}', [PlaceController::class, 'show']);

Route::get('/blog', [BlogController::class, 'index']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);

Route::get('/reviews', [ReviewController::class, 'index']);
