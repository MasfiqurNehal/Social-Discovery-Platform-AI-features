<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BlogPost extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'author_id',
        'featured_image_url',
        'body',
        'tags',
        'related_place_ids',
        'is_published',
        'is_featured',
        'published_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'related_place_ids' => 'array',
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(Admin::class, 'author_id');
    }
}
