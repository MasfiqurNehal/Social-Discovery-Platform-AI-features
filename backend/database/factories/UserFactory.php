<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'display_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            'bio' => fake()->optional()->sentence(),
            'location' => fake()->optional()->city(),
            'profile_photo_url' => fake()->optional()->imageUrl(200, 200, 'people'),
            'is_active' => true,
            'google_oauth_id' => null,
            'clerk_id' => null,
            'review_count' => 0,
            'wishlist_count' => 0,
        ];
    }
}
