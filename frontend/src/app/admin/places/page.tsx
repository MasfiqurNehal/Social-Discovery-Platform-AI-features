"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import Link from "next/link";
import TablePagination from "@/components/admin/TablePagination";
import { DHAKA_THANAS } from "@/constants/areas";

interface Place {
  id: number;
  name: string;
  category: string;
  area_name: string;
  average_rating: number;
  total_reviews: number;
  is_published: boolean;
  created_at: string;
}

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    category: "Food & Drinks",
    area_name: DHAKA_THANAS[0],
    address: "",
    description: "",
    cover_image_url: "",
    budget_tier: "৳৳",
    budget_label: "Medium",
    budget_range: "500-2000",
    is_published: true
  });

  const [sortBy, setSortBy] = useState("id-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });

  const fetchPlaces = async () => {
    setLoading(true);
    const token = Cookies.get('auth_token');
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(meta.per_page),
        search,
        sort: sortBy === "id-asc" ? "created_asc" : "created_desc",
      });
      const res = await fetch(`http://localhost:8000/api/admin/places?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPlaces(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [currentPage, search, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('auth_token');
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id
      ? `http://localhost:8000/api/admin/places/${formData.id}`
      : "http://localhost:8000/api/admin/places";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsModalOpen(false);
        fetchPlaces();
      } else {
        alert("Error saving place: " + JSON.stringify(data.errors));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this place?")) return;
    const token = Cookies.get('auth_token');
    try {
      const res = await fetch(`http://localhost:8000/api/admin/places/${id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (res.ok) {
        setPlaces(places.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openForm = (place: any = null) => {
    if (place) {
      // Ensure tags and operating_hours are arrays if they came back as strings
      const sanitizedPlace = { ...place };
      if (typeof sanitizedPlace.tags === 'string') {
        try { sanitizedPlace.tags = JSON.parse(sanitizedPlace.tags); } catch (e) { sanitizedPlace.tags = []; }
      }
      if (typeof sanitizedPlace.operating_hours === 'string') {
        try { sanitizedPlace.operating_hours = JSON.parse(sanitizedPlace.operating_hours); } catch (e) { sanitizedPlace.operating_hours = {}; }
      }

      setFormData({
        ...sanitizedPlace,
        is_published: !!sanitizedPlace.is_published
      });
    } else {
      setFormData({
        name: "",
        category: "Food & Drinks",
        area_name: DHAKA_THANAS[0],
        address: "",
        description: "",
        budget_tier: "৳৳",
        budget_range: "",
        cover_image_url: "",
        is_published: false,
        tags: [],
        operating_hours: {}
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search places..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm outline-none font-bold"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="id-desc">Newest First (ID)</option>
            <option value="id-asc">Oldest First (ID)</option>
          </select>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" /> Add New Place
        </button>
      </div>

      {/* Table Section */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-default)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">ID & Place</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Category</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Location</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Created At</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-8 bg-[var(--bg-default)] rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : places.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">No places found matching your search.</td>
                </tr>
              ) : (
                places.map((place: any) => (
                  <tr key={place.id} className="hover:bg-red-500/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--text-primary)]">{place.name}</div>
                      <div className="text-xs text-[var(--text-muted)] font-mono">#{place.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-red-500/10 text-red-500">
                        {place.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{place.area_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-[var(--text-muted)]">
                        {new Date(place.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {place.is_published ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
                          <CheckCircle className="h-3.5 w-3.5" /> Published
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Draft
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/places/${place.id}`}
                          target="_blank"
                          className="p-2 h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openForm(place)}
                          className="p-2 h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(place.id)}
                          className="p-2 h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

      {/* Place Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] w-full max-w-3xl rounded-3xl p-8 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>
              {formData.id ? 'Edit Place' : 'Discover New Spot'}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Place Name</label>
                <input
                  required
                  value={formData.name ?? ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                  placeholder="e.g. Star Kabab"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Category</label>
                <select
                  value={formData.category ?? "Food & Drinks"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                >
                  <option>Food & Drinks</option>
                  <option>Entertainment</option>
                  <option>Culture</option>
                  <option>Landmarks & Heritage</option>
                  <option>Outdoors</option>
                  <option>Cinema & Screenings</option>
                  <option>Shopping</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Area Name (Thana)</label>
                <select
                  required
                  value={formData.area_name ?? DHAKA_THANAS[0]}
                  onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all font-bold"
                >
                  {DHAKA_THANAS.map(thana => (
                    <option key={thana} value={thana}>{thana}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Address</label>
                <input
                  required
                  value={formData.address ?? ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                  placeholder="Full physical address..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                  placeholder="Tell the story of this place..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Budget Tier</label>
                <select
                  value={formData.budget_tier ?? "৳৳"}
                  onChange={(e) => setFormData({ ...formData, budget_tier: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                >
                  <option>৳</option>
                  <option>৳৳</option>
                  <option>৳৳৳</option>
                  <option>৳৳৳৳</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Budget BDT Range</label>
                <input
                  value={formData.budget_range ?? ""}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                  placeholder="e.g. 500-2000"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Cover Image URL</label>
                <input
                  value={formData.cover_image_url ?? ""}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <label htmlFor="is_published" className="text-sm font-bold">Publish immeditely</label>
              </div>

              <div className="flex gap-4 md:col-span-2 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl border border-[var(--border)] font-black uppercase tracking-widest text-xs hover:bg-[var(--bg-default)] transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">Save {formData.id ? 'Changes' : 'Place'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

