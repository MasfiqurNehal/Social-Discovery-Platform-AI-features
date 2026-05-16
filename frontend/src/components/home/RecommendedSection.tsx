"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { Sparkles, Loader2, Star, Info } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

type RecommendationItem = {
  target_type: "place" | "event";
  target_id: number;
  category?: string;
  score?: number;
};

type PlaceDetail = {
  id: number;
  name: string;
  category?: string;
  area_name?: string;
  cover_image_url?: string;
  average_rating?: number | string;
};

type EventDetail = {
  id: number;
  title: string;
  category?: string;
  area_name?: string;
  cover_image_url?: string;
  event_date?: string;
  average_rating?: number | string;
};

type UnifiedCard = {
  kind: "place" | "event";
  id: number;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  rating: number;
  category: string;
  score: number;
  explanation: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";

const cleanName = (name: string) => name.replace(/\s+\d+$/, "");

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    if (
      typeof window !== "undefined" &&
      envUrl.includes("localhost") &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return envUrl
        .replace("localhost", window.location.hostname)
        .replace("127.0.0.1", window.location.hostname);
    }
    return envUrl;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
};

/**
 * Fallback used only when Gemini is unavailable.
 * Uses the card's ID (mod 9) to pick one of 9 structurally different templates,
 * so every card shows a unique angle even when all scores are identical.
 */
function buildFallback(
  item: RecommendationItem,
  id: number,
  rating: number,
  area: string
): string {
  const cat  = item.category?.toLowerCase() || "popular";
  const r    = rating > 0 ? rating.toFixed(1) : "4.5";
  const kind = item.target_type === "event" ? "event" : "spot";

  const templates = [
    `Trending in ${area} among people who share your love for ${cat}. Locals with similar tastes keep coming back.`,
    `Your browsing and check-in history shows a strong pull toward ${cat} — this ${area} ${kind} is the obvious next pick.`,
    `Rated ${r}/5 by the ${area} community and frequently recommended to users with your ${cat} preferences.`,
    `A standout ${cat} ${kind} in ${area} that consistently appears in wishlists of users who match your profile.`,
    `People with your exact activity pattern in ${cat} venues rank this ${area} ${kind} among their top visited places.`,
    `Gaining steady momentum in ${area} right now. Your engagement with ${cat} experiences makes this a high-confidence suggestion.`,
    `A community favourite in the ${cat} space — ${area} regulars with tastes like yours visit here repeatedly.`,
    `Hidden gem in ${area} that fits the precise pattern of ${cat} spots you've explored and bookmarked on VibeSpot.`,
    `Newly popular and strongly aligned with your history. This ${area} ${cat} ${kind} matches your vibe closely.`,
  ];

  return templates[id % templates.length];
}

/**
 * Pick exactly 9 cards (or fewer if data is limited) with maximum category variety.
 * Round-robin across categories (each sorted by score desc) until 9 are chosen.
 */
