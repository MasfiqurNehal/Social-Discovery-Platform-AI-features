<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Place;

class UpdateBudgetTierSeeder extends Seeder
{
    public function run()
    {
        Place::where('budget_tier', 'LIKE', '%$%')->get()->each(function ($place) {
            $place->budget_tier = str_replace('$', '৳', $place->budget_tier);
            $place->save();
        });
    }
}
