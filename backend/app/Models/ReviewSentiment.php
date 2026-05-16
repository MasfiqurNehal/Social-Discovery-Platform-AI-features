<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReviewSentiment extends Model
{
    use HasFactory;

    protected $fillable = [
        'review_id',
        'polarity_score',
        'confidence_score',
        'sentiment_label',
        'emotion_label',
        'language_code',
        'keywords',
        'analyzed_at',
    ];

    protected $casts = [
        'polarity_score' => 'decimal:4',
        'confidence_score' => 'decimal:4',
        'keywords' => 'array',
        'analyzed_at' => 'datetime',
    ];
}
