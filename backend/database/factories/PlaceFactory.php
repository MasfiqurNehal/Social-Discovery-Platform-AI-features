<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Place;
use App\Models\Admin;

class PlaceFactory extends Factory
{
    protected $model = Place::class;

    public function definition(): array
    {
        return [
            'name' => 'The ' . $this->faker->word() . ' Cafe',
            'category' => $this->faker->randomElement(['Food & Drinks', 'Entertainment', 'Culture', 'Outdoors']),
            'area_name' => $this->faker->randomElement(['Gulshan', 'Banani', 'Dhanmondi', 'Mirpur']),
            'area_zone' => $this->faker->randomElement(['DNCC', 'DSCC']),
            'address' => $this->faker->streetAddress(),
            'description' => $this->faker->paragraph(),
            'cover_image_url' => 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
            'budget_tier' => $this->faker->randomElement(['$', '$$', '$$$']),
            'average_rating' => $this->faker->randomFloat(2, 3, 5),
            'total_reviews' => $this->faker->numberBetween(10, 500),
            'is_published' => true,
            'created_by' => Admin::factory(),
        ];
    }
}
