import { Heart, MapPin, Calendar, ArrowRight, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PaginationLinks from '@/components/shared/PaginationLinks';

async function getWishlist(searchParams?: Record<string, string | string[] | undefined>) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const query = new URLSearchParams(searchParams as Record<string, string>).toString();

    const res = await fetch(`http://localhost:8000/api/wishlist${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function WishlistPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const response = await getWishlist(resolvedParams);
  
  if (!response || !response.data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mb-6">
          <Bookmark className="h-10 w-10 text-brand-500" />
        </div>
        <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Your Wishlist</h1>
        <p className="text-[var(--text-muted)] text-center max-w-md mb-8">
          Save more places and events to see them here. You must be signed in to see your wishlist.
        </p>
        <Link href="/login" className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20">
          Sign In
        </Link>
      </div>
    );
  }

  const { places, events } = response.data;
  const meta = response.meta || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Saved Items</h1>
          <p style={{ color: 'var(--text-muted)' }}>Everything you're planning to experience.</p>
        </div>
      </div>

      <div className="space-y-20">
        {/* --- PLACES SECTION --- */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <MapPin className="h-6 w-6 text-brand-500" />
              Places
              <span className="text-sm font-medium px-2.5 py-0.5 rounded-lg bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}>
                {places.length}
              </span>
            </h2>
            <Link href="/places" className="text-sm font-bold text-brand-500 hover:text-brand-400 flex items-center gap-1 transition-colors">
              Explore more <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {places.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {places.map((place: any) => (
                  <Link key={place.id} href={`/places/${place.id}`} className="group relative block rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[4/3] w-full relative">
                      <img src={place.cover_image_url} alt={place.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-1 block">
                          {place.category}
                        </span>
                        <h3 className="text-xl font-bold text-white mb-1">{place.name}</h3>
                        <div className="flex items-center gap-1 text-white/70 text-xs">
                          <MapPin className="h-3 w-3" /> {place.area_name}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <PaginationLinks
                basePath="/wishlist"
                currentPage={meta?.places?.current_page || 1}
                lastPage={meta?.places?.last_page || 1}
                searchParams={resolvedParams}
                pageParam="places_page"
              />
            </>
          ) : (
            <div className="p-12 rounded-3xl border-2 border-dashed border-[var(--border)] text-center">
              <p style={{ color: 'var(--text-muted)' }}>No places saved yet.</p>
            </div>
          )}
        </section>

        {/* --- EVENTS SECTION --- */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="h-6 w-6 text-brand-500" />
              Events
              <span className="text-sm font-medium px-2.5 py-0.5 rounded-lg bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}>
                {events.length}
              </span>
            </h2>
            <Link href="/events" className="text-sm font-bold text-brand-500 hover:text-brand-400 flex items-center gap-1 transition-colors">
              Find events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {events.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group relative block rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[4/3] w-full relative">
                      <img src={event.cover_image_url} alt={event.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-1 block">
                          {event.category}
                        </span>
                        <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                        <div className="flex items-center gap-1 text-white/70 text-xs">
                          <Calendar className="h-3 w-3" /> 
                          {new Date(event.event_date).toLocaleDateString()}
                          {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <PaginationLinks
                basePath="/wishlist"
                currentPage={meta?.events?.current_page || 1}
                lastPage={meta?.events?.last_page || 1}
                searchParams={resolvedParams}
                pageParam="events_page"
              />
            </>
          ) : (
            <div className="p-12 rounded-3xl border-2 border-dashed border-[var(--border)] text-center">
              <p style={{ color: 'var(--text-muted)' }}>No events saved yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

