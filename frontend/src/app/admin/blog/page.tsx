"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FileText,
  Clock,
  Globe,
  Lock,
  Star
} from "lucide-react";
import Link from "next/link";
import TablePagination from "@/components/admin/TablePagination";

interface BlogPost {
  id: number;
  title: string;
  is_published: boolean;
  is_featured?: boolean;
  body?: string;
  featured_image_url?: string;
  tags?: string[];
  published_at: string;
  created_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    content: "",
    excerpt: "",
    cover_image_url: "",
    is_published: true,
    is_featured: false,
    tags: []
  });

  const [sortBy, setSortBy] = useState("id-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });

  const fetchPosts = async () => {
    setLoading(true);
    const token = Cookies.get('auth_token');
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(meta.per_page),
        search,
        sort: sortBy === "id-asc" ? "created_asc" : "created_desc",
      });
      const res = await fetch(`http://localhost:8000/api/admin/blog-posts?${params.toString()}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPosts(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, search, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('auth_token');
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id 
      ? `http://localhost:8000/api/admin/blog-posts/${formData.id}`
      : "http://localhost:8000/api/admin/blog-posts";

    setSaving(true);
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
      if (res.ok && data.status === 'success') {
        setIsModalOpen(false);
        fetchPosts();
      } else {
        const errorMsg = data.errors ? Object.values(data.errors).flat().join("\n") : (data.message || "Unknown error");
        alert("Error saving post:\n" + errorMsg);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article forever?")) return;
    const token = Cookies.get('auth_token');
    try {
      const res = await fetch(`http://localhost:8000/api/admin/blog-posts/${id}`, {
        method: 'DELETE',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFeatured = async (post: BlogPost) => {
    const token = Cookies.get('auth_token');
    const newStatus = !post.is_featured;
    
    try {
      const res = await fetch(`http://localhost:8000/api/admin/blog-posts/${post.id}`, {
        method: 'PATCH',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ is_featured: newStatus })
      });

      if (res.ok) {
        // If we set this one to featured, unfeature all others in the local state
        setPosts(posts.map(p => {
          if (p.id === post.id) return { ...p, is_featured: newStatus };
          if (newStatus) return { ...p, is_featured: false };
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (post: BlogPost | null) => {
    if (post) {
      setFormData({
        ...post,
        content: post.body || "",
        cover_image_url: post.featured_image_url || "",
        tags: post.tags || []
      });
    } else {
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        cover_image_url: "",
        is_published: true,
        tags: []
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Search posts..."
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
        <button onClick={() => handleEdit(null)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Write New Post
        </button>
      </div>

      {/* Table Section */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-default)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">ID & Article Title</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Timeline</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4"><div className="h-10 bg-[var(--bg-default)] rounded-lg w-full" /></td></tr>
                ))
              ) : posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-red-500/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                       <FileText className="h-4 w-4 text-red-500" /> {post.title}
                       {post.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">#{post.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    {post.is_published ? (
                      <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
                        <Globe className="h-3.5 w-3.5" /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase">
                        <Lock className="h-3.5 w-3.5" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-l border-[var(--border)] pl-8">
                    <div className="text-[10px] text-[var(--text-muted)] flex flex-col gap-1.5">
                       <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]"><Clock className="h-3 w-3" /> Published: {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}</span>
                       <span className="opacity-70">Created: {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleFeatured(post)}
                        className={`p-2 rounded-lg transition-all ${post.is_featured ? 'text-amber-500 bg-amber-500/10' : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10'}`}
                        title={post.is_featured ? "Featured" : "Mark as Featured"}
                      >
                        <Star className={`h-4 w-4 ${post.is_featured ? 'fill-amber-400' : ''}`} />
                      </button>
                      <button 
                        onClick={() => handleEdit(post)} 
                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Edit Post"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Post"
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

      {/* Blog Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] w-full max-w-4xl rounded-3xl p-8 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>
              {formData.id ? 'Edit Article' : 'Draft New Insight'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Post Title</label>
                <input 
                  required 
                  value={formData.title || ""} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all font-bold text-lg" 
                  placeholder="The Ultimate Guide to Dhaka Street Food..." 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Short Excerpt</label>
                <input 
                  value={formData.excerpt || ""} 
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all" 
                  placeholder="A brief catchy summary for the feed..." 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Main Content (HTML/Markdown support)</label>
                <textarea 
                  required 
                  rows={10} 
                  value={formData.content || ""} 
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all font-serif" 
                  placeholder="Write your story here..." 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Cover Image URL</label>
                <input 
                  value={formData.cover_image_url || ""} 
                  onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all" 
                  placeholder="https://images.unsplash.com/..." 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Tags (comma separated)</label>
                <input 
                  value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""} 
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(t => t !== "")})}
                  className="w-full px-4 py-3 bg-[var(--bg-default)] border border-[var(--border)] rounded-xl outline-none focus:border-red-500 transition-all font-bold" 
                  placeholder="Street Food, Dhaka, Weekend, Gaming" 
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-[var(--border)] mt-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.is_published} 
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="w-4 h-4 rounded border-[var(--border)] text-red-500 focus:ring-red-500 transition-all" 
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-red-500 transition-colors">Publish Post</span>
                </label>
              </div>

              <div className="flex gap-4 md:col-span-2 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl border border-[var(--border)] font-black uppercase tracking-widest text-xs hover:bg-[var(--bg-default)] transition-all">Discard</button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? "Saving..." : (formData.id ? 'Save Changes' : 'Publish Article')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

