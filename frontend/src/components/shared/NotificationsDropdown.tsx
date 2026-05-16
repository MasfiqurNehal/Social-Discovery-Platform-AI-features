import { useState, useEffect, useRef } from 'react';
import { Bell, Info, Star, MapPin, Calendar, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    const token = Cookies.get('auth_token');
    if (!token || !user) return;

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/notifications", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const result = await res.json();
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  };


  // Optimized polling for notifications
  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchNotifications();

    // Set up polling with visibility awareness
    const intervalId = setInterval(() => {
      // Only fetch if tab is active and visible
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        fetchNotifications();
      }
    }, 60000); // 1 minute interval to reduce load

    // Listener for window focus to refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    // Listen for manual refreshes from other components (e.g. check-in, wishlist)
    const handleManualRefresh = () => fetchNotifications();

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('refresh-notifications', handleManualRefresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('refresh-notifications', handleManualRefresh);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    const token = Cookies.get('auth_token');
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/notifications/read-all", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const markAsRead = async (id: string | number) => {
    const token = Cookies.get('auth_token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const clearAll = async () => {
    const token = Cookies.get('auth_token');
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/notifications/clear-all", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'checkin': return <MapPin className="h-4 w-4 text-emerald-500" />;
      case 'wishlist': return <Star className="h-4 w-4 text-amber-500" />;
      case 'review': return <CheckCircle2 className="h-4 w-4 text-sky-500" />;
      default: return <Info className="h-4 w-4 text-brand-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:text-brand-500 hover:bg-brand-500/5 hover:scale-105"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
        }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 border-2 border-[var(--bg-elevated)] rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 sm:w-96 surface-elevated border border-[var(--border)] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-default)]/50">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 flex gap-4 transition-colors hover:bg-brand-500/5 group ${!n.is_read ? 'bg-brand-500/[0.02]' : ''}`}
                  >
                    <div className="mt-1 w-9 h-9 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-sm">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[13px] font-bold leading-tight ${!n.is_read ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-[var(--text-muted)] shrink-0">{formatTime(n.created_at)}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {n.message}
                      </p>
                      
                      {!n.is_read && (
                        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-400 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[var(--text-muted)] space-y-3">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-default)] flex items-center justify-center mx-auto border border-[var(--border)] border-dashed">
                  <Bell className="h-8 w-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{isLoading ? 'Fetching updates...' : 'All caught up!'}</p>
                  <p className="text-xs">No new notifications at the moment.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-[var(--bg-card)] text-center border-t border-[var(--border)]">
            <button 
              onClick={clearAll}
              disabled={notifications.length === 0}
              className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Clear all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

