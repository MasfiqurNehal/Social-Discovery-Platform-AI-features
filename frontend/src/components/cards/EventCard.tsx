import { Calendar, MapPin, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import WishlistButton from '../shared/WishlistButton';

type EventStatus = 'ongoing' | 'upcoming' | 'past';

interface EventProps {
  event: {
    id: number;
    title: string;
    category: string;
    area_name: string;
    cover_image_url: string;
    event_date: string;
    end_date?: string;
    start_time: string;
    is_wishlisted?: boolean;
    average_rating: number | string;
    total_reviews: number;
  };
  status?: EventStatus;
}

const STATUS_BADGE: Record<EventStatus, { label: string; className: string }> = {
  ongoing:  { label: '● Live Now',  className: 'bg-emerald-500 text-white' },
  upcoming: { label: '⏰ Upcoming', className: 'bg-brand-500 text-white'   },
  past:     { label: '✓ Ended',    className: 'bg-zinc-600 text-zinc-200'  },
};

export default function EventCard({ event, status }: EventProps) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const isOneDay = !event.end_date || event.event_date === event.end_date;
  const badge = status ? STATUS_BADGE[status] : null;
  const isPast = status === 'past';

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className={`vcard group cursor-pointer h-full flex flex-col ${
          isPast ? 'grayscale-30' : ''
        }`}
      >
        {/* Cover image */}
        <div className="relative h-52 w-full overflow-hidden">
          <img
            src={
              event.cover_image_url ||
              'https://images.unsplash.com/photo-1540511587346-609804bbdc3c?auto=format&fit=crop&w=600&q=80'
            }
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />

          {/* Wishlist overlay */}
          <div className="absolute top-3 right-3 z-20">
            <WishlistButton eventId={event.id} initialIsWishlisted={event.is_wishlisted} />
          </div>

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {/* Category */}
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/50 text-white/90 backdrop-blur-md">
              {event.category}
            </span>
            {/* Status */}
            {badge && (
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md ${badge.className} ${
                  status === 'ongoing' ? 'animate-pulse' : ''
                }`}
              >
                {badge.label}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-grow gap-3">
          <div className="flex justify-between items-start gap-2">
            <h3
              className="text-base font-bold leading-snug group-hover:text-brand-400 transition-colors line-clamp-2 flex-1"
              style={{ color: isPast ? 'var(--text-muted)' : 'var(--text-primary)' }}
            >
              {event.title}
            </h3>
            {Number(event.average_rating) > 0 && (
              <div
                className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {Number(event.average_rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              <span className="font-medium text-brand-400/90">
                {isOneDay
                  ? new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : `${formatDate(event.event_date)} – ${formatDate(event.end_date!)}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              <span>{event.area_name}, Dhaka</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">{event.start_time}</span>
              <span style={{ color: 'var(--text-muted)' }}>· {event.total_reviews || 0} reviews</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
