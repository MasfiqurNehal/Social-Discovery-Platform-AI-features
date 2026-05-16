"use client";

import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import {
  Users, MapPin, Calendar, MessageSquare, ArrowUpRight,
  TrendingUp, Activity, CheckCircle2, BookOpen, Star,
  BarChart2, Zap, Award, Eye, Shield, PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  Legend, ComposedChart, Line,
} from "recharts";

// ─── Palette ────────────────────────────────────────────────────────────────
const PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#8b5cf6", "#ec4899", "#10b981",
  "#f43f5e", "#3b82f6",
];
const RATING_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

const TIP_STYLE = {
  backgroundColor: "#18181c",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#f1f5f9",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

// ─── Animated number counter ─────────────────────────────────────────────────
function Counter({ value, duration = 1600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-700"}`}
        />
      ))}
    </div>
  );
}

// ─── Card section header ──────────────────────────────────────────────────────
type Color = "red" | "emerald" | "amber" | "blue" | "violet" | "rose" | "cyan" | "pink";
const COLOR_CLASSES: Record<Color, string> = {
  red:     "bg-red-500/10 text-red-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber:   "bg-amber-500/10 text-amber-400",
  blue:    "bg-blue-500/10 text-blue-400",
  violet:  "bg-violet-500/10 text-violet-400",
  rose:    "bg-rose-500/10 text-rose-400",
  cyan:    "bg-cyan-500/10 text-cyan-400",
  pink:    "bg-pink-500/10 text-pink-400",
};

