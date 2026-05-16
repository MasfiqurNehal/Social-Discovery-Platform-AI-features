"use client";
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Edit3,
  Globe,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Star,
  User
} from "lucide-react";
import Link from "next/link";
import { DHAKA_THANAS } from "@/constants/areas";
import { AnimatePresence, motion } from "framer-motion";

type ActivityTab = "reviews" | "wishlist" | "checkins";

function ProfileContent() {
  const { user, role, isLoading, login } = useAuth();
  const isAdmin = role === "admin";
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ActivityTab) || "reviews";

  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [stats, setStats] = useState({ reviews: 0, wishlist: 0, checkins: 0 });
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "", location: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && !isEditing) {
      setEditForm({
        display_name: user.display_name || "",
        bio: user.bio || "",
        location: user.location || "",
      });
      setPreviewUrl(
        user.profile_photo_url
          ? (user.profile_photo_url.startsWith("http")
            ? user.profile_photo_url
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}${user.profile_photo_url}`)
          : null
      );
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (user) {
      fetchActivity(activeTab, 1);
    }
  }, [user, activeTab]);

  const fetchActivity = async (tab: ActivityTab, page: number) => {
    setLoadingActivity(true);
    try {
      const token = Cookies.get("auth_token");
      const params = new URLSearchParams({
        tab,
        page: String(page),
        per_page: "10",
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/activity?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        setItems(json.data.items || []);
        setMeta(json.data.meta || { current_page: page, last_page: 1, total: 0 });
        setStats({
          reviews: json.data.stats.review_count,
          wishlist: json.data.stats.wishlist_count,
          checkins: json.data.stats.check_in_count,
        });
      }
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");

    try {
      const token = Cookies.get("auth_token");
      const formData = new FormData();
      formData.append("display_name", editForm.display_name);
      formData.append("bio", editForm.bio);
      formData.append("location", editForm.location);
      if (selectedFile) {
        formData.append("profile_photo", selectedFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update profile.");
        return;
      }

      setIsEditing(false);
      if (token && role) {
        login(token, data.data, role);
      }
      setSelectedFile(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen pt-20 pb-20">
      <section className="relative h-64 sm:h-80 w-full overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${isAdmin ? "from-red-600/40 via-red-500/20 to-transparent" : "from-brand-600/40 via-brand-500/20 to-transparent"}`} />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative flex items-end pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
            <div className="relative group">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-[var(--bg-page)] bg-[var(--bg-elevated)] shadow-2xl relative z-10">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                    {user.display_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`absolute bottom-2 right-2 z-20 ${isAdmin ? "bg-red-500 hover:bg-red-400" : "bg-brand-500 hover:bg-brand-400"} text-white p-2.5 rounded-2xl shadow-lg transition-all scale-90 hover:scale-100`}
                >
                  <Camera className="h-5 w-5" />
                </button>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="flex-1 text-center sm:text-left mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{user.display_name}</h1>
                <div className={`inline-flex px-3 py-1 rounded-xl ${isAdmin ? "bg-red-500/10 text-red-500" : "bg-brand-500/10 text-brand-500"} text-[10px] font-black uppercase tracking-widest w-fit mx-auto sm:mx-0`}>
                  {role === "admin" ? "Administrator" : "Community Member"}
                </div>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 opacity-70" /> {user.email}</span>
                {user.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 opacity-70" /> {user.location}</span>}
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 opacity-70" /> Joined {formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="flex gap-3 mb-2">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] font-bold text-sm hover:bg-[var(--bg-default)] transition-all flex items-center justify-center gap-2 shadow-sm" style={{ color: "var(--text-primary)" }}>
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 rounded-2xl text-sm font-bold bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-default)] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving} className={`px-6 py-2.5 rounded-2xl ${showSuccess ? "bg-green-500 shadow-green-500/25" : (isAdmin ? "bg-red-500 shadow-red-500/25 hover:bg-red-400" : "bg-brand-500 shadow-brand-500/25 hover:bg-brand-400")} text-white text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-lg`}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {showSuccess ? "Saved!" : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-4 space-y-8">
            <div className="surface-elevated rounded-3xl p-6 border border-[var(--border)] shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Edit3 className="h-4 w-4 text-brand-500" /> About
              </h3>

              {isEditing ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Display Name</label>
                    <input value={editForm.display_name} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} className="w-full bg-[var(--bg-default)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Location</label>
                    <select value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-full bg-[var(--bg-default)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none font-bold transition-all">
                      <option value="">Select your area</option>
                      {DHAKA_THANAS.map((area) => <option key={area} value={area}>{area}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Short Bio</label>
                    <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={4} className="w-full bg-[var(--bg-default)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/50 outline-none resize-none transition-all" />
                  </div>
                  {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}
                </div>
              ) : (
                <div className="space-y-6">
                  {user.bio ? <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{user.bio}</p> : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No bio provided yet.</p>}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
                    <Stat label="Reviews" value={stats.reviews} />
                    <Stat label="Wishlist" value={stats.wishlist} />
                    <Stat label="Check-ins" value={stats.checkins} />
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="surface-elevated rounded-3xl p-6 border border-[var(--border)] shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-500/20 transition-all duration-500" />
                <h3 className="text-sm font-black text-[var(--text-primary)] mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Management</h3>
                <Link href="/admin/dashboard" className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-500/20">
                  <div className="flex flex-col"><span className="text-xs font-black uppercase tracking-tighter leading-none mb-1">Vibe Panel</span><span className="text-[9px] opacity-80 font-black uppercase tracking-widest">Admin Dashboard</span></div>
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </Link>
              </div>
            )}
          </aside>

          <main className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-8 bg-[var(--bg-elevated)] p-1.5 rounded-2xl border border-[var(--border)] w-fit">
              {[
                { id: "reviews", label: "Reviews", icon: Star },
                { id: "wishlist", label: "Wishlist", icon: Heart },
                { id: "checkins", label: "History", icon: CalendarDays },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as ActivityTab)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)]"}`}>
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "fill-current" : ""}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  {loadingActivity ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-500/50" />
                      <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Loading Activity...</p>
                    </div>
                  ) : (
                    <>
                      {activeTab === "reviews" && <ReviewTab items={items} formatDate={formatDate} />}
                      {activeTab === "wishlist" && <WishlistTab items={items} formatDate={formatDate} />}
                      {activeTab === "checkins" && <CheckInTab items={items} formatDate={formatDate} />}

                      {meta.last_page > 1 && (
                        <div className="flex items-center justify-between gap-4 pt-4">
                          <button onClick={() => fetchActivity(activeTab, meta.current_page - 1)} disabled={meta.current_page <= 1} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold disabled:opacity-50">
                            Previous
                          </button>
                          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            Page {meta.current_page} of {meta.last_page}
                          </p>
                          <button onClick={() => fetchActivity(activeTab, meta.current_page + 1)} disabled={meta.current_page >= meta.last_page} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold disabled:opacity-50">
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{value}</div>
      <div className="text-[9px] font-black uppercase tracking-tighter" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function ReviewTab({ items, formatDate }: { items: any[]; formatDate: (value: string) => string }) {
  if (items.length === 0) {
    return <div className="py-20 text-center space-y-4"><div className="text-4xl">âœï¸</div><p className="text-[var(--text-muted)] font-bold">You haven't shared any experiences yet.</p></div>;
  }

  return (
    <>
      {items.map((review) => (
        <div key={review.id} className="group p-6 surface-elevated border border-[var(--border)] rounded-3xl flex flex-col gap-4 hover:border-brand-500/30 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Link href={review.place ? `/places/${review.place?.id}` : `/events/${review.event?.id}`} className="font-black text-xl hover:text-brand-500 transition-colors">
                {review.place?.name || review.event?.title}
              </Link>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                <MapPin className="h-3 w-3" /> {review.place?.area_name || review.event?.area_name}
              </div>
            </div>
            <div className="flex bg-amber-400/10 px-3 py-1.5 rounded-xl items-center gap-1.5 border border-amber-400/20">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-black text-amber-600">{review.rating}.0</span>
            </div>
          </div>
          <p className="text-base text-[var(--text-primary)] opacity-90 leading-relaxed font-medium">"{review.body}"</p>
          <div className="flex items-center justify-between mt-2 pt-4 border-t border-[var(--border)]">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />{formatDate(review.created_at)}
            </div>
            <Link href={review.place ? `/places/${review.place?.id}` : `/events/${review.event?.id}`} className="text-xs font-black text-brand-500 uppercase tracking-widest hover:underline">
              View Venue
            </Link>
          </div>
        </div>
      ))}
    </>
  );
}

function WishlistTab({ items, formatDate }: { items: any[]; formatDate: (value: string) => string }) {
  if (items.length === 0) {
    return <div className="py-20 text-center space-y-4"><div className="text-4xl">ðŸ”–</div><p className="text-[var(--text-muted)] font-bold">Your wishlist is waiting for some vibes.</p></div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => {
        const entity = item.place || item.event;
        if (!entity) return null;

        return (
          <Link key={item.id} href={item.place ? `/places/${entity.id}` : `/events/${entity.id}`}>
            <div className="group p-3 surface-elevated border border-[var(--border)] rounded-3xl flex gap-4 hover:border-brand-500/30 transition-all shadow-sm h-full">
              <div className="w-24 h-24 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-md">
                <img src={entity.cover_image_url || "/placeholder.jpg"} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex flex-col justify-center py-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-500 mb-1">{entity.category}</span>
                <h3 className="font-black text-lg leading-tight mb-2 group-hover:text-brand-500 transition-colors line-clamp-1">{item.place ? entity.name : entity.title}</h3>
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]"><MapPin className="h-3 w-3" /> {entity.area_name}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500"><Heart className="h-3 w-3 fill-current" /> {formatDate(item.added_at)}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CheckInTab({ items, formatDate }: { items: any[]; formatDate: (value: string) => string }) {
  if (items.length === 0) {
    return <div className="py-20 text-center space-y-4"><div className="text-4xl">ðŸ“</div><p className="text-[var(--text-muted)] font-bold">No venue visitation history found yet.</p></div>;
  }

  return (
    <>
      {items.map((ci) => {
        const entity = ci.place || ci.event;
        if (!entity) return null;

        return (
          <div key={ci.id} className="p-4 surface-elevated border border-[var(--border)] rounded-2xl flex items-center justify-between hover:border-brand-500/30 transition-all group">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-default)] border border-[var(--border)] flex items-center justify-center text-brand-500 shadow-inner group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                {ci.place ? <MapPin className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-black text-[var(--text-primary)]">{ci.place ? entity.name : entity.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Visited</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(ci.checked_in_at)}</span>
                </div>
              </div>
            </div>
            <Link href={ci.place ? `/places/${entity.id}` : `/events/${entity.id}`} className="px-5 py-2.5 bg-[var(--bg-default)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all border border-[var(--border)] shadow-sm">
              Revisit
            </Link>
          </div>
        );
      })}
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-brand-500" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
