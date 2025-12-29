"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import * as api from "@/lib/api";

// Default fallback strings (used while loading or if fetch fails)
const DEFAULT_STRINGS: Record<string, string> = {
  choose_your_land: "Choose Your Land",
  lands_available: "lands available",
  character_select: "Choose Your Character",
  what_do_you_do: "What do you do?",
  check_email: "Check your email for a login link",
  nsfw_blocked: "This content requires 18+ mode",
  save_prompt_text: "You've been adventuring for a while...",
  begin_adventure: "Begin Your Journey",
  new_character: "New Character",
  continue_as: "Continue as",
  enter_the_lands: "Enter the Lands",
  back: "Back",
  settings: "Settings",
  log_in: "Log In",
  log_out: "Log Out",
  loading: "Loading...",
  adults_only: "Adults Only",
  blocked_enable_settings: "Blocked (enable in Settings)",
  tap_verify_age: "Tap to verify age",
};

interface UIStringsContextType {
  strings: Record<string, string>;
  helpText: string;
  loading: boolean;
  // Helper function to get string with fallback
  t: (key: string, fallback?: string) => string;
}

const UIStringsContext = createContext<UIStringsContextType | null>(null);

export function UIStringsProvider({ children }: { children: ReactNode }) {
  const [strings, setStrings] = useState<Record<string, string>>(DEFAULT_STRINGS);
  const [helpText, setHelpText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrings() {
      try {
        const data = await api.getUIStrings();
        setStrings({ ...DEFAULT_STRINGS, ...data.strings });
        setHelpText(data.help_text);
      } catch (err) {
        console.warn("[UIStrings] Failed to fetch, using defaults:", err);
        // Keep default strings
      } finally {
        setLoading(false);
      }
    }
    fetchStrings();
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return strings[key] ?? fallback ?? key;
  }, [strings]);

  return (
    <UIStringsContext.Provider value={{ strings, helpText, loading, t }}>
      {children}
    </UIStringsContext.Provider>
  );
}

export const useUIStrings = () => {
  const ctx = useContext(UIStringsContext);
  if (!ctx) throw new Error("useUIStrings must be used within UIStringsProvider");
  return ctx;
};
