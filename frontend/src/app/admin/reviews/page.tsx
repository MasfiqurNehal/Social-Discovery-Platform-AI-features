"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { 
  Search, 
  Trash2, 
  MessageSquare,
  User,
  Star,
  MapPin,
  Calendar,
  ExternalLink
} from "lucide-react";
import TablePagination from "@/components/admin/TablePagination";

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    display_name: string;
    profile_photo_url: string | null;
  };
  place?: {
    id: number;
    name: string;
  };
  event?: {
    id: number;
    title: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });

  const fetchReviews = async () => {
    setLoading(true);
    const token = Cookies.get('auth_token');
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(meta.per_page),
        search,
      });
      const res = await fetch(`http://localhost:8000/api/admin/reviews?${params.toString()}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReviews(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this review? This will also update the venue's average rating.")) return;
    const token = Cookies.get('auth_token');
    try {
      const res = await fetch(`http://localhost:8000/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input 
            type="text"
            placeholder="Search by user or content..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-default)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">User</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Venue</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Review</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4"><div className="h-12 bg-[var(--bg-default)] rounded-lg w-full" /></td></tr>
                ))
              ) : reviews.map((review) => (
                <tr key={review.id} className="hover:bg-red-500/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-[var(--border)] overflow-hidden">
                        {review.user.profile_photo_url ? (
                          <img 
                            src={review.user.profile_photo_url.startsWith('http') ? review.user.profile_photo_url : `http://localhost:8000${review.user.profile_photo_url}`} 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400"><User className="h-4 w-4" /></div>
                        )}
                      </div>
                      <span className="font-bold text-sm text-[var(--text-primary)]">{review.user.display_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-tighter flex items-center gap-1">
                        {review.place ? <MapPin className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                        {review.place ? 'Place' : 'Event'}
                      </span>
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {review.place?.name || review.event?.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      ))}
                      <span className="text-[10px] text-[var(--text-muted)] ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-2 italic">"{(review as any).body || review.comment}"</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-[var(--text-muted)]">
                      <button 
                        onClick={() => handleDelete(review.id)} 
                        className="p-2 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={meta.last_page}
          totalItems={meta.total}
          itemsPerPage={meta.per_page}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

