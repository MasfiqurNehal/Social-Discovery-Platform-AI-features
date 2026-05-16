"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Star, MapPin, Sparkles, TrendingUp, DollarSign,
  Users, Zap, Award, ChevronRight, Loader2,
} from "lucide-react";

interface SummaryData {
  type: string;
  name?: string;
  title?: string;
  area: string;
  category: string;
  rating: number;
  reviews: number;
  overview: string;
  // place fields
  whyPopular?: string[];
  highlights?: string[];
  perfectFor?: string[];
  cost?: { tier: string; label: string; range: string; estimate: string; value: string };
  // event fields
  whyAttend?: string[];
  eventDetails?: { date: string; time: string; price: string; location: string };
  verdict: { score: number; label: string; recommendation: string };
  source?: string;
}

interface Props {
  type: "place" | "event";
  data: Record<string, any>;
  onClose: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8.5 ? "from-emerald-500 to-teal-400" :
    score >= 7  ? "from-brand-500 to-blue-400" :
    score >= 5  ? "from-amber-500 to-yellow-400" :
                  "from-zinc-500 to-zinc-400";
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r ${color} text-white text-sm font-black shadow-lg`}>
      <Award className="h-3.5 w-3.5" />
      {score.toFixed(1)} / 10
    </div>
  );
}

function Section({ icon, title, children, delay = 0 }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-brand-400">{icon}</span>
        <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <ChevronRight className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-elevated)" }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {[80, 60, 100, 60].map((w, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 rounded-full w-24" style={{ backgroundColor: "var(--bg-elevated)" }} />
          <div className={`h-4 rounded-full w-${w === 100 ? 'full' : `${w}%`}`} style={{ backgroundColor: "var(--bg-elevated)" }} />
          {i > 0 && <div className="h-4 rounded-full w-2/3" style={{ backgroundColor: "var(--bg-elevated)" }} />}
        </div>
      ))}
    </div>
  );
}

export default function AISummaryModal({ type, data, onClose }: Props) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const displayName = type === "place"
    ? (data.name || "").replace(/\s+\d+$/, "")
    : data.title || "";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setSummary(json.summary);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [type, data]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      >
        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {/* Gradient header band */}
          <div className="relative shrink-0 px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, var(--brand-600, #2563eb) 0%, #7c3aed 100%)", opacity: 1 }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* AI badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                AI Summary
                {summary?.source === 'claude' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
                    Claude AI
                  </span>
                )}
              </div>
            </div>

            {/* Name + meta */}
            <h2 className="text-xl font-black text-white leading-tight pr-8 mb-2">
              {displayName || "Loading…"}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {data.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/80">
                <MapPin className="h-3 w-3" /> {data.area_name}, Dhaka
              </span>
              {data.average_rating && (
                <span className="flex items-center gap-1 text-xs text-white/80">
                  <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                  {parseFloat(String(data.average_rating)).toFixed(1)}
                  {data.total_reviews > 0 && ` · ${data.total_reviews} reviews`}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {loading && <SkeletonLoader />}

            {error && (
              <div className="text-center py-10 space-y-2">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Could not generate summary</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Please try again in a moment.</p>
              </div>
            )}

            {summary && !loading && (
              <>
                {/* Overview */}
                <Section icon={<Sparkles className="h-4 w-4" />} title="What is this?" delay={0}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {summary.overview}
                  </p>
                </Section>

                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

                {/* Why Popular / Why Attend */}
                {type === "place" && summary.whyPopular && (
                  <Section icon={<TrendingUp className="h-4 w-4" />} title="Why It's Popular" delay={0.05}>
                    <BulletList items={summary.whyPopular} />
                  </Section>
                )}
                {type === "event" && summary.whyAttend && (
                  <Section icon={<TrendingUp className="h-4 w-4" />} title="Why Attend" delay={0.05}>
                    <BulletList items={summary.whyAttend} />
                  </Section>
                )}

                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

                {/* Cost (place) or Event Details (event) */}
                {type === "place" && summary.cost && (
                  <Section icon={<DollarSign className="h-4 w-4" />} title="Cost & Budget" delay={0.1}>
                    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-elevated)" }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-brand-400">{summary.cost.tier}</span>
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{summary.cost.label}</span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>·</span>
                        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{summary.cost.range}</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{summary.cost.estimate}</p>
                      <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>{summary.cost.value}</p>
                    </div>
                  </Section>
                )}

                {type === "event" && summary.eventDetails && (
                  <Section icon={<Zap className="h-4 w-4" />} title="Event Details" delay={0.1}>
                    <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: "var(--bg-elevated)" }}>
                      {Object.entries(summary.eventDetails).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-3">
                          <span className="text-xs font-black uppercase tracking-wider w-16 shrink-0 pt-0.5" style={{ color: "var(--text-muted)" }}>
                            {k}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

                {/* Perfect For */}
                {summary.perfectFor && (
                  <Section icon={<Users className="h-4 w-4" />} title="Perfect For" delay={0.15}>
                    <Tags items={summary.perfectFor} />
                  </Section>
                )}

                {/* Highlights (place only) */}
                {type === "place" && summary.highlights && (
                  <>
                    <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                    <Section icon={<Zap className="h-4 w-4" />} title="Key Highlights" delay={0.2}>
                      <BulletList items={summary.highlights} />
                    </Section>
                  </>
                )}

                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

                {/* AI Verdict */}
                <Section icon={<Award className="h-4 w-4" />} title="AI Verdict" delay={0.25}>
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "linear-gradient(135deg, var(--brand-600, #1d4ed8)11, #7c3aed11)" , border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <ScoreBadge score={summary.verdict.score} />
                      <span className="text-sm font-bold text-brand-400">{summary.verdict.label}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {summary.verdict.recommendation}
                    </p>
                  </div>
                </Section>

                {/* Disclaimer */}
                <p className="text-[10px] text-center pb-2" style={{ color: "var(--text-muted)" }}>
                  Generated by VibeSpot AI · Based on community data and category insights
                </p>
              </>
            )}
          </div>

          {/* Loading indicator bar */}
          {loading && (
            <div className="shrink-0 px-6 py-3 border-t flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
              <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                VibeSpot AI is analysing this {type}…
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
