import Link from 'next/link';
import HeroSearch from '@/components/home/HeroSearch';
import CategoryGrid from '@/components/home/CategoryGrid';
import RecommendedSection from '@/components/home/RecommendedSection';
import PlaceCard from '@/components/cards/PlaceCard';
import { ArrowRight, TrendingUp, Star, Sparkles } from 'lucide-react';

async function getPlaces(params?: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/places?${params || ''}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { data: [] };
  }
}

async function getStats() {
  try {
    const res = await fetch('http://localhost:8000/api/discovery/stats', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { data: { places_count: 0, events_count: 0, reviews_count: 0 } };
  }
}

export default async function Home() {
  const [trendingRes, newRes, statsRes] = await Promise.all([
    getPlaces('sort=rating_desc'),
    getPlaces('sort=newest'),
    getStats(),
  ]);

  const trending = trendingRes.data?.slice(0, 4) || [];
  const newest = newRes.data?.slice(0, 4) || [];


  const stats = statsRes.data || { places_count: 0, events_count: 0, reviews_count: 0, categories: {} };

  return (
    <div className="flex flex-col">

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-10">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Discover Dhaka's Best — Phase 1: DNCC &amp; DSCC
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
              Find Your{' '}
              <span className="text-gradient">Vibe</span>
              <span className="text-gradient animate-blink">.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Explore restaurants, outdoors, heritage, landmarks, live events, and underrated spots&nbsp;—
              all curated by the Dhaka community.
            </p>
          </div>

          {/* Search */}
          <HeroSearch />

          {/* Stats */}
          <div className="flex items-center justify-center gap-10 pt-2">
            {[
              { num: stats.places_count, label: 'Places' },
              { num: stats.events_count, label: 'Events' },
              { num: stats.reviews_count, label: 'Reviews' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-brand-500">{num}+</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RecommendedSection />

      {/* ─── CATEGORIES ─── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <SectionHeader
          eyebrow="Browse by type"
          title="What are you looking for?"
          subtitle="Seven categories covering every corner of Dhaka's vibrant city life."
        />
        <CategoryGrid categoryCounts={stats.categories} />
      </section>

      {/* ─── TRENDING PLACES ─── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <SectionHeader
          eyebrow="Community Picks"
          title="Trending Right Now"
          subtitle="Highest-rated spots this week, voted by the community."
          action={{ href: '/places', label: 'View All Places' }}
          icon={<TrendingUp className="h-4 w-4 text-brand-500" />}
        />
        <PlaceGrid places={trending} />
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      <section
        className="py-16"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <SectionHeader
            eyebrow="Freshly Added"
            title="New on VibeSpot"
            subtitle="Newly listed places waiting to be explored first."
            action={{ href: '/places?sort=newest', label: 'See All New' }}
            icon={<Star className="h-4 w-4 text-brand-500" />}
          />
          <PlaceGrid places={newest} />
        </div>
      </section>

      {/* ─── EDITORIAL CTA ─── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 opacity-90" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566418876127-6f0a0bc4c6a2?auto=format&fit=crop&w=1400&q=60')] bg-cover bg-center mix-blend-overlay opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          <div className="relative z-10 py-24 px-8 sm:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-white max-w-lg">
              <p className="text-brand-200 text-sm font-semibold uppercase tracking-widest mb-3">Editorial</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">Explore our curated city guides</h2>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                From "Best Rooftop Cafés in Dhanmondi" to "A Night Out in Old Dhaka" — our editors have you covered.
              </p>
            </div>
            <Link
              href="/blog"
              className="flex-shrink-0 bg-white text-brand-700 hover:bg-brand-50 font-bold px-8 py-4 rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-xl"
            >
              Read the Blog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ─── Helper Components ─── */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-500">
          {icon}
          {eyebrow}
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function PlaceGrid({ places }: { places: any[] }) {
  if (!places.length) {
    return (
      <div
        className="empty-state text-center py-20 rounded-2xl"
      >
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>No places available. Make sure the backend is running.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {places.map((place: any) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
}

