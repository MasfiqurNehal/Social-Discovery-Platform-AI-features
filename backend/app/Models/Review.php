<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Review extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'user_id',
        'reviewable_type',
        'place_id',
        'event_id',
        'rating',
        'body',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function place()
    {
        return $this->belongsTo(Place::class);
    }
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    public function sentiment()
    {
        return $this->hasOne(ReviewSentiment::class);
    }
}
