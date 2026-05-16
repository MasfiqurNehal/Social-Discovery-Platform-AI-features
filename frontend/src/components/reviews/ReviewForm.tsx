"use client";

import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, Loader2, X } from 'lucide-react';
import Cookies from 'js-cookie';

interface ReviewFormProps {
  placeId?: number;
  eventId?: number;
  editingReview?: any;
  onCancelEdit?: () => void;
  onReviewSubmitted?: () => void;
  noBackground?: boolean;
}

export default function ReviewForm({ 
  placeId, 
  eventId, 
  editingReview, 
  onCancelEdit,
  onReviewSubmitted,
  noBackground = false
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editingReview;

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setBody(editingReview.body || '');
    } else {
      setRating(0);
      setBody('');
    }
  }, [editingReview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setError('');
    setSubmitting(true);

    try {
      const token = Cookies.get("auth_token");
      const url = isEditing 
        ? `http://localhost:8000/api/reviews/${editingReview.id}`
        : 'http://localhost:8000/api/reviews';
      
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          place_id: placeId || null,
          event_id: eventId || null,
          rating,
          body,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit review');

      if (!isEditing) {
        setSubmitted(true);
      }
      setBody('');
      setRating(0);
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      onReviewSubmitted?.();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={`rounded-2xl text-center space-y-3 ${noBackground ? '' : 'p-8'}`} style={noBackground ? {} : { backgroundColor: 'var(--bg-elevated)' }}>
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Thank you!</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your review has been submitted successfully.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors mt-2"
        >
          Write another review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl space-y-5 ${noBackground ? '' : 'p-6 sm:p-8'}`} style={noBackground ? {} : { backgroundColor: 'var(--bg-elevated)' }}>
      {!noBackground && <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Write a Review</h3>}

      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-600'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm font-bold ml-2" style={{ color: 'var(--text-primary)' }}>{rating}.0</span>
          )}
        </div>
      </div>

      {/* Clean separation */}

      {/* Review Body */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Your Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-brand-500/40"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          placeholder="Share your experience..."
        />
      </div>

      {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

      <div className="flex gap-3 pt-2">
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 surface border border-[var(--border)] hover:bg-[var(--bg-default)] text-[var(--text-primary)] px-6 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`flex-[2] bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isEditing ? 'flex-[2]' : 'w-full'}`}
          style={{ boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {isEditing ? 'Updating...' : 'Submitting...'}</>
          ) : (
            <><Send className="h-4 w-4" /> {isEditing ? 'Update Review' : 'Submit Review'}</>
          )}
        </button>
      </div>
    </form>
  );
}

