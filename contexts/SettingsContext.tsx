"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { safeStorage } from "@/lib/errors";

interface SettingsContextType {
  // NSFW / Age gate state
  nsfwEnabled: boolean;
  setNsfwEnabled: (enabled: boolean) => void;
  nsfwVerified: boolean;
  setNsfwVerified: (verified: boolean) => void;
  nsfwRejections: number;
  setNsfwRejections: (count: number) => void;
  nsfwAutoBlocked: boolean;
  setNsfwAutoBlocked: (blocked: boolean) => void;

  // Age gate modal
  showAgeGate: boolean;
  setShowAgeGate: (show: boolean) => void;
  ageGateCallback: (() => void) | null;
  setAgeGateCallback: (callback: (() => void) | null) => void;
  pendingNsfwCommand: string | null;
  setPendingNsfwCommand: (command: string | null) => void;

  // Request age verification helper
  requestAgeVerification: (callback?: () => void) => void;

  // Mechanics display
  showReasoning: boolean;
  setShowReasoning: (show: boolean) => void;

  // Save preferences to localStorage
  saveNsfwPreferences: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const NSFW_STORAGE_KEY = "textlands_nsfw";

export function SettingsProvider({ children }: { children: ReactNode }) {
  // NSFW / Age gate state
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [nsfwVerified, setNsfwVerified] = useState(false);
  const [nsfwRejections, setNsfwRejections] = useState(0);
  const [nsfwAutoBlocked, setNsfwAutoBlocked] = useState(false);

  // Age gate modal
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageGateCallback, setAgeGateCallback] = useState<(() => void) | null>(null);
  const [pendingNsfwCommand, setPendingNsfwCommand] = useState<string | null>(null);

  // Mechanics display
  const [showReasoning, setShowReasoning] = useState(false);

  // Load NSFW preferences from localStorage on mount
  useEffect(() => {
    const stored = safeStorage.getJSON<{
      enabled?: boolean;
      verified?: boolean;
      rejections?: number;
      autoBlocked?: boolean;
    }>(NSFW_STORAGE_KEY, {});
    if (stored.enabled !== undefined) {
      setNsfwEnabled(!!stored.enabled);
      setNsfwVerified(!!stored.verified);
      setNsfwRejections(stored.rejections || 0);
      setNsfwAutoBlocked(!!stored.autoBlocked);
    }
  }, []);

  // Save NSFW preferences to localStorage
  const saveNsfwPreferences = useCallback(() => {
    safeStorage.setJSON(NSFW_STORAGE_KEY, {
      enabled: nsfwEnabled,
      verified: nsfwVerified,
      rejections: nsfwRejections,
      autoBlocked: nsfwAutoBlocked,
    });
  }, [nsfwEnabled, nsfwVerified, nsfwRejections, nsfwAutoBlocked]);

  // Request age verification helper
  const requestAgeVerification = useCallback((callback?: () => void) => {
    if (nsfwAutoBlocked) {
      // User has rejected 3 times - only settings can re-enable
      return;
    }
    setAgeGateCallback(() => callback || null);
    setShowAgeGate(true);
  }, [nsfwAutoBlocked]);

  const value: SettingsContextType = {
    nsfwEnabled,
    setNsfwEnabled,
    nsfwVerified,
    setNsfwVerified,
    nsfwRejections,
    setNsfwRejections,
    nsfwAutoBlocked,
    setNsfwAutoBlocked,
    showAgeGate,
    setShowAgeGate,
    ageGateCallback,
    setAgeGateCallback,
    pendingNsfwCommand,
    setPendingNsfwCommand,
    requestAgeVerification,
    showReasoning,
    setShowReasoning,
    saveNsfwPreferences,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
