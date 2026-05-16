"use client";

import { useState, useEffect, useCallback } from 'react';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { MessageSquare, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ConfirmModal from '../shared/ConfirmModal';
import Modal from '../shared/Modal';
import { useRouter } from 'next/navigation';

interface ReviewSectionProps {
  placeId?: number;
  eventId?: number;
  initialReviews: any[];
  initialMeta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export default function ReviewSection({ placeId, eventId, initialReviews, initialMeta }: ReviewSectionProps) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [meta, setMeta] = useState(initialMeta || { current_page: 1, last_page: 1, total: initialReviews.length });
  const [page, setPage] = useState(initialMeta?.current_page || 1);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state if initialReviews (from server) changes
  useEffect(() => {
    setReviews(initialReviews || []);
    setMeta(initialMeta || { current_page: 1, last_page: 1, total: initialReviews.length });
    setPage(initialMeta?.current_page || 1);
  }, [initialReviews, initialMeta]);

  const refreshReviews = useCallback(async (targetPage = 1) => {
    try {
      const params = new URLSearchParams({
        ...(placeId ? { place_id: String(placeId) } : { event_id: String(eventId) }),
        page: String(targetPage),
        per_page: '10',
      });
      const res = await fetch(`http://localhost:8000/api/reviews?${params}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.data || []);
        setMeta(data.meta || { current_page: targetPage, last_page: 1, total: data.data?.length || 0 });
        setPage(data.meta?.current_page || targetPage);
      }
    } catch {
      // silently fail
    }
  }, [placeId, eventId]);

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = Cookies.get('auth_token');
      const res = await fetch(`http://localhost:8000/api/reviews/${reviewToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        setReviewToDelete(null);
        refreshReviews(page);
        router.refresh();
        window.dispatchEvent(new CustomEvent('refresh-venue-stats'));
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to delete review. Please try again.');
      }
    } catch (err) {
      console.error("Failed to delete review", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8" id="review-form">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-brand-400" />
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Reviews ({meta.total})
        </h2>
      </div>

      {user ? (
        role !== 'admin' && (
          <ReviewForm
            placeId={placeId}
            eventId={eventId}
            onReviewSubmitted={() => {
              refreshReviews(1);
              router.refresh();
              window.dispatchEvent(new CustomEvent('refresh-venue-stats'));
            }}
          />
        )
      ) : (
        /* ... existing guest message ... */
        <div className="surface-elevated rounded-2xl p-6 border border-[var(--border)] text-center flex flex-col items-center gap-3 mt-6">
          <MessageSquare className="h-8 w-8 text-brand-500 opacity-50" />
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Have you been here?</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">You must be logged in to share your experience and write a review.</p>
          </div>
          <Link href="/login" className="bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2">
            <LogIn className="h-4 w-4" /> Log in to review
          </Link>
        </div>
      )}

      <ReviewList 
        reviews={reviews} 
        onEdit={(review) => {
          setEditingReview(review);
        }}
        onDelete={(id) => setReviewToDelete(id)}
      />

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => refreshReviews(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Page {page} of {meta.last_page}
          </p>
          <button
            onClick={() => refreshReviews(page + 1)}
            disabled={page >= meta.last_page}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Review Modal */}
      <Modal
        isOpen={editingReview !== null}
        onClose={() => setEditingReview(null)}
        title="Edit Your Review"
      >
        <ReviewForm
          placeId={placeId}
          eventId={eventId}
          editingReview={editingReview}
          noBackground={true}
          onCancelEdit={() => setEditingReview(null)}
          onReviewSubmitted={() => {
            setEditingReview(null);
            refreshReviews(page);
            router.refresh();
            window.dispatchEvent(new CustomEvent('refresh-venue-stats'));
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={reviewToDelete !== null}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Review?"
        message="Are you sure you want to remove your review? This action cannot be undone and will update the overall rating for this place."
        confirmText="Delete Review"
      />
    </div>
  );
}

