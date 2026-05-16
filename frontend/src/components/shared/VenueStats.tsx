"use client";

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface VenueStatsProps {
  placeId?: number;
  eventId?: number;
  initialRating: number;
  initialTotalReviews: number;
}

export default function VenueStats({ placeId, eventId, initialRating, initialTotalReviews }: VenueStatsProps) {
  const [rating, setRating] = useState(initialRating);
  const [totalReviews, setTotalReviews] = useState(initialTotalReviews);

  const fetchStats = async () => {
    try {
      const type = placeId ? 'places' : 'events';
      const id = placeId || eventId;
      const res = await fetch(`http://localhost:8000/api/${type}/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const result = await res.json();
        setRating(parseFloat(result.data.average_rating));
        setTotalReviews(result.data.total_reviews);
      }
    } catch (error) {
      console.error("Failed to fetch venue stats", error);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      fetchStats();
    };

    window.addEventListener('refresh-venue-stats', handleRefresh);
    return () => window.removeEventListener('refresh-venue-stats', handleRefresh);
  }, [placeId, eventId]);

  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md" style={{ backgroundColor: 'var(--bg-elevated)' }}>
      <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
      <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {isNaN(rating) || rating === 0 ? '—' : rating.toFixed(1)}
      </span>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        ({totalReviews} reviews)
      </span>
    </div>
  );
}

