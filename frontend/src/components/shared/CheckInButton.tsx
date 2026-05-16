"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Loader2, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface CheckInButtonProps {
  placeId?: number;
  eventId?: number;
}

export default function CheckInButton({ placeId, eventId }: CheckInButtonProps) {
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [venueLastCheckIn, setVenueLastCheckIn] = useState<string | null>(null);

  useEffect(() => {
    if (user && role !== 'admin') {
      fetchStatus();
    }
  }, [user, role, placeId, eventId]);


  const calculateTimeLeft = (lastCheckInStr: string) => {
    const lastCheckIn = new Date(lastCheckInStr).getTime();
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const diff = (lastCheckIn + twentyFourHours) - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const fetchStatus = async () => {
    const token = Cookies.get('auth_token');
    if (!token || !user) return;

    try {
      const params = placeId ? `place_id=${placeId}` : `event_id=${eventId}`;
      const res = await axios.get(`http://localhost:8000/api/check-ins/status?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setVenueLastCheckIn(res.data.last_check_in_at);
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error);
    }
  };


  useEffect(() => {
    if (!venueLastCheckIn) {
      setCanCheckIn(true);
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeLeft(venueLastCheckIn);
      if (remaining) {
        setCanCheckIn(false);
        setTimeLeft(remaining);
      } else {
        setCanCheckIn(true);
        setTimeLeft(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [venueLastCheckIn]);

  const handleCheckIn = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    const token = Cookies.get('auth_token');

    try {
      await axios.post('http://localhost:8000/api/check-ins', 
        { place_id: placeId, event_id: eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local last check-in time for this venue
      const now = new Date().toISOString();
      setVenueLastCheckIn(now);
      setCanCheckIn(false);
      setTimeLeft("23h 59m 59s");
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      
    } catch (error: any) {
      console.error('Check-in failed:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCheckIn && timeLeft) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 font-bold cursor-not-allowed opacity-80">
          <Clock className="h-5 w-5" />
          Next Check-in in {timeLeft}
        </div>
        <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">24h Cooldown Active</p>
      </div>
    );
  }

  if (role === 'admin') return null;

  return (
    <button
      onClick={handleCheckIn}
      disabled={isLoading || !canCheckIn}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg ${
        isLoading || !canCheckIn
          ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
          : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MapPin className="h-5 w-5" />
      )}
      {isLoading ? 'Checking in...' : 'Check In'}
    </button>
  );
}

