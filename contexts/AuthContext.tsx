"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.textlands.com";

interface User {
  logged_in: boolean;
  email?: string;
  user_id?: string;
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  requestMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });
      const data = await res.json();
      setUser(data);
    } catch {
      setUser({ logged_in: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser({ logged_in: false });
  }, []);

  const requestMagicLink = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh, requestMagicLink }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