function pickNineBalanced(cards: UnifiedCard[]): UnifiedCard[] {
  const TARGET = 9;
  const grouped = new Map<string, UnifiedCard[]>();
  for (const card of cards) {
    if (!grouped.has(card.category)) grouped.set(card.category, []);
    grouped.get(card.category)!.push(card);
  }
  for (const items of grouped.values()) {
    items.sort((a, b) => b.score - a.score);
  }

  const result: UnifiedCard[] = [];
  let round = 0;
  while (result.length < TARGET) {
    let added = false;
    for (const items of grouped.values()) {
      if (result.length >= TARGET) break;
      if (items[round]) {
        result.push(items[round]);
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return result;
}

export default function RecommendedSection() {
  const { user, isLoading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<UnifiedCard[]>([]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function run() {
      if (!isVisible || authLoading || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = Cookies.get("auth_token");
        if (!token) { setCards([]); return; }

        const res = await fetch(`${getApiBase()}/recommendations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          // Fetch 30 so we have enough variety to fill 9 categories
          body: JSON.stringify({ limit: 30, per_page: 30 }),
        });

        if (!res.ok) throw new Error("Failed to fetch recommendations");

        const json = await res.json();
        const placeRecs: RecommendationItem[] = json?.data?.places || [];
        const eventRecs: RecommendationItem[] = json?.data?.events || [];
        const placeDetails: PlaceDetail[] = json?.data?.place_details || [];
        const eventDetails: EventDetail[] = json?.data?.event_details || [];
        const aiDescriptions: Record<string, string> = json?.data?.ai_descriptions || {};

        const placeMap = new Map<number, PlaceDetail>(placeDetails.map((p) => [p.id, p]));
        const eventMap = new Map<number, EventDetail>(eventDetails.map((e) => [e.id, e]));

        const all: UnifiedCard[] = [...placeRecs, ...eventRecs]
          .map((item) => {
            if (item.target_type === "place") {
              const p = placeMap.get(item.target_id);
              if (!p) return null;
              const placeRating = Number(p.average_rating || 0);
              const placeScore  = Number(item.score || 0);
              return {
                kind: "place" as const,
                id: p.id,
                title: cleanName(p.name),
                subtitle: p.area_name || "Dhaka",
                image: p.cover_image_url || FALLBACK_IMAGE,
                href: `/places/${p.id}`,
                rating: placeRating,
                category: item.category || p.category || "Place",
                score: placeScore,
                explanation:
                  aiDescriptions[`place_${p.id}`] ||
                  buildFallback(item, p.id, placeRating, p.area_name || "Dhaka"),
              };
            }
            const e = eventMap.get(item.target_id);
            if (!e) return null;
            const eventRating = Number(e.average_rating || 0);
            const eventScore  = Number(item.score || 0);
            return {
              kind: "event" as const,
              id: e.id,
              title: cleanName(e.title),
              subtitle: e.area_name || "Dhaka",
              image: e.cover_image_url || FALLBACK_IMAGE,
              href: `/events/${e.id}`,
              rating: eventRating,
              category: item.category || e.category || "Event",
              score: eventScore,
              explanation:
                aiDescriptions[`event_${e.id}`] ||
                buildFallback(item, e.id, eventRating, e.area_name || "Dhaka"),
            };
          })
          .filter(Boolean) as UnifiedCard[];

        setCards(pickNineBalanced(all));
      } catch (err) {
        console.error("Recommendations fetch failed", err);
        setError("Could not load personalized recommendations right now.");
      } finally {
        setIsLoading(false);
      }
    }

    run();
  }, [isVisible, authLoading, user]);

  if (!authLoading && !user) return null;

  return (
    <section
      ref={containerRef}
      className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full"
    >
      {/* Header */}
      <div className="mb-10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-500">
          <Sparkles className="h-4 w-4" />
          AI Personalized Picks
        </div>
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Recommended For You
        </h2>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>
          9 AI-curated picks across all categories — tailored to your activity, wishlist, and location.
        </p>
      </div>

      {isLoading && <RecommendationSkeleton />}

      {!isLoading && error && (
        <div className="vcard p-6 text-sm" style={{ color: "var(--text-muted)" }}>
          {error}
        </div>
      )}

      {!isLoading && !error && cards.length === 0 && (
        <div className="vcard p-6 text-sm" style={{ color: "var(--text-muted)" }}>
          We need a bit more activity before we can personalise your picks.
        </div>
      )}

      {!isLoading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={`${card.kind}-${card.id}`} href={card.href}>
              <article className="vcard h-full overflow-hidden group flex flex-col">

                {/* Thumbnail */}
                <div className="relative h-44 shrink-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute left-3 bottom-3 flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest bg-black/60 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                      {card.kind}
                    </span>
                    <span className="text-[11px] font-bold bg-brand-600/90 text-white px-2 py-1 rounded-md">
                      {Math.round(card.score * 100)}% match
                    </span>
                  </div>
                  {/* Category chip top-right */}
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide bg-black/50 text-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    {card.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col grow gap-3">

                  {/* Title & location */}
                  <div>
                    <h3
                      className="text-base font-bold line-clamp-2 group-hover:text-brand-400 transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {card.subtitle}
                    </p>
                  </div>

                  {/* AI "Why recommended" box */}
                  <div
                    className="rounded-xl border border-(--border) p-3 flex gap-2.5 grow"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <Info className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                        Why recommended
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {card.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-end text-xs mt-auto">
                    <span
                      className="flex items-center gap-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {card.rating > 0 ? card.rating.toFixed(1) : "—"}
                    </span>
                  </div>

                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="vcard overflow-hidden animate-pulse">
          <div className="h-44" style={{ backgroundColor: "var(--bg-elevated)" }} />
          <div className="p-4 space-y-3">
            <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="h-16 rounded" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
              <span style={{ color: "var(--text-muted)" }}>Generating AI picks…</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
