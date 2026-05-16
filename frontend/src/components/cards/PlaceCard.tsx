"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import WishlistButton from "../shared/WishlistButton";
import AISummaryModal from "../shared/AISummaryModal";

const cleanName = (name: string) => name.replace(/\s+\d+$/, "");

const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
  "Food & Drinks": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1551024709-8f23befc548e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80",
  ],
  "Landmarks & Heritage": [
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?auto=format&fit=crop&w=600&q=80",
  ],
  Outdoors: [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80",
  ],
  Culture: [
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1574182245530-967d9b3831af?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1545959570-a94084071b5d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=600&q=80",
  ],
  Shopping: [
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507842217343-583bb2f6db77?auto=format&fit=crop&w=600&q=80",
  ],
  "Cinema & Screenings": [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1512070679279-8988d32161be?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1581957141780-6a5a0b3a5d54?auto=format&fit=crop&w=600&q=80",
  ],
  Nightlife: [
    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1415886606330-7a04f53d1195?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1571266028243-d220c6191021?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
  ],
  Wellness: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
  ],
  "Family & Kids": [
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1503256207526-0d5523f31059?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1484591974057-265bb767ef71?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1564429097439-b85162f33dc3?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&w=600&q=80",
  ],
  "Sports & Fitness": [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1590227632591-f70c8e965e93?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?auto=format&fit=crop&w=600&q=80",
  ],
  Entertainment: [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1522158637959-30ab8018e198?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1508854710579-5cecc3a9ff17?auto=format&fit=crop&w=600&q=80",
  ],
};

const DEFAULT_POOL = ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80"];

function getCategoryImage(category: string, id: number): string {
  const pool = CATEGORY_IMAGE_POOLS[category] ?? DEFAULT_POOL;
  return pool[id % pool.length];
}

interface PlaceProps {
  place: {
    id: number;
    name: string;
    category: string;
    area_name: string;
    cover_image_url: string;
    average_rating: number | string;
    budget_tier: string;
    budget_label?: string;
    budget_range?: string;
    total_reviews: number;
    is_wishlisted?: boolean;
  };
}

export default function PlaceCard({ place }: PlaceProps) {
  const [showModal, setShowModal] = useState(false);
  const rating = parseFloat(String(place.average_rating));

  return (
    <>
      <div className="vcard group h-full flex flex-col relative">
        {/* Clickable area navigates to place detail */}
        <Link href={`/places/${place.id}`} className="flex flex-col flex-1">
          {/* Image */}
          <div className="relative h-52 w-full overflow-hidden rounded-t-[inherit]">
            <img
              src={place.cover_image_url || getCategoryImage(place.category, place.id)}
              alt={place.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />

            {/* Wishlist */}
            <div className="absolute top-3 right-3 z-20">
              <WishlistButton placeId={place.id} initialIsWishlisted={place.is_wishlisted} />
            </div>

            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/50 text-white/90 backdrop-blur-md">
                {place.category}
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-brand-600/90 text-white backdrop-blur-md">
                {place.budget_tier || "৳৳"} {place.budget_label && `· ${place.budget_label}`}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col grow gap-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col gap-1">
                <h3
                  className="text-base font-bold leading-snug group-hover:text-brand-400 transition-colors line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {cleanName(place.name)}
                </h3>
                {place.budget_range && place.budget_range !== "0-0" && (
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-tighter">
                    EST. ৳{place.budget_range} BDT
                  </p>
                )}
              </div>
              <div
                className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg border border-(--border)"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {isNaN(rating) ? "—" : rating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>{place.area_name}, Dhaka</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-medium">Open Now</span>
                <span style={{ color: "var(--text-muted)" }}>· {place.total_reviews} reviews</span>
              </div>
            </div>
          </div>
        </Link>

        {/* AI Summarize button — outside Link, won't trigger navigation */}
        <div className="px-5 pb-5">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #2563eb18, #7c3aed18)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #2563eb30, #7c3aed30)";
              e.currentTarget.style.borderColor = "#7c3aed60";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #2563eb18, #7c3aed18)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>AI Summarize</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <AISummaryModal type="place" data={place} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
