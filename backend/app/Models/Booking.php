<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'place_id',
        'event_id',
        'booking_reference',
        'status',
        'party_size',
        'scheduled_for',
        'booking_channel',
        'amount_paid',
        'currency',
        'metadata',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'amount_paid' => 'decimal:2',
        'metadata' => 'array',
    ];
}
