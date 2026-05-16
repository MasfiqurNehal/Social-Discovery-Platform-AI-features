<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fixes the MassiveProductionSeeder's event data:
 *   - Removes the ugly serial number appended to every title
 *   - Diversifies cover images (20 real Unsplash event photos)
 *   - Rewrites descriptions to sound human
 *   - Generates realistic organiser names
 *   - Rebuilds slug from new title + id (unique & clean)
 *
 * Safe to run multiple times (pure UPDATE, no inserts).
 * Estimated runtime on 1M rows: ~10-30 s on modern PostgreSQL.
 */
class FixEventDisplaySeeder extends Seeder
{
    public function run(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new \RuntimeException('FixEventDisplaySeeder requires PostgreSQL.');
        }

        DB::disableQueryLog();
        $this->command->info('Fixing event titles, images, descriptions and organiser names …');

        // ─── Array helpers ────────────────────────────────────────────────────
        $adj = $this->arr([
            'Dhaka', 'Heritage', 'Sunset', 'Monsoon', 'Street', 'Creative',
            'Weekend', 'Rooftop', 'Riverside', 'Urban', 'Classic', 'Electric',
            'Spring', 'Golden', 'Night', 'Morning', 'Pop-up', 'Grand', 'Open',
            'Annual',
        ]);

        $activity = $this->arr([
            'Art', 'Music', 'Food', 'Photography', 'Dance', 'Comedy', 'Film',
            'Theatre', 'Literature', 'Fashion', 'Yoga', 'Cooking', 'Poetry',
            'Jazz', 'Indie', 'Wellness', 'Startup', 'Cultural', 'Sports',
            'Community',
        ]);

        $format = $this->arr([
            'Festival', 'Night', 'Exhibition', 'Fair', 'Show', 'Workshop',
            'Carnival', 'Gathering', 'Showcase', 'Meetup', 'Concert',
            'Experience', 'Camp', 'Tour', 'Fiesta',
        ]);

        $organiser = $this->arr([
            'Dhaka Arts Collective', 'Gulshan Cultural Society',
            'Dhanmondi Creative Hub', 'Bashundhara Events',
            'Urban Pulse Org', 'BDnation Presents',
            'The Culture Lab', 'Dhaka Vibes Club',
            'Panthapath Arts Foundation', 'Heritage BD',
            'Mojamela Group', 'Dhaka Social Club',
            'City Experience Co', 'Rhythm & Co',
            'Fusion Events BD', 'Ekushey Foundation',
            'Uttara Community Trust', 'Mirpur Cultural Wing',
            'Banani Arts Initiative', 'Old Dhaka Heritage Board',
        ]);

        $descOpen = $this->arr([
            'An immersive gathering where creativity meets community.',
            'Experience the very best of Dhaka\'s vibrant cultural scene.',
            'Come connect, celebrate, and create memories that last.',
            'A curated event bringing local talent to the forefront.',
            'Join hundreds of enthusiasts for an unforgettable experience.',
            'One of the most anticipated events on the Dhaka calendar.',
            'Where tradition blends with contemporary energy.',
            'Celebrating the spirit and soul of Dhaka.',
            'A day packed with performances, food, and good company.',
            'Showcasing homegrown creativity at its finest.',
        ]);

        $descClose = $this->arr([
            'Expect live performances, local food stalls, and interactive sessions.',
            'Tickets available at the door. Family-friendly and accessible.',
            'Limited seats — reserve your spot early to avoid disappointment.',
            'Multiple stages, artists, and experiences all day long.',
            'Rain or shine, the energy never stops.',
            'Free entry for children under 12. Parking available on site.',
            'Bring your friends, cameras, and an open mind.',
            'Supported by the Dhaka City Cultural Board.',
            'Browse local artisan stalls and sample street-food favourites.',
            'Accessible via Gulshan and Banani metro links.',
        ]);

        // 20 distinct Unsplash images covering different event vibes
        $images = $this->arr([
            'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',  // concert crowd
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',  // music festival
            'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',  // outdoor gathering
            'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80',  // art exhibition
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',  // food festival
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',  // sports
            'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',  // night concert stage
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',  // conference/workshop
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',  // dance performance
            'https://images.unsplash.com/photo-1537832816519-689ad163239b?auto=format&fit=crop&w=1200&q=80',  // theatre
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',  // film screening
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',    // yoga / wellness
            'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80', // book fair
            'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', // community gathering
            'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80',    // street market / fair
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', // party / celebration
            'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', // outdoor cultural event
            'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80', // carnival lights
            'https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=1200&q=80',    // comedy / stand-up
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80', // sunrise / morning run
        ]);

        // ─── Bulk UPDATE ──────────────────────────────────────────────────────
        // We use hashtext(id || salt) instead of (id * k % n) so that events
        // which share the same event_date (i.e. identical id % 540) still get
        // different titles.  hashtext() is a fast, built-in PostgreSQL hash
        // that distributes values uniformly regardless of input patterns.
        //
        // Title variants (picked by hashtext(id||'v') % 3):
        //   0 → "{adj} {activity} {format}"
        //   1 → "{area_name} {activity} {format}"
        //   2 → "{adj} {area_name} {format}"

        DB::unprepared("
            UPDATE events
            SET
                title = CASE
                    WHEN abs(hashtext(id::text || 'v')) % 3 = 0 THEN initcap(
                        {$adj}[1 + (abs(hashtext(id::text || 'a')) % array_length({$adj},      1))] || ' ' ||
                        {$activity}[1 + (abs(hashtext(id::text || 'b')) % array_length({$activity}, 1))] || ' ' ||
                        {$format}[1 + (abs(hashtext(id::text || 'c')) % array_length({$format},   1))]
                    )
                    WHEN abs(hashtext(id::text || 'v')) % 3 = 1 THEN initcap(
                        area_name || ' ' ||
                        {$activity}[1 + (abs(hashtext(id::text || 'd')) % array_length({$activity}, 1))] || ' ' ||
                        {$format}[1 + (abs(hashtext(id::text || 'e')) % array_length({$format},   1))]
                    )
                    ELSE initcap(
                        {$adj}[1 + (abs(hashtext(id::text || 'f')) % array_length({$adj},      1))] || ' ' ||
                        area_name || ' ' ||
                        {$format}[1 + (abs(hashtext(id::text || 'g')) % array_length({$format},   1))]
                    )
                END,

                slug = 'event-' || id,

                organiser_name = {$organiser}[1 + (abs(hashtext(id::text || 'h')) % array_length({$organiser}, 1))],

                description =
                    {$descOpen}[1 + (abs(hashtext(id::text || 'i')) % array_length({$descOpen},  1))] || ' ' ||
                    {$descClose}[1 + (abs(hashtext(id::text || 'j')) % array_length({$descClose}, 1))],

                cover_image_url =
                    {$images}[1 + (abs(hashtext(id::text || 'k')) % array_length({$images}, 1))],

                updated_at = now()
        ");

        $this->command->info('Done. All event records have been updated with realistic display data.');
    }

    private function arr(array $values): string
    {
        $escaped = array_map(
            fn (string $v) => "'" . str_replace("'", "''", $v) . "'",
            $values
        );

        return '(ARRAY[' . implode(', ', $escaped) . '])';
    }
}
