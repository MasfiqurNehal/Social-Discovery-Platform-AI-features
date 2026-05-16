"use client";

import { useState, useEffect } from 'react';
import { Search, MapPin, Tag } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FiltersSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [area, setArea] = useState(searchParams.get('area') || 'All');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      if (area !== 'All') params.set('area', area);

      router.push(`/places?${params.toString()}`, { scroll: false });
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, category, area, router]);

  const categories = ['All', 'Food & Drinks', 'Entertainment', 'Culture', 'Outdoors'];
  const areas = ['All', 'Gulshan', 'Banani', 'Dhanmondi', 'Mirpur'];

  return (
    <div className="filters-panel p-6 sticky top-24">
      <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Filters</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/40"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              placeholder="Search places..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Tag className="h-4 w-4" /> Category
          </label>
          <div className="space-y-3">
            {categories.map((c) => (
              <label key={c} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="category"
                  value={c}
                  checked={category === c}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-4 h-4 accent-brand-500"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                />
                <span
                  className="text-sm transition-all"
                  style={{ color: category === c ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: category === c ? 600 : 400 }}
                >
                  {c}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <MapPin className="h-4 w-4" /> Area Zone
          </label>
          <div className="space-y-3">
            {areas.map((a) => (
              <label key={a} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="area"
                  value={a}
                  checked={area === a}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-4 h-4 accent-brand-500"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                />
                <span
                  className="text-sm transition-all"
                  style={{ color: area === a ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: area === a ? 600 : 400 }}
                >
                  {a}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

