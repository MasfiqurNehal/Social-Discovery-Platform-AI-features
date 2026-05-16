"use client";

import { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface WishlistButtonProps {
  placeId?: number;
  eventId?: number;
  initialIsWishlisted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function WishlistButton({
  placeId,
  eventId,
  initialIsWishlisted = false,
  size = 'md',
  className = '',
  showText = false
}: WishlistButtonProps) {
  const { user, role, wishlistIds, toggleWishlistState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Derive wishlist status from global context
  const currentId = (placeId || eventId) as number;
  const typeKey = placeId ? 'places' : 'events';
  const isWishlisted = wishlistIds[typeKey].includes(currentId);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    const token = Cookies.get('auth_token');

    try {
      const res = await fetch('http://localhost:8000/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          place_id: placeId,
          event_id: eventId
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newStatus = data.wishlist_status === 'added';
        toggleWishlistState(currentId, placeId ? 'place' : 'event', newStatus);
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
      }
    } catch (err) {
      console.error("Wishlist toggle failed", err);
    } finally {
      setLoading(false);
    }
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonClasses = showText 
    ? "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all"
    : `p-2.5 rounded-xl transition-all ${className}`;

  const activeStyles = isWishlisted
    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
    : "bg-black/20 backdrop-blur-md text-white hover:bg-black/40";

  const textStyles = isWishlisted
    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 border border-brand-400"
    : "surface border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-default)]";

  if (role === 'admin') return null;

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={showText ? `${buttonClasses} ${textStyles}` : `${buttonClasses} ${activeStyles}`}
      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Bookmark className={`${iconSizes[size]} ${isWishlisted ? 'fill-current' : ''}`} />
      )}
      {showText && (
        <span className="text-sm">
          {isWishlisted ? 'Saved to Wishlist' : 'Save as Bookmark'}
        </span>
      )}
    </button>
  );
}

