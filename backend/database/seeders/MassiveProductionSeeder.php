<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MassiveProductionSeeder extends Seeder
{
    private array $categoryNames = [
        'place' => [
            'Food & Drinks',
            'Landmarks & Heritage',
            'Outdoors',
            'Culture',
            'Shopping',
            'Cinema & Screenings',
            'Nightlife',
            'Wellness',
            'Family & Kids',
            'Sports & Fitness',
        ],
        'event' => [
            'Culture',
            'Entertainment',
            'Food & Drinks',
            'Workshops',
            'Community',
            'Nightlife',
            'Cinema & Screenings',
            'Sports & Fitness',
        ],
    ];

    public function run(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new \RuntimeException('MassiveProductionSeeder requires PostgreSQL.');
        }

        DB::disableQueryLog();

        $counts = config('seeding.massive');

        $this->seedCategories();
        $this->seedAdmins($counts['admins']);
        $this->seedUsers($counts['users']);
        $this->seedPlaces($counts['places']);
        $this->seedEvents($counts['events']);
        $this->seedBlogPosts($counts['blog_posts']);
        $this->seedReviews($counts['reviews']);
        $this->seedReviewSentiments();
        $this->seedRatings($counts['ratings']);
        $this->seedWishlistItems($counts['wishlist_items']);
        $this->seedCheckIns($counts['check_ins']);
        $this->seedNotifications($counts['notifications']);
        $this->seedBookings($counts['bookings']);
        $this->seedSearchHistories($counts['search_histories']);
        $this->seedRecommendations($counts['recommendations']);
        $this->seedConversations($counts['conversations']);
        $this->seedMessages($counts['messages']);
        $this->seedActivityLogs($counts['activity_logs']);
        $this->refreshCounters();

        DB::statement('ANALYZE');
    }

    private function seedCategories(): void
    {
        $rows = [];

        foreach ($this->categoryNames as $type => $categories) {
            foreach ($categories as $name) {
                $rows[] = [
                    'name' => $name,
                    'slug' => strtolower(str_replace([' & ', ' '], ['-', '-'], $type . '-' . $name)),
                    'type' => $type,
                    'description' => $name . ' category for discovery and AI-ready recommendation workflows.',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('categories')->upsert($rows, ['slug'], ['name', 'type', 'description', 'is_active', 'updated_at']);
    }

    private function seedAdmins(int $count): void
    {
        $rows = [];

        for ($i = 1; $i <= $count; $i++) {
            $rows[] = [
                'email' => $i === 1 ? 'admin@vibespot.com' : "editor{$i}@vibespot.com",
                'password_hash' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                'display_name' => $i === 1 ? 'VibeSpot Editorial' : "VibeSpot Admin {$i}",
                'bio' => 'Operations and editorial account used for production-style seeded content.',
                'location' => 'Dhaka',
                'profile_photo_url' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('admins')->upsert($rows, ['email'], ['display_name', 'bio', 'location', 'is_active', 'updated_at']);
    }

    private function seedUsers(int $count): void
    {
        $first = $this->sqlArray(['Arif', 'Nadia', 'Karim', 'Maliha', 'Tanvir', 'Rafi', 'Sadia', 'Jisan', 'Farhana', 'Shuvo', 'Ayesha', 'Nabil', 'Tania', 'Muntasir', 'Sohana', 'Mehedi', 'Raisa', 'Adnan', 'Tahsin', 'Anika']);
        $last = $this->sqlArray(['Rahman', 'Hossain', 'Uddin', 'Chowdhury', 'Ahmed', 'Khan', 'Islam', 'Sarker', 'Bari', 'Haque', 'Roy', 'Arefin', 'Mahmud', 'Kabir', 'Hasan', 'Sultana', 'Miah', 'Azad', 'Noor', 'Shikder']);
        $domains = $this->sqlArray(['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'proton.me']);
        $locations = $this->sqlArray(['Gulshan, Dhaka', 'Dhanmondi, Dhaka', 'Banani, Dhaka', 'Uttara, Dhaka', 'Mirpur, Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Narayanganj', 'Cumilla', 'Kuala Lumpur', 'Bangkok', 'Singapore', 'London', 'Toronto', 'Melbourne']);

        $this->statement("
            INSERT INTO users (
                email, password_hash, display_name, bio, location, profile_photo_url,
                is_active, google_oauth_id, clerk_id, review_count, wishlist_count, created_at, updated_at
            )
            SELECT
                lower(first_name || '.' || last_name || gs || '@' || domain_name),
                '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                initcap(first_name || ' ' || last_name),
                'Enjoys discovering new hangout spots, weekend plans, and community recommendations.',
                home_location,
                'https://api.dicebear.com/7.x/initials/svg?seed=' || gs,
                CASE WHEN gs % 23 = 0 THEN false ELSE true END,
                NULL,
                NULL,
                0,
                0,
                now() - ((gs % 720) || ' days')::interval - (((gs * 17) % 86400) || ' seconds')::interval,
                now() - ((gs % 720) || ' days')::interval - (((gs * 17) % 86400) || ' seconds')::interval
            FROM generate_series(1, {$count}) AS gs
            CROSS JOIN LATERAL (
                SELECT
                    {$first}[1 + ((gs * 3) % array_length({$first}, 1))] AS first_name,
                    {$last}[1 + ((gs * 7) % array_length({$last}, 1))] AS last_name,
                    {$domains}[1 + ((gs * 5) % array_length({$domains}, 1))] AS domain_name,
                    {$locations}[1 + ((gs * 11) % array_length({$locations}, 1))] AS home_location
            ) AS pick
        ");
    }

    private array $categoryImages = [
        'Food & Drinks'        => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        'Landmarks & Heritage' => 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
        'Outdoors'             => 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
        'Culture'              => 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80',
        'Shopping'             => 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80',
        'Cinema & Screenings'  => 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
        'Nightlife'            => 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1200&q=80',
        'Wellness'             => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
        'Family & Kids'        => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
        'Sports & Fitness'     => 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
        'Entertainment'        => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    ];

    private function seedPlaces(int $count): void
    {
        $categoryMap = $this->categoryIdMap('place');
        $categories = array_keys($categoryMap);
        $areas = $this->sqlArray(['Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Old Dhaka', 'Panthapath', 'Mohakhali', 'Bashundhara', 'Tejgaon', 'Chattogram', 'Sylhet', 'Coxs Bazar', 'Rajshahi', 'Khulna', 'Singapore', 'Bangkok', 'Kuala Lumpur']);
        $zones = $this->sqlArray(['DNCC', 'DSCC', 'CTG', 'SYL', 'RAJ', 'KHU', 'INTL']);
        $adjectives = $this->sqlArray(['North', 'Golden', 'Skyline', 'Urban', 'Riverfront', 'Garden', 'Lakeside', 'Heritage', 'Sunset', 'Metro']);
        $nouns = $this->sqlArray(['Cafe', 'Lounge', 'Market', 'Gallery', 'Park', 'Plaza', 'Studio', 'Bistro', 'Arena', 'Collective']);
        $categoryCase = $this->categoryCaseSql($categoryMap, 'category_name');
        $categoryImageCase = $this->categoryImageCaseSql('category_name');
        $categoriesSql = $this->sqlArray($categories);

        $this->statement("
            INSERT INTO places (
                name, category, category_id, area_name, area_zone, address, latitude, longitude,
                description, cover_image_url, images, operating_hours, tags, budget_tier, budget_label,
                budget_range, average_rating, total_reviews, is_published, created_by, created_at, updated_at
            )
            SELECT
                initcap(adj || ' ' || area_name || ' ' || noun || ' ' || gs),
                category_name,
                {$categoryCase},
                area_name,
                zone_name,
                area_name || ', ' || zone_name || ', Bangladesh',
                round((23.55 + ((gs % 4000) / 10000.0))::numeric, 7),
                round((90.35 + ((gs % 5000) / 10000.0))::numeric, 7),
                'Popular ' || lower(category_name) || ' destination known for strong community ratings, dependable service, and social-friendly ambience.',
                {$categoryImageCase},
                jsonb_build_array(
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
                ),
                jsonb_build_object(
                    'Monday', '10:00 AM - 10:00 PM',
                    'Tuesday', '10:00 AM - 10:00 PM',
                    'Wednesday', '10:00 AM - 10:00 PM',
                    'Thursday', '10:00 AM - 10:00 PM',
                    'Friday', '11:00 AM - 11:00 PM',
                    'Saturday', '11:00 AM - 11:00 PM',
                    'Sunday', '10:00 AM - 10:00 PM'
                ),
                jsonb_build_array(lower(category_name), area_name, lower(noun), lower(adj)),
                CASE WHEN gs % 10 < 4 THEN '$' WHEN gs % 10 < 8 THEN '$$' ELSE '$$$' END,
                CASE WHEN gs % 10 < 4 THEN 'Budget' WHEN gs % 10 < 8 THEN 'Mid-Range' ELSE 'Premium' END,
                CASE WHEN gs % 10 < 4 THEN '150-600' WHEN gs % 10 < 8 THEN '600-1800' ELSE '1800-6000' END,
                round((3.2 + ((gs % 18) / 10.0))::numeric, 2),
                (gs % 900)::int,
                CASE WHEN gs % 20 = 0 THEN false ELSE true END,
                1 + ((gs - 1) % (SELECT COUNT(*) FROM admins)),
                now() - ((gs % 540) || ' days')::interval,
                now() - ((gs % 540) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
            CROSS JOIN LATERAL (
                SELECT
                    {$adjectives}[1 + ((gs * 3) % array_length({$adjectives}, 1))] AS adj,
                    {$nouns}[1 + ((gs * 5) % array_length({$nouns}, 1))] AS noun,
                    {$areas}[1 + ((gs * 7) % array_length({$areas}, 1))] AS area_name,
                    {$zones}[1 + ((gs * 11) % array_length({$zones}, 1))] AS zone_name,
                    {$categoriesSql}[1 + ((gs * 13) % array_length({$categoriesSql}, 1))] AS category_name
            ) AS pick
        ");
    }

    private function seedEvents(int $count): void
    {
        $categoryMap = $this->categoryIdMap('event');
        $categories = array_keys($categoryMap);
        $categoryCase = $this->categoryCaseSql($categoryMap, 'category_name');
        $categoriesSql = $this->sqlArray($categories);
        $areas = $this->sqlArray(['Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Old Dhaka', 'Panthapath', 'Bashundhara', 'Tejgaon', 'Chattogram', 'Sylhet']);
        $titleParts = $this->sqlArray(['Festival', 'Meetup', 'Session', 'Night', 'Expo', 'Showcase', 'Summit', 'Workshop', 'Market', 'Carnival']);
        $prefixes = $this->sqlArray(['Dhaka', 'City', 'Weekend', 'Community', 'Creative', 'Street', 'Vibe', 'Sunset', 'Heritage', 'Urban']);

        $this->statement("
            INSERT INTO events (
                title, slug, place_id, category, category_id, area_name, area_zone,
                organiser_name, description, cover_image_url, event_date, end_date, start_time, end_time,
                average_rating, total_reviews, price_type, price_amount, ticket_url, is_published,
                created_by, created_at, updated_at
            )
            SELECT
                initcap(prefix_name || ' ' || category_name || ' ' || title_part || ' ' || gs),
                'event-' || gs,
                1 + ((gs * 17) % (SELECT COUNT(*) FROM places)),
                category_name,
                {$categoryCase},
                area_name,
                CASE WHEN area_name IN ('Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Tejgaon', 'Bashundhara') THEN 'DNCC' ELSE 'DSCC' END,
                initcap(prefix_name || ' Collective'),
                'Large-format ' || lower(category_name) || ' event built for discovery, attendance analytics, and repeat engagement modelling.',
                'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
                ((current_date - interval '180 days') + ((gs % 540) || ' days')::interval)::date,
                ((current_date - interval '180 days') + (((gs % 540) + (gs % 3)) || ' days')::interval)::date,
                time '10:00' + (((gs % 9)) || ' hours')::interval,
                time '12:00' + (((gs % 9)) || ' hours')::interval,
                round((3.0 + ((gs % 20) / 10.0))::numeric, 2),
                (gs % 700)::int,
                CASE WHEN gs % 4 = 0 THEN 'paid' ELSE 'free' END,
                CASE WHEN gs % 4 = 0 THEN round((250 + (gs % 5000))::numeric, 2) ELSE NULL END,
                CASE WHEN gs % 4 = 0 THEN 'https://tickets.vibespot.test/event/' || gs ELSE NULL END,
                CASE WHEN gs % 18 = 0 THEN false ELSE true END,
                1 + ((gs - 1) % (SELECT COUNT(*) FROM admins)),
                now() - ((gs % 365) || ' days')::interval,
                now() - ((gs % 365) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
            CROSS JOIN LATERAL (
                SELECT
                    {$categoriesSql}[1 + ((gs * 3) % array_length({$categoriesSql}, 1))] AS category_name,
                    {$areas}[1 + ((gs * 5) % array_length({$areas}, 1))] AS area_name,
                    {$titleParts}[1 + ((gs * 7) % array_length({$titleParts}, 1))] AS title_part,
                    {$prefixes}[1 + ((gs * 11) % array_length({$prefixes}, 1))] AS prefix_name
            ) AS pick
        ");
    }

    private function seedBlogPosts(int $count): void
    {
        $topics = $this->sqlArray(['Food Trails', 'Weekend Plans', 'Hidden Gems', 'Coffee Culture', 'Heritage Walks', 'Event Roundups']);

        $this->statement("
            INSERT INTO blog_posts (
                title, slug, excerpt, author_id, featured_image_url, body, tags, related_place_ids,
                is_published, is_featured, published_at, created_at, updated_at
            )
            SELECT
                initcap(topic_name || ' ' || gs),
                'blog-' || gs,
                'Editorial guide built for search, recommendations, and discovery storytelling.',
                1 + ((gs - 1) % (SELECT COUNT(*) FROM admins)),
                'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=1200&q=80',
                '## Why it matters' || E'\n\n' || 'Data-rich editorial content helps users explore the city with more confidence.' || E'\n\n' || '**Editor note:** This article is generated as production-style seed content.',
                jsonb_build_array('Guide', 'Dhaka', lower(replace(topic_name, ' ', '-'))),
                jsonb_build_array(1 + (gs % GREATEST((SELECT COUNT(*) FROM places), 1)), 1 + ((gs * 3) % GREATEST((SELECT COUNT(*) FROM places), 1))),
                true,
                CASE WHEN gs = 1 THEN true ELSE false END,
                now() - ((gs % 180) || ' days')::interval,
                now() - ((gs % 180) || ' days')::interval,
                now() - ((gs % 180) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
            CROSS JOIN LATERAL (
                SELECT {$topics}[1 + ((gs * 5) % array_length({$topics}, 1))] AS topic_name
            ) AS pick
        ");
    }

    private function seedReviews(int $count): void
    {
        $positive = $this->sqlArray(['Excellent ambience, attentive staff, and worth revisiting.', 'Loved the overall energy and would recommend it to friends.', 'Great place for hanging out, taking photos, and spending time with family.', 'Smooth experience from start to finish with memorable highlights.']);
        $mixed = $this->sqlArray(['Good concept and location, but crowd management can improve.', 'Nice experience overall though pricing felt a little high.', 'Strong atmosphere, but service speed varied during peak hours.']);
        $negative = $this->sqlArray(['The place looked promising but the experience felt inconsistent.', 'Expected more based on the ratings and social buzz.', 'Service delays and crowding reduced the overall experience.']);

        $this->statement("
            INSERT INTO reviews (user_id, reviewable_type, place_id, event_id, rating, body, created_at, updated_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 'place' ELSE 'event' END,
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 13) % (SELECT COUNT(*) FROM places)) ELSE NULL END,
                CASE WHEN gs % 2 = 1 THEN 1 + ((gs * 17) % (SELECT COUNT(*) FROM events)) ELSE NULL END,
                CASE WHEN gs % 10 < 5 THEN 5 WHEN gs % 10 < 8 THEN 4 WHEN gs % 10 = 8 THEN 3 ELSE 2 END,
                CASE
                    WHEN gs % 10 < 5 THEN {$positive}[1 + ((gs * 3) % array_length({$positive}, 1))]
                    WHEN gs % 10 < 8 THEN {$mixed}[1 + ((gs * 5) % array_length({$mixed}, 1))]
                    ELSE {$negative}[1 + ((gs * 7) % array_length({$negative}, 1))]
                END,
                now() - ((gs % 365) || ' days')::interval,
                now() - ((gs % 365) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedReviewSentiments(): void
    {
        $this->statement("
            INSERT INTO review_sentiments (
                review_id, polarity_score, confidence_score, sentiment_label, emotion_label, language_code, keywords, analyzed_at, created_at, updated_at
            )
            SELECT
                id,
                CASE WHEN rating >= 5 THEN 0.92 WHEN rating = 4 THEN 0.55 WHEN rating = 3 THEN 0.10 ELSE -0.42 END,
                0.87,
                CASE WHEN rating >= 5 THEN 'positive' WHEN rating = 4 THEN 'mostly_positive' WHEN rating = 3 THEN 'neutral' ELSE 'negative' END,
                CASE WHEN rating >= 5 THEN 'joy' WHEN rating = 4 THEN 'satisfaction' WHEN rating = 3 THEN 'curiosity' ELSE 'frustration' END,
                'en',
                jsonb_build_array(split_part(body, ' ', 1), split_part(body, ' ', 2), split_part(body, ' ', 3)),
                created_at + interval '2 minutes',
                created_at + interval '2 minutes',
                updated_at + interval '2 minutes'
            FROM reviews
        ");
    }

    private function seedRatings(int $count): void
    {
        $this->statement("
            INSERT INTO ratings (user_id, place_id, event_id, score, dimensions, created_at, updated_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 19) % (SELECT COUNT(*) FROM places)) ELSE NULL END,
                CASE WHEN gs % 2 = 1 THEN 1 + ((gs * 23) % (SELECT COUNT(*) FROM events)) ELSE NULL END,
                CASE WHEN gs % 10 < 5 THEN 5 WHEN gs % 10 < 8 THEN 4 WHEN gs % 10 = 8 THEN 3 ELSE 2 END,
                jsonb_build_object(
                    'ambience', 3 + (gs % 3),
                    'service', 3 + ((gs * 2) % 3),
                    'value', 2 + ((gs * 3) % 4),
                    'accessibility', 3 + ((gs * 5) % 3)
                ),
                now() - ((gs % 300) || ' days')::interval,
                now() - ((gs % 300) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedWishlistItems(int $count): void
    {
        $this->statement("
            INSERT INTO wishlist_items (user_id, wishlistable_type, place_id, event_id, added_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 'place' ELSE 'event' END,
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 29) % (SELECT COUNT(*) FROM places)) ELSE NULL END,
                CASE WHEN gs % 2 = 1 THEN 1 + ((gs * 31) % (SELECT COUNT(*) FROM events)) ELSE NULL END,
                now() - ((gs % 240) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
            ON CONFLICT DO NOTHING
        ");
    }

    private function seedCheckIns(int $count): void
    {
        $this->statement("
            INSERT INTO check_ins (user_id, place_id, event_id, checked_in_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 37) % (SELECT COUNT(*) FROM places)) ELSE NULL END,
                CASE WHEN gs % 2 = 1 THEN 1 + ((gs * 41) % (SELECT COUNT(*) FROM events)) ELSE NULL END,
                now() - ((gs % 180) || ' days')::interval - (((gs * 13) % 86400) || ' seconds')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedNotifications(int $count): void
    {
        $types = $this->sqlArray(['wishlist', 'review', 'checkin', 'booking', 'recommendation']);

        $this->statement("
            INSERT INTO notifications (user_id, type, title, message, is_read, read_at, created_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                notif_type,
                initcap(notif_type) || ' update',
                'Automated product notification generated for seeded activity and lifecycle testing.',
                CASE WHEN gs % 3 = 0 THEN true ELSE false END,
                CASE WHEN gs % 3 = 0 THEN now() - ((gs % 90) || ' days')::interval ELSE NULL END,
                now() - ((gs % 90) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
            CROSS JOIN LATERAL (
                SELECT {$types}[1 + ((gs * 7) % array_length({$types}, 1))] AS notif_type
            ) AS pick
        ");
    }

    private function seedBookings(int $count): void
    {
        $statuses = $this->sqlArray(['confirmed', 'completed', 'cancelled', 'pending']);

        $this->statement("
            INSERT INTO bookings (
                user_id, place_id, event_id, booking_reference, status, party_size, scheduled_for,
                booking_channel, amount_paid, currency, metadata, created_at, updated_at
            )
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 43) % (SELECT COUNT(*) FROM places)) ELSE NULL END,
                CASE WHEN gs % 2 = 1 THEN 1 + ((gs * 47) % (SELECT COUNT(*) FROM events)) ELSE NULL END,
                'BK-' || lpad(gs::text, 10, '0'),
                {$statuses}[1 + ((gs * 3) % array_length({$statuses}, 1))],
                1 + (gs % 6),
                now() + (((gs % 120) - 40) || ' days')::interval + (((gs * 11) % 3600) || ' seconds')::interval,
                CASE WHEN gs % 5 = 0 THEN 'web' WHEN gs % 5 = 1 THEN 'partner' ELSE 'app' END,
                round((150 + (gs % 7000))::numeric, 2),
                'BDT',
                jsonb_build_object('notes', 'Seeded booking record', 'source_batch', 'massive-production'),
                now() - ((gs % 200) || ' days')::interval,
                now() - ((gs % 200) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedSearchHistories(int $count): void
    {
        $queries = $this->sqlArray(['best rooftop cafe', 'family friendly park', 'live music tonight', 'budget dinner', 'heritage places', 'movie screening', 'date night ideas', 'workshop this weekend', 'coffee with wifi', 'kids activities']);

        $this->statement("
            INSERT INTO search_histories (
                user_id, query, filters, result_count, clicked_entity_type, clicked_entity_id, searched_at, created_at
            )
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                {$queries}[1 + ((gs * 5) % array_length({$queries}, 1))],
                jsonb_build_object(
                    'category', CASE WHEN gs % 2 = 0 THEN 'Food & Drinks' ELSE 'Culture' END,
                    'area', CASE WHEN gs % 3 = 0 THEN 'Gulshan' ELSE 'Dhanmondi' END,
                    'sort', CASE WHEN gs % 4 = 0 THEN 'rating_desc' ELSE 'newest' END
                ),
                5 + (gs % 120),
                CASE WHEN gs % 2 = 0 THEN 'place' ELSE 'event' END,
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 53) % (SELECT COUNT(*) FROM places)) ELSE 1 + ((gs * 59) % (SELECT COUNT(*) FROM events)) END,
                now() - ((gs % 120) || ' days')::interval,
                now() - ((gs % 120) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedRecommendations(int $count): void
    {
        $reasons = $this->sqlArray(['Matches recent search and review behavior.', 'Popular among similar users with matching nightlife preferences.', 'High rating overlap with favorited places and saved events.', 'Trending in your most visited neighborhoods.']);

        $this->statement("
            INSERT INTO recommendations (
                user_id, target_type, target_id, source_type, algorithm_version, rank_score, reason, context, generated_at, created_at
            )
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 'place' ELSE 'event' END,
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 61) % (SELECT COUNT(*) FROM places)) ELSE 1 + ((gs * 67) % (SELECT COUNT(*) FROM events)) END,
                CASE WHEN gs % 3 = 0 THEN 'content_based' WHEN gs % 3 = 1 THEN 'collaborative' ELSE 'hybrid' END,
                'v1.0',
                round((0.2000 + ((gs % 8000) / 10000.0))::numeric, 4),
                {$reasons}[1 + ((gs * 7) % array_length({$reasons}, 1))],
                jsonb_build_object('freshness_weight', 0.35, 'popularity_weight', 0.40, 'taste_weight', 0.25),
                now() - ((gs % 30) || ' days')::interval,
                now() - ((gs % 30) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedConversations(int $count): void
    {
        $topics = $this->sqlArray(['Trip planning', 'Food recommendations', 'Weekend itinerary', 'Group outing', 'Event assistant']);

        $this->statement("
            INSERT INTO conversations (
                user_id, channel, status, topic, started_at, last_message_at, context, created_at, updated_at
            )
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                'assistant',
                CASE WHEN gs % 7 = 0 THEN 'closed' ELSE 'active' END,
                {$topics}[1 + ((gs * 5) % array_length({$topics}, 1))],
                now() - ((gs % 90) || ' days')::interval,
                now() - ((gs % 45) || ' days')::interval,
                jsonb_build_object('locale', 'en-BD', 'surface', 'web'),
                now() - ((gs % 90) || ' days')::interval,
                now() - ((gs % 45) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function seedMessages(int $count): void
    {
        $bodies = $this->sqlArray(['Can you recommend a good rooftop place for tonight?', 'I want an event near Gulshan this weekend.', 'Show me something family friendly and budget conscious.', 'Based on my history, what should I try next?', 'Find me a live music spot with good reviews.']);

        $this->statement("
            INSERT INTO messages (conversation_id, user_id, sender_role, message_type, body, metadata, created_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM conversations)),
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs - 1) % (SELECT COUNT(*) FROM users)) ELSE NULL END,
                CASE WHEN gs % 2 = 0 THEN 'user' ELSE 'assistant' END,
                'text',
                {$bodies}[1 + ((gs * 3) % array_length({$bodies}, 1))],
                jsonb_build_object('seeded', true, 'sequence', gs),
                now() - ((gs % 30) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");

        $this->statement("
            UPDATE conversations c
            SET last_message_at = m.max_created_at,
                updated_at = m.max_created_at
            FROM (
                SELECT conversation_id, MAX(created_at) AS max_created_at
                FROM messages
                GROUP BY conversation_id
            ) m
            WHERE c.id = m.conversation_id
        ");
    }

    private function seedActivityLogs(int $count): void
    {
        $actions = $this->sqlArray(['viewed_place', 'viewed_event', 'saved_item', 'opened_notification', 'searched', 'checked_in', 'booked']);

        $this->statement("
            INSERT INTO activity_logs (user_id, place_id, event_id, action, entity_type, entity_id, metadata, created_at)
            SELECT
                1 + ((gs - 1) % (SELECT COUNT(*) FROM users)),
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 71) % (SELECT COUNT(*) FROM places)) ELSE NULL END,
                CASE WHEN gs % 2 = 1 THEN 1 + ((gs * 73) % (SELECT COUNT(*) FROM events)) ELSE NULL END,
                {$actions}[1 + ((gs * 5) % array_length({$actions}, 1))],
                CASE WHEN gs % 2 = 0 THEN 'place' ELSE 'event' END,
                CASE WHEN gs % 2 = 0 THEN 1 + ((gs * 79) % (SELECT COUNT(*) FROM places)) ELSE 1 + ((gs * 83) % (SELECT COUNT(*) FROM events)) END,
                jsonb_build_object('device', CASE WHEN gs % 3 = 0 THEN 'mobile' ELSE 'web' END, 'duration_seconds', 10 + (gs % 420)),
                now() - ((gs % 120) || ' days')::interval
            FROM generate_series(1, {$count}) AS gs
        ");
    }

    private function refreshCounters(): void
    {
        $this->statement("
            UPDATE users u
            SET review_count = COALESCE(r.review_count, 0),
                wishlist_count = COALESCE(w.wishlist_count, 0)
            FROM (
                SELECT user_id, COUNT(*) AS review_count
                FROM reviews
                GROUP BY user_id
            ) r
            FULL OUTER JOIN (
                SELECT user_id, COUNT(*) AS wishlist_count
                FROM wishlist_items
                GROUP BY user_id
            ) w ON w.user_id = r.user_id
            WHERE u.id = COALESCE(r.user_id, w.user_id)
        ");

        $this->statement("
            UPDATE places p
            SET average_rating = COALESCE(s.avg_rating, 0),
                total_reviews = COALESCE(s.total_reviews, 0)
            FROM (
                SELECT place_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS total_reviews
                FROM reviews
                WHERE place_id IS NOT NULL
                GROUP BY place_id
            ) s
            WHERE p.id = s.place_id
        ");

        $this->statement("
            UPDATE events e
            SET average_rating = COALESCE(s.avg_rating, 0),
                total_reviews = COALESCE(s.total_reviews, 0)
            FROM (
                SELECT event_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS total_reviews
                FROM reviews
                WHERE event_id IS NOT NULL
                GROUP BY event_id
            ) s
            WHERE e.id = s.event_id
        ");
    }

    private function categoryIdMap(string $type): array
    {
        return DB::table('categories')
            ->where('type', $type)
            ->pluck('id', 'name')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function categoryCaseSql(array $map, string $column): string
    {
        $case = 'CASE';

        foreach ($map as $name => $id) {
            $case .= " WHEN {$column} = '" . str_replace("'", "''", $name) . "' THEN {$id}";
        }

        return $case . ' END';
    }

    private function categoryImageCaseSql(string $column): string
    {
        $default = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80';
        $case = 'CASE';

        foreach ($this->categoryImages as $name => $url) {
            $case .= " WHEN {$column} = '" . str_replace("'", "''", $name) . "' THEN '" . str_replace("'", "''", $url) . "'";
        }

        return $case . " ELSE '{$default}' END";
    }

    private function sqlArray(array $values): string
    {
        $escaped = array_map(
            fn (string $value) => "'" . str_replace("'", "''", $value) . "'",
            $values
        );

        return '(ARRAY[' . implode(', ', $escaped) . '])';
    }

    private function statement(string $sql): void
    {
        DB::unprepared($sql);
    }
}
