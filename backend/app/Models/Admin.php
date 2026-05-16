<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $fillable = [
        'email',
        'password_hash',
        'display_name',
        'bio',
        'location',
        'profile_photo_url',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function places()
    {
        return $this->hasMany(Place::class, 'created_by');
    }
    public function events()
    {
        return $this->hasMany(Event::class, 'created_by');
    }
    public function blogPosts()
    {
        return $this->hasMany(BlogPost::class, 'author_id');
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }
}
