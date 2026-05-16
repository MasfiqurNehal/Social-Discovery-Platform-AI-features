"use client";

import { Star, User, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReviewListProps {
  reviews: any[];
  onEdit?: (review: any) => void;
  onDelete?: (reviewId: number) => void;
}

export default function ReviewList({ reviews, onEdit, onDelete }: ReviewListProps) {
  const { user } = useAuth();
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: any) => (
        <div
          key={review.id}
          className="rounded-2xl p-5 sm:p-6 space-y-3"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <User className="h-5 w-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {review.user?.display_name || 'Anonymous'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && user.id === review.user_id && (
                <div className="flex items-center gap-1 mr-2">
                  <button 
                    onClick={() => onEdit?.(review)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-default)] text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                    title="Edit Review"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onDelete?.(review.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-default)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{review.rating}.0</span>
              </div>
            </div>
          </div>
          {review.body && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{review.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}

