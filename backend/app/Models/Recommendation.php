<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'target_type',
        'target_id',
        'source_type',
        'algorithm_version',
        'rank_score',
        'reason',
        'context',
        'generated_at',
        'created_at',
    ];

    protected $casts = [
        'rank_score' => 'decimal:4',
        'context' => 'array',
        'generated_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
