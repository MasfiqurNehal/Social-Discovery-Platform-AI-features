<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'query',
        'filters',
        'result_count',
        'clicked_entity_type',
        'clicked_entity_id',
        'searched_at',
        'created_at',
    ];

    protected $casts = [
        'filters' => 'array',
        'searched_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
