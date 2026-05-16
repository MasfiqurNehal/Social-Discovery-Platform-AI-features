<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (config('app.env') === 'production') {
            return;
        }

        if (env('VIBESPOT_SEED_MASSIVE', false)) {
            $this->call(MassiveProductionSeeder::class);
            return;
        }

        $this->call(UpdateBudgetTierSeeder::class);
    }
}
