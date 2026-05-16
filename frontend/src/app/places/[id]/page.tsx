import { Star, MapPin, Clock, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReviewSection from '@/components/reviews/ReviewSection';
import WishlistButton from '@/components/shared/WishlistButton';
import CheckInButton from '@/components/shared/CheckInButton';

import { cookies } from 'next/headers';

async function getPlace(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`http://localhost:8000/api/places/${id}`, {
      cache: 'no-store',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return null;
  }
}

export default async function PlaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const response = await getPlace(resolvedParams.id);

  if (!response || !response.data) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="empty-state p-10 text-center rounded-2xl max-w-md">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Place Not Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>The place you are looking for does not exist or has been removed.</p>
          <Link href="/places" className="text-brand-500 hover:text-brand-400 font-semibold text-sm mt-4 inline-block">
            ← Back to Places
          </Link>
        </div>
      </div>
    );
  }

  const place = response.data;
  const reviews = response.reviews || [];
  const reviewsMeta = response.reviews_meta || { current_page: 1, last_page: 1, total: reviews.length };
  const rating = parseFloat(String(place.average_rating));

  // Parse tags safely — might be a JSON string or already an array
  let tags: string[] = [];
  try {
    if (Array.isArray(place.tags)) {
      tags = place.tags;
    } else if (typeof place.tags === 'string') {
      tags = JSON.parse(place.tags);
    }
  } catch {
    tags = [];
  }

  // Parse operating hours safely
  let operatingHours: Record<string, string> = {};
  try {
    if (typeof place.operating_hours === 'object' && place.operating_hours !== null) {
      operatingHours = place.operating_hours;
    } else if (typeof place.operating_hours === 'string') {
      operatingHours = JSON.parse(place.operating_hours);
    }
  } catch {
    operatingHours = {};
  }

  return (
    <div className="pb-24">
      {/* ─── HERO IMAGE ─── */}
      <div className="relative h-[55vh] min-h-[400px] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/60 to-transparent z-10" />
        <img
          src={place.cover_image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80'}
          alt={place.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Back button */}
        <div className="absolute top-20 left-4 sm:left-8 z-20">
          <Link
            href="/places"
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <ArrowLeft className="h-4 w-4" /> All Places
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full z-20 px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-block px-3.5 py-1.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider mb-4 bg-brand-600/90 backdrop-blur-md shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                  {place.category}
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                  {place.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{isNaN(rating) ? '—' : rating.toFixed(1)}</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>({place.total_reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-base" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="h-5 w-5 text-brand-400" />
                    <span className="font-medium">{place.area_name}, {place.area_zone}</span>
                  </div>

                  {/* Big Bookmark Toggle */}
                  <div className="ml-2">
                    <WishlistButton
                      placeId={place.id}
                      initialIsWishlisted={place.is_wishlisted}
                      showText={true}
                      size="md"
                    />
                  </div>
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
                About this place
              </h2>
              <div
                className="p-6 sm:p-8 rounded-2xl text-base leading-relaxed"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {place.description || 'No description provided.'}
              </div>
            </section>

            {/* Tags */}
            {tags.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Tags & Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    >
                      <Tag className="h-3 w-3 text-brand-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <ReviewSection placeId={place.id} initialReviews={reviews} initialMeta={reviewsMeta} />
              
            </section>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 sm:p-8 sticky top-24 space-y-6" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div className="w-full">
                <CheckInButton placeId={place.id} />
              </div>

              <h3 className="text-lg font-bold text-center" style={{ color: 'var(--text-primary)' }}>At a Glance</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <Clock className="h-4 w-4" /> Open Now
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Budget</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-brand-400 font-extrabold text-base tracking-widest px-3 py-1.5 rounded-xl block" style={{ backgroundColor: 'var(--bg-card)' }}>
                      {place.budget_tier || '৳৳৳'}
                    </span>
                    {place.budget_label && (
                      <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                        {place.budget_label} {place.budget_range && place.budget_range !== '0-0' && `(৳${place.budget_range})`}
                      </span>
                    )}
                  </div>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{isNaN(rating) ? '—' : rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({place.total_reviews} reviews)</span>
                  </div>
                </li>

                {/* Operating Hours */}
                {Object.keys(operatingHours).length > 0 && (
                  <li className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm font-bold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                      Operating Hours
                      <Clock className="h-3.5 w-3.5 text-brand-500" />
                    </p>
                    <div className="space-y-1.5">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="flex justify-between text-[11px] font-medium">
                          <span style={{ color: 'var(--text-muted)' }}>{day}</span>
                          <span style={{ color: operatingHours[day]?.includes('Closed') ? 'var(--text-error, #f87171)' : 'var(--text-primary)' }}>
                            {operatingHours[day] || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </li>
                )}

                <li className="pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Full Address</p>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>{place.address}</p>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
