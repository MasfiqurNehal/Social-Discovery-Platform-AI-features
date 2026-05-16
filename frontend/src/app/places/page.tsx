import PlaceCard from "@/components/cards/PlaceCard";
import CompactFilters from "@/components/filters/CompactFilters";
import CategorySlider from "@/components/sliders/CategorySlider";
import { Suspense } from "react";
import Link from "next/link";
import PaginationLinks from "@/components/shared/PaginationLinks";

async function getPlaces(searchParams: any) {
  try {
    const query = new URLSearchParams(searchParams).toString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/places?${query}`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    
    return res.json();
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
}

export default async function PlacesPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const { data: places, meta } = await getPlaces(resolvedParams);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Explore Places</h1>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          Discover the soul of Dhaka through curated spots that match your vibe.
        </p>
      </div>

      <div className="max-w-5xl mx-auto mb-12">
        <Suspense fallback={<div className="h-20 bg-[var(--bg-elevated)] rounded-2xl animate-pulse" />}>
          <CompactFilters type="places" />
        </Suspense>
      </div>
        
      <div className="w-full">
        {places && places.length > 0 ? (
          <>
            <div className="flex flex-col gap-16">
              {Object.entries(
                places.reduce((acc: any, place: any) => {
                  if (!acc[place.category]) acc[place.category] = [];
                  acc[place.category].push(place);
                  return acc;
                }, {})
              ).map(([category, catPlaces]: [string, any]) => (
                <CategorySlider key={category} category={category} places={catPlaces} />
              ))}
            </div>
            <PaginationLinks
              basePath="/places"
              currentPage={meta?.current_page || 1}
              lastPage={meta?.last_page || 1}
              searchParams={resolvedParams}
            />
          </>
        ) : (
          <div className="empty-state text-center py-32 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)]">
            <div className="bg-brand-500/10 p-5 rounded-full mb-6 inline-flex items-center justify-center">
              <p className="text-brand-500 font-bold text-4xl">😞</p>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>No places found</p>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search terms to discover more locations.</p>
            <Link 
              href="/places"
              className="mt-8 px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-400 transition-all block"
            >
              Clear All Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

