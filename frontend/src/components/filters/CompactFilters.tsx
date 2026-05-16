"use client";

import { useState, useEffect } from 'react';
import { Search, MapPin, Tag, ChevronDown, Filter, Star } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DHAKA_THANAS } from '@/constants/areas';

interface FilterProps {
  type: 'places' | 'events';
}

export default function CompactFilters({ type }: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [area, setArea] = useState(searchParams.get('area') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('search', search); else params.delete('search');
      if (category !== 'All') params.set('category', category); else params.delete('category');
      if (area !== 'All') params.set('area', area); else params.delete('area');
      if (sortBy !== 'default') params.set('sort', sortBy); else params.delete('sort');

      router.push(`/${type}?${params.toString()}`, { scroll: false });
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, category, area, sortBy, router, type, searchParams]);

  const categories = type === 'places' 
    ? ['All', 'Food & Drinks', 'Entertainment', 'Culture', 'Landmarks & Heritage', 'Outdoors', 'Cinema & Screenings', 'Shopping']
    : ['All', 'Culture', 'Food & Drinks', 'Entertainment', 'Festivals', 'Music'];

  const areas = ['All', ...DHAKA_THANAS];
  const sortOptions = [
    { id: 'default', label: 'Default' },
    { id: 'rating_desc', label: 'Top Rated First' },
    { id: 'rating_asc', label: 'Lowest Rated' },
  ];

  return (
    <div className="w-full space-y-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search Bar - Expanded by default */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 rounded-2xl text-sm border border-[var(--border)] outline-none transition-all focus:ring-2 focus:ring-brand-500/40"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            placeholder={`Search ${type}...`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold border transition-all ${isOpen ? 'bg-brand-500 text-white border-brand-500' : 'border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
            style={!isOpen ? { backgroundColor: 'var(--bg-card)' } : {}}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Filter Section */}
      {isOpen && (
        <div className="p-6 rounded-3xl border border-[var(--border)] surface-elevated animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Category Pills */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" /> Select Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${category === c ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-[var(--text-primary)]'}`}
                    style={category !== c ? { backgroundColor: 'var(--bg-card)' } : {}}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Options */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Area (Thana)
              </label>
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {areas.map((a) => (
                  <button
                    key={a}
                    onClick={() => setArea(a)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${area === a ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-[var(--text-primary)]'}`}
                    style={area !== a ? { backgroundColor: 'var(--bg-card)' } : {}}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <Star className="h-3.5 w-3.5" /> Sort By
              </label>
              <div className="flex flex-col gap-2">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border ${sortBy === opt.id ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-[var(--text-primary)]'}`}
                    style={sortBy !== opt.id ? { backgroundColor: 'var(--bg-card)' } : {}}
                  >
                    {opt.label}
                    {sortBy === opt.id && <ChevronDown className="h-3 w-3 -rotate-90" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end gap-3">
             <button 
              onClick={() => { setCategory('All'); setArea('All'); setSearch(''); setSortBy('default'); }}
              className="px-6 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-brand-500 transition-colors"
             >
               Reset All
             </button>
             <button 
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-400 transition-colors"
             >
               Apply Filters
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

