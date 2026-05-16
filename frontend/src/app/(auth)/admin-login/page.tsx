"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.data.token, data.data.user, "admin");
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Invalid administrator credentials");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-2xl surface-elevated border border-red-500/20 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.1)]">
        {/* Glow effect for Admin (Red/Rose instead of Purple) */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-rose-400"></div>

        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Staff Portal</h1>
          <p className="text-[var(--text-muted)] font-medium text-sm">Secure access for platform administrators.</p>
        </div>

        {error && <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold p-3 rounded-xl">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-primary)]">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/40 surface border border-[var(--border)] focus:border-red-500/50"
              placeholder="admin@vibespot.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-primary)]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/40 surface border border-[var(--border)] focus:border-red-500/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authenticate"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[var(--text-muted)]">
          <Link href="/login" className="flex items-center justify-center gap-1 hover:text-brand-400 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