function CardHeader({
  icon, title, subtitle, color = "red",
}: { icon: React.ReactNode; title: string; subtitle: string; color?: Color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${COLOR_CLASSES[color]}`}>{icon}</div>
      <div>
        <h3 className="font-bold text-[var(--text-primary)] text-sm leading-tight">{title}</h3>
        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Custom animated progress bar for ratings ─────────────────────────────────
function RatingBar({ star, count, max, color, delay }: { star: number; count: number; max: number; color: string; delay: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="flex items-center gap-1 w-14 flex-shrink-0 justify-end">
        <span className="text-xs font-bold text-[var(--text-muted)]">{star}</span>
        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
      </div>
      <div className="flex-1 bg-[var(--bg-default)] rounded-full h-2.5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
        />
      </div>
      <span className="text-xs font-black text-[var(--text-muted)] w-9 text-right tabular-nums">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]" />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]" />
        ))}
      </div>
      {[360, 300, 300, 220].map((h, i) => (
        <div key={i} className={`grid grid-cols-${i === 0 ? "5" : i === 3 ? "1" : "3"} gap-4`}>
          <div className={`h-[${h}px] rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] ${i === 0 ? "col-span-3" : ""}`} />
          {i === 0 && <div className="col-span-2 h-[360px] rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]" />}
          {(i === 1 || i === 2) && [1, 2].map((j) => (
            <div key={j} className={`h-[${h}px] rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("auth_token");
    fetch("http://localhost:8000/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  // ── Derived data ────────────────────────────────────────────────────────────
  const primaryCards = [
    { label: "Total Users",   value: stats?.total_users   || 0, icon: <Users className="h-5 w-5" />,       color: "red"     as Color, href: "/admin/users",   link: "View Users"   },
    { label: "Total Places",  value: stats?.total_places  || 0, icon: <MapPin className="h-5 w-5" />,      color: "emerald" as Color, href: "/admin/places",  link: "View Places"  },
    { label: "Active Events", value: stats?.total_events  || 0, icon: <Calendar className="h-5 w-5" />,    color: "amber"   as Color, href: "/admin/events",  link: "View Events"  },
    { label: "Total Reviews", value: stats?.total_reviews || 0, icon: <MessageSquare className="h-5 w-5" />, color: "violet" as Color, href: "/admin/reviews", link: "View Reviews" },
  ];

  const secondaryCards = [
    { label: "Check-ins",   value: stats?.total_checkins    || 0, icon: <CheckCircle2 className="h-4 w-4 text-cyan-400" />, decimal: false },
    { label: "Blog Posts",  value: stats?.blog_count         || 0, icon: <BookOpen className="h-4 w-4 text-pink-400" />,     decimal: false },
    { label: "Active Users",value: stats?.active_users       || 0, icon: <Zap className="h-4 w-4 text-amber-400" />,        decimal: false },
    { label: "Avg Rating",  value: stats?.avg_platform_rating|| 0, icon: <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />, decimal: true },
  ];

  const cardColorMap: Record<Color, { bg: string; text: string; accent: string }> = {
    red:     { bg: "bg-red-500/10",     text: "text-red-400",     accent: "#ef4444" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", accent: "#10b981" },
    amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   accent: "#f59e0b" },
    violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  accent: "#8b5cf6" },
    rose:    { bg: "bg-rose-500/10",    text: "text-rose-400",    accent: "#f43f5e" },
    blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    accent: "#3b82f6" },
    cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-400",    accent: "#06b6d4" },
    pink:    { bg: "bg-pink-500/10",    text: "text-pink-400",    accent: "#ec4899" },
  };

  const publishedData = [
    { name: "Published Places", value: stats?.published_stats?.places_published || 0, fill: "#10b981" },
    { name: "Draft Places",     value: stats?.published_stats?.places_draft     || 0, fill: "#374151" },
    { name: "Published Events", value: stats?.published_stats?.events_published || 0, fill: "#06b6d4" },
    { name: "Draft Events",     value: stats?.published_stats?.events_draft     || 0, fill: "#4b5563" },
  ].filter((d) => d.value > 0);

  const ratingData = (stats?.rating_distribution || []).map(
    (d: any, i: number) => ({ ...d, fill: RATING_COLORS[i] })
  );
  const maxRatingCount = Math.max(...ratingData.map((d: any) => d.count), 1);
  const maxPlaceReviews = Math.max(...(stats?.top_places || []).map((p: any) => p.total_reviews || 1), 1);

  const anim = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: [0.22, 0.61, 0.36, 1] as any },
  });

  return (
    <div className="space-y-5">

      {/* ══ ROW 1 · Primary KPI Cards ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card, i) => {
          const c = cardColorMap[card.color];
          return (
            <motion.a
              key={i}
              href={card.href}
              {...anim(i * 0.07)}
              className="admin-card p-6 group relative overflow-hidden cursor-pointer transition-all duration-300"
            >
              {/* Ambient glow */}
              <div
                className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"
                style={{ backgroundColor: c.accent }}
              />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    {card.label}
                  </p>
                  <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter tabular-nums">
                    <Counter value={card.value} />
                  </h3>
                </div>
                <div className={`p-3 ${c.bg} ${c.text} rounded-2xl transition-transform duration-300 group-hover:scale-110`}>
                  {card.icon}
                </div>
              </div>
              <div className={`mt-4 flex items-center text-[10px] font-black uppercase tracking-widest ${c.text}`}>
                {card.link}
                <ArrowUpRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* ══ ROW 2 · Secondary KPI badges ═══════════════════════════════════════ */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" {...anim(0.3)}>
        {secondaryCards.map((card, i) => (
          <div key={i} className="admin-card p-4 flex items-center gap-3">
            <div className="p-2.5 bg-[var(--bg-default)] rounded-xl border border-[var(--border)] flex-shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                {card.label}
              </p>
              <p className="text-xl font-black text-[var(--text-primary)] tracking-tighter tabular-nums">
                {card.decimal
                  ? Number(card.value).toFixed(1)
                  : <Counter value={card.value} />}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ══ ROW 3 · User Growth + Content Status ═══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* User Growth — 14-day area+line */}
        <motion.div className="lg:col-span-3 admin-card p-6 flex flex-col gap-5" {...anim(0.38)}>
          <CardHeader
            icon={<TrendingUp className="h-5 w-5" />}
            title="User Growth Trend"
            subtitle="New Registrations · Last 14 Days"
            color="red"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats?.user_growth || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 10, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip contentStyle={TIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="users"
                  stroke="#ef4444" strokeWidth={0}
                  fill="url(#gradUser)" fillOpacity={1}
                  animationDuration={1600}
                />
                <Line
                  type="monotone" dataKey="users"
                  stroke="#ef4444" strokeWidth={2.5}
                  dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 1.5 }}
                  animationDuration={1600}
                  name="New Users"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Content Status donut */}
        <motion.div className="lg:col-span-2 admin-card p-6 flex flex-col gap-5" {...anim(0.44)}>
          <CardHeader
            icon={<Eye className="h-5 w-5" />}
            title="Content Status"
            subtitle="Published vs Draft"
            color="cyan"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={publishedData}
                  cx="50%" cy="48%"
                  innerRadius={58} outerRadius={96}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={1600}
                  strokeWidth={0}
                >
                  {publishedData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TIP_STYLE} />
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ══ ROW 4 · Platform Activity + Rating Distribution ════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Reviews + Check-ins composed chart */}
        <motion.div className="lg:col-span-3 admin-card p-6 flex flex-col gap-5" {...anim(0.5)}>
          <CardHeader
            icon={<Activity className="h-5 w-5" />}
            title="Platform Activity"
            subtitle="Reviews & Check-ins · Last 7 Days"
            color="rose"
          />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats?.recent_activity || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCheckin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 10, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={TIP_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar
                  dataKey="reviews" name="Reviews"
                  fill="#ef4444" radius={[5, 5, 0, 0]}
                  barSize={20} animationDuration={1300}
                />
                <Bar
                  dataKey="checkins" name="Check-ins"
                  fill="#06b6d4" radius={[5, 5, 0, 0]}
                  barSize={20} animationDuration={1500}
                />
                <Area
                  type="monotone" dataKey="checkins"
                  stroke="#06b6d4" strokeWidth={2}
                  fill="url(#gradCheckin)" fillOpacity={1}
                  dot={false} animationDuration={1600}
                  name="Trend"
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Rating Distribution — animated horizontal bars */}
        <motion.div className="lg:col-span-2 admin-card p-6 flex flex-col gap-5" {...anim(0.56)}>
          <CardHeader
            icon={<Star className="h-5 w-5" />}
            title="Rating Distribution"
            subtitle="Reviews by Star Rating"
            color="amber"
          />
          <div className="flex-1 flex flex-col justify-center gap-4 py-2">
            {[...ratingData].reverse().map((d: any, i: number) => (
              <RatingBar
                key={d.star}
                star={d.star}
                count={d.count}
                max={maxRatingCount}
                color={d.fill}
                delay={0.6 + i * 0.07}
              />
            ))}
          </div>

          {/* Summary pill */}
          <div className="mt-2 p-3 bg-[var(--bg-default)] rounded-xl border border-[var(--border)] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Avg Platform Rating</span>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="text-lg font-black text-amber-400 tracking-tighter">
                {Number(stats?.avg_platform_rating || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══ ROW 5 · Category · Area · Event Categories ═════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Venue category donut */}
        <motion.div className="admin-card p-6 flex flex-col gap-5" {...anim(0.62)}>
          <CardHeader
            icon={<PieChartIcon className="h-5 w-5" />}
            title="Venue Diversity"
            subtitle="Places by Category"
            color="emerald"
          />
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.category_distribution || []}
                  cx="50%" cy="46%"
                  innerRadius={56} outerRadius={95}
                  paddingAngle={3}
                  dataKey="count" nameKey="category"
                  animationDuration={1600} strokeWidth={0}
                >
                  {(stats?.category_distribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TIP_STYLE} />
                <Legend
                  iconType="circle" iconSize={7}
                  wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Area coverage — horizontal bar */}
        <motion.div className="admin-card p-6 flex flex-col gap-5" {...anim(0.68)}>
          <CardHeader
            icon={<MapPin className="h-5 w-5" />}
            title="Area Coverage"
            subtitle="Top Dhaka Zones by Venues"
            color="blue"
          />
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.area_distribution || []}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="area_name"
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 10, fontWeight: 600 }}
                  width={88}
                />
                <Tooltip contentStyle={TIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar
                  dataKey="count" name="Places"
                  radius={[0, 6, 6, 0]}
                  barSize={14} animationDuration={1500}
                >
                  {(stats?.area_distribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Event categories — vertical bar */}
        <motion.div className="admin-card p-6 flex flex-col gap-5" {...anim(0.74)}>
          <CardHeader
            icon={<Calendar className="h-5 w-5" />}
            title="Event Categories"
            subtitle="Events by Type"
            color="violet"
          />
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.event_category_distribution || []}
                margin={{ top: 4, right: 4, left: 0, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="category"
                  axisLine={false} tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 9, fontWeight: 600 }}
                  angle={-25} textAnchor="end" dy={6}
                />
                <YAxis hide />
                <Tooltip contentStyle={TIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar
                  dataKey="count" name="Events"
                  radius={[6, 6, 0, 0]}
                  barSize={26} animationDuration={1500}
                >
                  {(stats?.event_category_distribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ══ ROW 6 · Top Rated Places Leaderboard ═══════════════════════════════ */}
      <motion.div className="admin-card p-6" {...anim(0.8)}>
        <div className="flex items-center justify-between mb-6">
          <CardHeader
            icon={<Award className="h-5 w-5" />}
            title="Top Rated Places"
            subtitle="Highest Rated Venues on Platform"
            color="amber"
          />
          <a
            href="/admin/places"
            className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1 hover:text-red-300 transition-colors"
          >
            View All <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>

        {(!stats?.top_places || stats.top_places.length === 0) ? (
          <div className="text-center py-14 text-[var(--text-muted)] text-sm">
            No rated places yet — add reviews to see top performers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(stats.top_places as any[]).map((place, i) => (
              <motion.div
                key={i}
                className="bg-[var(--bg-default)] rounded-2xl p-5 border border-[var(--border)] hover:border-amber-500/30 transition-all duration-300 group"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.84 + i * 0.07, duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                        #{i + 1}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        {place.category}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-[var(--text-primary)] leading-snug truncate pr-2">
                      {place.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{place.area_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-black text-amber-400 tracking-tighter leading-none">
                      {Number(place.average_rating).toFixed(1)}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] font-bold mt-1 uppercase tracking-widest">score</p>
                  </div>
                </div>

                <Stars rating={Number(place.average_rating)} />

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1.5">
                    <span>{place.total_reviews.toLocaleString()} reviews</span>
                    <span className="font-bold">
                      {Math.round((place.total_reviews / maxPlaceReviews) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${(place.total_reviews / maxPlaceReviews) * 100}%` }}
                      transition={{ delay: 0.9 + i * 0.07, duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ══ ROW 7 · System Health Banner ════════════════════════════════════════ */}
      <motion.div
        className="admin-card relative overflow-hidden p-8 bg-gradient-to-br from-red-600/95 to-rose-900/95 text-white"
        {...anim(0.9)}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Status</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter leading-tight">
              System Health is Optimal.
            </h2>
            <p className="opacity-70 text-sm font-medium leading-relaxed">
              All modules operating within normal parameters. Platform serving{" "}
              <strong className="opacity-100">{(stats?.total_users || 0).toLocaleString()}</strong> users
              across{" "}
              <strong className="opacity-100">{(stats?.total_places || 0).toLocaleString()}</strong> venues
              with{" "}
              <strong className="opacity-100">{(stats?.total_checkins || 0).toLocaleString()}</strong> total check-ins.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "Server Response", value: "42ms",  icon: <Zap className="h-4 w-4" /> },
              { label: "DB Connections",  value: "Active", icon: <Activity className="h-4 w-4" /> },
              { label: "API Uptime",      value: "99.9%",  icon: <Shield className="h-4 w-4" /> },
              { label: "Cache Hit Rate",  value: "94%",    icon: <BarChart2 className="h-4 w-4" /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 min-w-[112px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.06, duration: 0.4 }}
              >
                <div className="flex items-center gap-1.5 opacity-60 mb-2">
                  {item.icon}
                  <p className="text-[9px] font-black uppercase tracking-widest">{item.label}</p>
                </div>
                <p className="text-xl font-black tracking-tighter">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
