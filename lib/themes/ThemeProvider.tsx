"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { themes, defaultTheme, applyTheme, type Theme } from "./index";

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

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
