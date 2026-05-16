import EventCard from '@/components/cards/EventCard';
import CompactFilters from '@/components/filters/CompactFilters';
import { Calendar, Play, Clock, History } from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';
import PaginationLinks from '@/components/shared/PaginationLinks';

async function getEvents(searchParams: any) {
  try {
    const query = new URLSearchParams(searchParams).toString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events?${query}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { data: [], meta: null };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function midnight(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function classify(event: any): 'ongoing' | 'upcoming' | 'past' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = midnight(event.event_date);
  const end = event.end_date
    ? (() => { const d = new Date(event.end_date); d.setHours(23, 59, 59, 999); return d; })()
    : (() => { const d = new Date(event.event_date); d.setHours(23, 59, 59, 999); return d; })();

  if (today >= start && new Date() <= end) return 'ongoing';
  if (start > today) return 'upcoming';
  return 'past';
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeading({
  icon, title, subtitle, count, accent = 'brand',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  accent?: 'emerald' | 'brand' | 'zinc';
}) {
  const accentMap = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    brand:   'bg-brand-500/10 text-brand-500 border-brand-500/20',
    zinc:    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  const badgeMap = {
    emerald: 'bg-emerald-500 text-white',
    brand:   'bg-brand-500 text-white',
    zinc:    'bg-zinc-700 text-zinc-300',
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl border ${accentMap[accent]}`}>{icon}</div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>
      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${badgeMap[accent]}`}>
        {count} event{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const resolvedParams = await searchParams;
  const { data, meta } = await getEvents(resolvedParams);
  const events: any[] = data || [];

  const ongoingEvents  = events.filter((e) => classify(e) === 'ongoing');
  const upcomingEvents = events.filter((e) => classify(e) === 'upcoming');
  const pastEvents     = events.filter((e) => classify(e) === 'past');

  const hasAnyEvents = events.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full flex flex-col gap-10">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-500">
          <Calendar className="h-4 w-4" />
          The Pulse of Dhaka
        </div>
        <h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Explore Events
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          Cultural Festivals, Concerts, and Community Meetups and More.
        </p>
        {meta && (
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {meta.total?.toLocaleString()}
            </span>{' '}
            events across Dhaka
          </p>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full">
        <Suspense
          fallback={
            <div className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
          }
        >
          <CompactFilters type="events" />
        </Suspense>
      </div>

      {/* ── No results at all ───────────────────────────────────────────── */}
      {!hasAnyEvents && (
        <div
          className="empty-state text-center py-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="p-5 rounded-full mb-6 inline-flex"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <span className="text-4xl">🗓️</span>
          </div>
          <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            No events found
          </p>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            Try adjusting your filters or check back later for new vibes.
          </p>
          <Link
            href="/events"
            className="mt-8 px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-400 transition-all"
          >
            Show All Events
          </Link>
        </div>
      )}

      {/* ── Event sections ──────────────────────────────────────────────── */}
      {hasAnyEvents && (
        <div className="flex flex-col gap-14">

          {/* Happening Now */}
          {ongoingEvents.length > 0 && (
            <section className="space-y-7">
              <div className="flex items-center gap-3 mb-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                </span>
              </div>
              <SectionHeading
                icon={<Play className="h-5 w-5 fill-current" />}
                title="Happening Now"
                subtitle="Catch these vibes before they're gone."
                count={ongoingEvents.length}
                accent="emerald"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ongoingEvents.map((event) => (
                  <EventCard key={event.id} event={event} status="ongoing" />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <section className="space-y-7">
              <SectionHeading
                icon={<Clock className="h-5 w-5" />}
                title="Upcoming Vibes"
                subtitle="Mark your calendars for these experiences."
                count={upcomingEvents.length}
                accent="brand"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} status="upcoming" />
                ))}
              </div>
            </section>
          )}

          {/* Past Events — never silently discard */}
          {pastEvents.length > 0 && (
            <section className="space-y-7">
              <SectionHeading
                icon={<History className="h-5 w-5" />}
                title="Past Events"
                subtitle="Relive the vibes — browse what happened."
                count={pastEvents.length}
                accent="zinc"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} status="past" />
                ))}
              </div>
            </section>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <PaginationLinks
              basePath="/events"
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              searchParams={resolvedParams}
            />
          )}
        </div>
      )}
    </div>
  );
}
