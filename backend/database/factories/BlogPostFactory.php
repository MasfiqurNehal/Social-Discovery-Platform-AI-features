<?php

namespace Database\Factories;

use App\Models\BlogPost;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BlogPostFactory extends Factory
{
    protected $model = BlogPost::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(6);
        return [
            'title' => $title,
            'author_id' => Admin::factory(),
            'featured_image_url' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            'body' => implode("\n\n", $this->faker->paragraphs(5)),
            'tags' => [$this->faker->word(), $this->faker->word()],
            'is_published' => true,
            'published_at' => now()->subDays(rand(1, 30)),
        ];
    }
}
