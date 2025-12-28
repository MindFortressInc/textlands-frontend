"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { themes, defaultTheme, applyTheme, type Theme } from "./index";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Sync theme preference to backend (for email theming, etc.)
async function syncThemeToBackend(themeId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/preferences`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeId }),
    });
  } catch {
    // Silently fail - user might not be logged in
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(defaultTheme);
  const theme = themes[themeId] || themes[defaultTheme];

  useEffect(() => {
    // Load saved theme from localStorage
    const saved = localStorage.getItem("textlands-theme");
    if (saved && themes[saved]) {
      setThemeId(saved);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("textlands-theme", themeId);
  }, [theme, themeId]);

  const setTheme = (id: string) => {
    if (themes[id]) {
      setThemeId(id);
      // Sync to backend for email theming
      syncThemeToBackend(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
