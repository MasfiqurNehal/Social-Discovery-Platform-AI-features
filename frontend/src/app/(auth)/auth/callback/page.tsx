"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    async function processOAuth() {
      if (hasProcessed.current) return;
      hasProcessed.current = true;
      if (!token) {
        console.error("No token found in callback URL");
        router.push("/login?error=missing_token");
        return;
      }

      try {
        // Temporarily set the cookie so the fetch call naturally works, or just pass it in header
        Cookies.set("auth_token", token, { expires: 7 });

        // Fetch user data via token
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });

        if (res.ok) {
          const data = await res.json();
          // Call context login to sync states
          login(token, data.data.user, data.data.role || "user");
          
          // Successful login, go home
          router.push("/");
        } else {
          throw new Error("Failed to authenticate token");
        }
      } catch (err) {
        console.error("OAuth flow failed", err);
        Cookies.remove("auth_token");
        router.push("/login?error=oauth_processing_failed");
      }
    }

    processOAuth();
  }, [token, login, router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Authenticating...
        </h2>
        <p className="text-[var(--text-muted)] text-sm">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}
