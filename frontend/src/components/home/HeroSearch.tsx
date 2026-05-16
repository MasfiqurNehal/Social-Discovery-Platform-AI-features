"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'places' | 'events'>('places');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const path = activeTab === 'places' ? '/places' : '/events';
    router.push(query ? `${path}?search=${encodeURIComponent(query)}` : path);
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Tab Toggle */}
      <div className="flex items-center justify-center gap-1 p-1.5 rounded-2xl w-fit mx-auto" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        {(['places', 'events'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize"
            style={{
              backgroundColor: activeTab === tab ? '#0284c7' : 'transparent',
              color: activeTab === tab ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? '0 0 14px rgba(2, 132, 199, 0.35)' : 'none',
            }}
          >
            {tab === 'places' ? '📍 Places' : '🎉 Events'}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch}>
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 border-2 border-[var(--border)] focus-within:border-[var(--accent-brand)] focus-within:shadow-[0_0_20px_var(--accent-brand-glow)] animate-breathe"
          style={{
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <Search className="h-5 w-5 shrink-0 text-brand-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder={activeTab === 'places' ? 'Search cafes, rooftops, parks...' : 'Search concerts, art shows, markets...'}
          />
          <div className="hidden sm:flex items-center gap-1.5 text-sm pl-4 shrink-0" style={{ color: 'var(--text-muted)' }}>
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            <span>Dhaka</span>
          </div>
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0"
            style={{ boxShadow: '0 0 14px rgba(2, 132, 199, 0.4)' }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Quick Tags */}
      <div className="flex flex-wrap justify-center gap-2">
        {['Rooftop', 'Coffee', 'Heritage', 'Music'].map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            className="text-sm px-4 py-2 rounded-xl transition-all duration-200 hover:text-brand-400 hover:bg-brand-600/10 border border-[var(--border)] hover:border-[var(--accent-brand)]"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

