"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PlaceCard from "@/components/cards/PlaceCard";

export default function CategorySlider({ category, places }: { category: string, places: any[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [places]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.9;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {category}
        </h2>
        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-brand-500/10 text-brand-500">
          {places.length}
        </span>
      </div>

      <div className="relative group/slider">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-opacity bg-brand-500 text-white hover:bg-brand-600 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-opacity bg-brand-500 text-white hover:bg-brand-600 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
        >
          {places.map((place: any) => (
            <div 
              key={place.id} 
              className="flex-none snap-start w-full sm:w-[calc(50%-12px)] xl:w-[calc(33.3333%-16px)]"
            >
              <PlaceCard place={place} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

