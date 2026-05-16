"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";

interface User {
  id: number;
  display_name: string;
  email: string;
  profile_photo_url?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  role: "user" | "admin" | null;
  isLoading: boolean;
  wishlistIds: { places: number[], events: number[] };
  login: (token: string, userData: User, userRole: "user" | "admin") => void;
  logout: () => void;
  toggleWishlistState: (id: number, type: 'place' | 'event', status: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  wishlistIds: { places: [], events: [] },
  login: () => {},
  logout: () => {},
  toggleWishlistState: () => {},
});

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    if (typeof window !== "undefined" && envUrl.includes("localhost") && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      return envUrl.replace("localhost", window.location.hostname).replace("127.0.0.1", window.location.hostname);
    }
    return envUrl;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }

  return "http://127.0.0.1:8000/api";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<{ places: number[], events: number[] }>({ places: [], events: [] });

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get("auth_token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      const apiBase = getApiBase();

      try {
        const [userRes, wishlistRes] = await Promise.all([
          fetch(`${apiBase}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch(`${apiBase}/wishlist/ids`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }).catch(() => null)
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.data.user);
          setRole(data.data.role);

          if (wishlistRes && wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            setWishlistIds(wishlistData.data);
          }
        } else if (userRes.status === 401 || userRes.status === 403) {
          Cookies.remove("auth_token");
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to fetch user session", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = useCallback((token: string, userData: User, userRole: "user" | "admin") => {
    Cookies.set("auth_token", token, { expires: 7 });
    setUser(userData);
    setRole(userRole);
  }, []);

  const logout = useCallback(() => {
    const token = Cookies.get("auth_token");
    Cookies.remove("auth_token");
    setUser(null);
    setRole(null);
    setWishlistIds({ places: [], events: [] });

    if (token) {
      fetch(`${getApiBase()}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }).catch(() => {});
    }
  }, []);

  const toggleWishlistState = useCallback((id: number, type: 'place' | 'event', status: boolean) => {
    setWishlistIds(prev => {
      const key = type === 'place' ? 'places' : 'events';
      const newList = status
        ? [...new Set([...prev[key], id])]
        : prev[key].filter(i => i !== id);
      return { ...prev, [key]: newList };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, wishlistIds, login, logout, toggleWishlistState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

