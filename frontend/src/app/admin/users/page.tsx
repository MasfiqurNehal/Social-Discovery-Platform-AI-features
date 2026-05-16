"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { 
  User, 
  Search, 
  Ban, 
  CheckCircle2,
  Mail,
  Shield,
  ShieldAlert
} from "lucide-react";
import TablePagination from "@/components/admin/TablePagination";

interface AppUser {
  id: number;
  display_name: string;
  email: string;
  is_active: boolean;
  profile_photo_url: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });

  const fetchUsers = async () => {
    setLoading(true);
    const token = Cookies.get('auth_token');
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(meta.per_page),
        search,
      });
      const res = await fetch(`http://localhost:8000/api/admin/users?${params.toString()}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const toggleUserStatus = async (id: number) => {
    const token = Cookies.get('auth_token');
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${id}/toggle-status`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input 
          type="text"
          placeholder="Search users..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-default)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold uppercase text-[var(--text-muted)]">User Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[var(--text-muted)]">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[var(--text-muted)]">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-4"><div className="h-10 bg-[var(--bg-default)] rounded-lg w-full" /></td></tr>
                ))
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-red-500/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold overflow-hidden border border-[var(--border)]">
                        {user.profile_photo_url ? (
                          <img 
                            src={user.profile_photo_url.startsWith('http') ? user.profile_photo_url : `http://localhost:8000${user.profile_photo_url}`} 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          user.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="font-bold text-[var(--text-primary)]">{user.display_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Mail className="h-3.5 w-3.5" /> {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                    {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
                        <Shield className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase">
                        <ShieldAlert className="h-3.5 w-3.5" /> Banned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleUserStatus(user.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${user.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                      {user.is_active ? 'Ban User' : 'Unban User'}
                    </button>
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

