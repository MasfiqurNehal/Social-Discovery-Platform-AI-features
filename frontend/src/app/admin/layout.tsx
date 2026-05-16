"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  FileText,
  ShieldCheck,
  MessageSquare
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.push('/admin-login');
    }
  }, [role, isLoading, router]);

  if (isLoading || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-brand-500 rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/admin-login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Places', href: '/admin/places', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Events', href: '/admin/events', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Blog Posts', href: '/admin/blog', icon: <FileText className="w-5 h-5" /> },
    { name: 'Reviews', href: '/admin/reviews', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <div className="admin-theme flex h-[calc(100vh-72px)] overflow-hidden bg-[var(--bg-default)]">
      {/* Sidebar - Compact */}
      <aside className="w-20 lg:w-44 flex-shrink-0 border-r border-[var(--border)] surface-elevated h-full flex flex-col transition-all duration-300 group">
        <div className="h-16 flex items-center px-6 border-b border-[var(--border)] justify-center lg:justify-start">
          <Link href="/" className="flex items-center gap-2 group/logo">
            <ShieldCheck className="h-6 w-6 text-red-500 group-hover/logo:scale-110 transition-transform" />
            <span className="font-black tracking-tighter text-[var(--text-primary)] hidden lg:block uppercase text-xs">Vibe Panel</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/5 group/nav"
            >
              <span className="flex-shrink-0 transition-transform group-hover/nav:scale-110">{item.icon}</span>
              <span className="hidden lg:block truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none bg-[var(--bg-page)]">
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

