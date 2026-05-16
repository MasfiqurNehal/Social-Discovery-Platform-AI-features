<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'email',
        'password_hash',
        'display_name',
        'bio',
        'location',
        'profile_photo_url',
        'is_active',
        'google_oauth_id',
        'clerk_id',
        'review_count',
        'wishlist_count',
    ];

    protected $appends = ['last_check_in_at'];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
    public function checkIns()
    {
        return $this->hasMany(CheckIn::class);
    }
    public function wishlistItems()
    {
        return $this->hasMany(WishlistItem::class);
    }
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
    public function searchHistories()
    {
        return $this->hasMany(SearchHistory::class);
    }
    public function recommendations()
    {
        return $this->hasMany(Recommendation::class);
    }
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function getLastCheckInAtAttribute()
    {
        return $this->checkIns()->latest('checked_in_at')->value('checked_in_at');
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }
}
