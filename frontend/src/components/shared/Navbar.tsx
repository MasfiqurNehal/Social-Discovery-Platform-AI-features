"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Sun, Moon, Heart, User, Compass, LogOut, BookOpen } from 'lucide-react';
import { useTheme } from '@/app/providers';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, role, isLoading, logout } = useAuth();

  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';
  const pathname = usePathname();
  const isAdmin = (user && role === 'admin') || pathname === '/admin-login' || pathname.startsWith('/admin/');

  return (
    <nav className="sticky top-0 z-50 nav-glass shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className={`w-10 h-10 bg-gradient-to-br ${isAdmin ? 'from-red-500 to-red-700' : 'from-brand-500 to-brand-700'} rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.25)] group-hover:shadow-[0_0_28px_rgba(14,165,233,0.4)] transition-shadow duration-300`}>
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline gap-0">
              <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Vibe
              </span>
              <span className={`text-xl font-extrabold tracking-tight ${isAdmin ? 'text-red-500' : 'text-brand-500'}`}>
                Spot
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ml-1.5 px-1.5 py-0.5 rounded-md ${isAdmin ? 'bg-red-600/15 text-red-500' : 'bg-brand-600/15 text-brand-500'} hidden sm:inline-block`}>
                Dhaka
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {[
              { href: '/places', label: 'Places', icon: <MapPin className="h-[18px] w-[18px]" /> },
              { href: '/events', label: 'Events', icon: <Compass className="h-[18px] w-[18px]" /> },
              { href: '/blog', label: 'Blog', icon: <BookOpen className="h-[18px] w-[18px]" /> },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`group/link relative flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300 ${isAdmin ? 'hover:bg-red-500/10' : 'hover:bg-brand-500/10'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isAdmin ? 'group-hover/link:bg-red-500' : 'group-hover/link:bg-brand-500'} group-hover/link:text-white`}
                  style={{ color: 'var(--text-muted)' }}>
                  {icon}
                </div>
                <span className={`text-[15px] font-bold tracking-wide transition-colors ${isAdmin ? 'group-hover/link:text-red-500' : 'group-hover/link:text-brand-500'}`}
                  style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
              </Link>
            ))}

            {/* Show Admin Dashboard link if user is logged in as admin */}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="group/link relative px-5 py-2.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all duration-200 text-red-600 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-red-500/20"
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isAdmin ? 'hover:text-red-500 hover:bg-red-500/5' : 'hover:text-brand-500 hover:bg-brand-500/5'} hover:scale-105`}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                }}
              >
                {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            )}

            {!isLoading && !user && (
              <>
                <Link href="/login">
                  <button
                    className="hidden sm:flex items-center px-5 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 hover:text-brand-500 hover:bg-brand-500/5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-6 py-2.5 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_28px_rgba(14,165,233,0.45)] hover:scale-[1.02]">
                    Get Started
                  </button>
                </Link>
              </>
            )}

            {!isLoading && user && (
              <>
                {role !== 'admin' && (
                  <>
                    <NotificationsDropdown />

                    <Link
                      href="/wishlist"
                      aria-label="Wishlist"
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:text-brand-500 hover:bg-brand-500/5 hover:scale-105"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      <Heart className="h-[18px] w-[18px]" />
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  aria-label="Profile"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isAdmin ? 'hover:text-red-500 hover:bg-red-500/5' : 'hover:text-brand-500 hover:bg-brand-500/5'} hover:scale-105`}
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  <User className="h-[18px] w-[18px]" />
                </Link>

                {/* Profile menu trigger / Logout */}
                <button
                  onClick={logout}
                  aria-label="Log out"
                  title="Log out"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:text-red-500 hover:bg-red-500/10 hover:scale-105 border border-transparent hover:border-red-500/20"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}

