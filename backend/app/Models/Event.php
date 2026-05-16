<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'place_id',
        'category',
        'category_id',
        'area_name',
        'area_zone',
        'organiser_name',
        'description',
        'cover_image_url',
        'event_date',
        'end_date',
        'start_time',
        'end_time',
        'average_rating',
        'total_reviews',
        'price_type',
        'price_amount',
        'ticket_url',
        'is_published',
        'created_by',
    ];

    protected $casts = [
        'event_date' => 'date',
        'end_date' => 'date',
        'average_rating' => 'decimal:2',
        'is_published' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
    public function categoryRef()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
    public function place()
    {
        return $this->belongsTo(Place::class);
    }
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
    public function wishlistItems()
    {
        return $this->hasMany(WishlistItem::class);
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
}
