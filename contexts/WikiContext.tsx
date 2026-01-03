"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WikiContextType {
  // Spoiler gate
  spoilerAccepted: boolean;
  acceptSpoilers: () => void;

  // Auth state
  isLoggedIn: boolean;
  playerId: string | null;
  displayName: string | null;
  logout: () => void;

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

  // Path helper - returns correct path for wiki subdomain vs main domain
  wikiPath: (path: string) => string;
}

const WikiContext = createContext<WikiContextType | null>(null);

const SPOILER_KEY = "textlands_wiki_spoiler_accepted";
const UNLOCK_ALL_KEY = "textlands_wiki_unlock_all";

export function WikiProvider({ children }: { children: ReactNode }) {
  const [spoilerAccepted, setSpoilerAccepted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [discoveries, setDiscoveries] = useState<Set<string>>(new Set());
  const [unlockedEntries, setUnlockedEntries] = useState<Set<string>>(new Set());
  const [unlockAll, setUnlockAllState] = useState(false);
  const [isWikiSubdomain, setIsWikiSubdomain] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if we're on the wiki subdomain
  useEffect(() => {
    const host = window.location.hostname;
    setIsWikiSubdomain(host.startsWith("wiki.") || host === "wiki.localhost");
    setMounted(true);
  }, []);

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
          setDisplayName(data.display_name || null);
        }
      })
      .catch(() => {
        // Not logged in
      });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/session/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors
    }
    setIsLoggedIn(false);
    setPlayerId(null);
    setDisplayName(null);
    setDiscoveries(new Set());
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

  // Path helper: on wiki subdomain, /wiki/foo -> /foo
  // Detects subdomain by checking if current URL path lacks /wiki prefix
  const wikiPath = useCallback(
    (path: string) => {
      // During SSR or before mount, check if we should strip based on hostname
      const onSubdomain = typeof window !== "undefined" &&
        (window.location.hostname.startsWith("wiki.") ||
         window.location.hostname === "wiki.localhost" ||
         // Also detect by pathname: if we're at /fantasy (not /wiki/fantasy), we're on subdomain
         (!window.location.pathname.startsWith("/wiki") && window.location.pathname !== "/"));

      if (onSubdomain && path.startsWith("/wiki")) {
        return path.slice(5) || "/"; // Remove "/wiki" prefix
      }
      return path;
    },
    [] // No deps needed since we check window directly
  );

  return (
    <WikiContext.Provider
      value={{
        spoilerAccepted,
        acceptSpoilers,
        isLoggedIn,
        playerId,
        displayName,
        logout,
        discoveries,
        loadDiscoveries,
        unlockedEntries,
        unlockEntry,
        unlockAll,
        setUnlockAll,
        isEntryHidden,
        wikiPath,
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
