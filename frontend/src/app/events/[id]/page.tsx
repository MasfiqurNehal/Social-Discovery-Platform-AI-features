import { Star, MapPin, Clock, Calendar, Users, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import ReviewSection from '@/components/reviews/ReviewSection';
import WishlistButton from '@/components/shared/WishlistButton';
import CheckInButton from '@/components/shared/CheckInButton';
import VenueStats from '@/components/shared/VenueStats';

import { cookies } from 'next/headers';

async function getEvent(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`http://localhost:8000/api/events/${id}`, {
      cache: 'no-store',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return null;
  }
}

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const response = await getEvent(resolvedParams.id);

  if (!response || !response.data) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="empty-state p-10 text-center rounded-2xl max-w-md">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Event Not Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>The event you are looking for does not exist or has been removed.</p>
          <Link href="/events" className="text-brand-500 hover:text-brand-400 font-semibold text-sm mt-4 inline-block">
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const event = response.data;
  const reviews = response.reviews || [];
  const reviewsMeta = response.reviews_meta || { current_page: 1, last_page: 1, total: reviews.length };
  const rating = parseFloat(String(event.average_rating));

  const formatDateFull = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isOneDay = !event.end_date || event.event_date === event.end_date;
  
  const displayDate = isOneDay 
    ? formatDateFull(event.event_date)
    : `${new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="pb-24">
      {/* ─── HERO IMAGE ─── */}
      <div className="relative h-[55vh] min-h-[400px] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/60 to-transparent z-10" />
        <img
          src={event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80'}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Back button */}
        <div className="absolute top-20 left-4 sm:left-8 z-20">
          <Link
            href="/events"
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <ArrowLeft className="h-4 w-4" /> All Events
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full z-20 px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <span className="inline-block px-3.5 py-1.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider mb-4 bg-brand-600/90 backdrop-blur-md shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                {event.category}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <Calendar className="h-5 w-5 text-brand-400" />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{displayDate}</span>
                </div>
                <div className="flex items-center gap-2 text-base" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="h-5 w-5 text-brand-400" />
                  <span className="font-medium">{event.area_name}</span>
                </div>
                <VenueStats 
                  eventId={event.id} 
                  initialRating={rating} 
                  initialTotalReviews={event.total_reviews} 
                />
                
                {/* Big Bookmark Toggle */}
                <div className="ml-2">
                  <WishlistButton 
                    eventId={event.id} 
                    initialIsWishlisted={event.is_wishlisted} 
                    showText={true} 
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Description + Reviews */}
          <div className="lg:col-span-2 space-y-12">
            {/* About */}
            <section>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <span className="w-8 h-1 bg-brand-500 rounded-full inline-block"></span>
                About This Event
              </h2>
              <div
                className="p-6 sm:p-8 rounded-2xl text-base leading-relaxed"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {event.description || 'No description provided.'}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <ReviewSection eventId={event.id} initialReviews={reviews} initialMeta={reviewsMeta} />
            </section>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 sm:p-8 sticky top-24 space-y-6" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div className="w-full">
                <CheckInButton eventId={event.id} />
              </div>
              
              <h3 className="text-lg font-bold text-center" style={{ color: 'var(--text-primary)' }}>Event Details</h3>
              <ul className="space-y-5">
                <li className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Timeline</span>
                  <span className="font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <Calendar className="h-3.5 w-3.5 text-brand-400" />
                    {isOneDay ? formatDateFull(event.event_date) : `${new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </span>
                </li>
                {event.start_time && (
                  <li className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Time</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <Clock className="h-4 w-4" /> {event.start_time}
                      {event.end_time && ` – ${event.end_time}`}
                    </span>
                  </li>
                )}
                <li className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Location</span>
                  <span className="font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <MapPin className="h-3.5 w-3.5 text-brand-400" />
                    {event.area_name}
                  </span>
                </li>
                {event.organiser_name && (
                  <li className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Organiser</span>
                    <span className="font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      <Users className="h-3.5 w-3.5 text-brand-400" />
                      {event.organiser_name}
                    </span>
                  </li>
                )}
                <li className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Rating</span>
                  <VenueStats 
                    eventId={event.id} 
                    initialRating={rating} 
                    initialTotalReviews={event.total_reviews || 0} 
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
