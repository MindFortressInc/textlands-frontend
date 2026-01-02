"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WikiContextType {
  // Spoiler gate
  spoilerAccepted: boolean;
  acceptSpoilers: () => void;

  // Auth state (simplified)
  isLoggedIn: boolean;
  playerId: string | null;

  // Discovery state for logged-in users
  discoveries: Set<string>;
  loadDiscoveries: (landKey: string, category: string) => Promise<void>;

  // Manual unlocks for logged-in users viewing undiscovered content
  unlockedEntries: Set<string>;
  unlockEntry: (entryId: string) => void;
  unlockAll: boolean;
  setUnlockAll: (value: boolean) => void;

  // Check if entry should be hidden
  isEntryHidden: (entryId: string) => boolean;
}

const WikiContext = createContext<WikiContextType | null>(null);

const SPOILER_KEY = "textlands_wiki_spoiler_accepted";
const UNLOCK_ALL_KEY = "textlands_wiki_unlock_all";

export function WikiProvider({ children }: { children: ReactNode }) {
  const [spoilerAccepted, setSpoilerAccepted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [discoveries, setDiscoveries] = useState<Set<string>>(new Set());
  const [unlockedEntries, setUnlockedEntries] = useState<Set<string>>(new Set());
  const [unlockAll, setUnlockAllState] = useState(false);

  // Load spoiler acceptance from localStorage
  useEffect(() => {
    const accepted = localStorage.getItem(SPOILER_KEY) === "true";
    setSpoilerAccepted(accepted);

    const unlockAllStored = localStorage.getItem(UNLOCK_ALL_KEY) === "true";
    setUnlockAllState(unlockAllStored);
  }, []);

  // Check auth status
  useEffect(() => {
    // Try to get session info
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/session/current`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.player_id && !data.is_guest) {
          setIsLoggedIn(true);
          setPlayerId(data.player_id);
        }
      })
      .catch(() => {
        // Not logged in
      });
  }, []);

  const acceptSpoilers = useCallback(() => {
    localStorage.setItem(SPOILER_KEY, "true");
    setSpoilerAccepted(true);
  }, []);

  const loadDiscoveries = useCallback(async (landKey: string, category: string) => {
    if (!isLoggedIn) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/lore/${landKey}/${category}/discovered`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setDiscoveries(new Set(data.discovered_ids || []));
      }
    } catch {
      // Failed to load discoveries
    }
  }, [isLoggedIn]);

  const unlockEntry = useCallback((entryId: string) => {
    setUnlockedEntries((prev) => new Set([...prev, entryId]));
  }, []);

  const setUnlockAll = useCallback((value: boolean) => {
    localStorage.setItem(UNLOCK_ALL_KEY, String(value));
    setUnlockAllState(value);
  }, []);

  const isEntryHidden = useCallback(
    (entryId: string) => {
      // If not logged in, nothing is hidden (they accepted spoilers)
      if (!isLoggedIn) return false;

      // If unlock all is on, nothing is hidden
      if (unlockAll) return false;

      // If discovered or manually unlocked, not hidden
      if (discoveries.has(entryId) || unlockedEntries.has(entryId)) return false;

      // Otherwise hidden
      return true;
    },
    [isLoggedIn, unlockAll, discoveries, unlockedEntries]
  );

  return (
    <WikiContext.Provider
      value={{
        spoilerAccepted,
        acceptSpoilers,
        isLoggedIn,
        playerId,
        discoveries,
        loadDiscoveries,
        unlockedEntries,
        unlockEntry,
        unlockAll,
        setUnlockAll,
        isEntryHidden,
      }}
    >
      {children}
    </WikiContext.Provider>
  );
}

export function useWiki() {
  const context = useContext(WikiContext);
  if (!context) {
    throw new Error("useWiki must be used within WikiProvider");
  }
  return context;
}
