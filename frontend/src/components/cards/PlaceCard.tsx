import { Star, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import WishlistButton from '../shared/WishlistButton';

const cleanName = (name: string) => name.replace(/\s+\d+$/, '');

interface PlaceProps {
  place: {
    id: number;
    name: string;
    category: string;
    area_name: string;
    cover_image_url: string;
    average_rating: number | string;
    budget_tier: string;
    budget_label?: string;
    budget_range?: string;
    total_reviews: number;
    is_wishlisted?: boolean;
  };
}

export default function PlaceCard({ place }: PlaceProps) {
  const rating = parseFloat(String(place.average_rating));

  return (
    <Link href={`/places/${place.id}`}>
      <div className="vcard group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-52 w-full overflow-hidden">
          <img
            src={place.cover_image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'}
            alt={place.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />

          {/* Wishlist Button Overlay */}
          <div className="absolute top-3 right-3 z-20">
            <WishlistButton placeId={place.id} initialIsWishlisted={place.is_wishlisted} />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/50 text-white/90 backdrop-blur-md">
              {place.category}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-brand-600/90 text-white backdrop-blur-md">
              {place.budget_tier || '৳৳'} {place.budget_label && `· ${place.budget_label}`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow gap-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-1">
              <h3
                className="text-base font-bold leading-snug group-hover:text-brand-400 transition-colors line-clamp-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {cleanName(place.name)}
              </h3>
              {place.budget_range && place.budget_range !== '0-0' && (
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-tighter">
                  EST. ৳{place.budget_range} BDT
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg border border-[var(--border)]" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {isNaN(rating) ? '—' : rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              <span>{place.area_name}, Dhaka</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">Open Now</span>
              <span style={{ color: 'var(--text-muted)' }}>· {place.total_reviews} reviews</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

