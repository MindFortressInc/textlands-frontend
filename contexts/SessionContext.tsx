"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { InfiniteWorld, InfiniteCampfireResponse } from "@/types/game";
import type { LandGroup, PlayerInfluence, RosterCharacter } from "@/lib/api";

// App phases
export type AppPhase = "loading" | "landing" | "character-select" | "genres" | "worlds" | "campfire" | "infinite-campfire" | "game";

interface SessionContextType {
  // Phase state machine
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;

  // Infinite Worlds navigation
  landGroups: LandGroup[];
  setLandGroups: (groups: LandGroup[]) => void;
  selectedWorld: InfiniteWorld | null;
  setSelectedWorld: (world: InfiniteWorld | null) => void;
  infiniteCampfire: InfiniteCampfireResponse | null;
  setInfiniteCampfire: (campfire: InfiniteCampfireResponse | null) => void;

  // Player identity
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
  isGuest: boolean;
  setIsGuest: (guest: boolean) => void;

  // Character roster
  roster: RosterCharacter[];
  setRoster: (roster: RosterCharacter[]) => void;
  loadingRoster: boolean;
  setLoadingRoster: (loading: boolean) => void;

  // Influence
  influence: PlayerInfluence | null;
  setInfluence: (influence: PlayerInfluence | null) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Phase state machine
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Infinite Worlds navigation
  const [landGroups, setLandGroups] = useState<LandGroup[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<InfiniteWorld | null>(null);
  const [infiniteCampfire, setInfiniteCampfire] = useState<InfiniteCampfireResponse | null>(null);

  // Player identity
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  // Character roster
  const [roster, setRoster] = useState<RosterCharacter[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Influence
  const [influence, setInfluence] = useState<PlayerInfluence | null>(null);

  const value: SessionContextType = {
    phase,
    setPhase,
    connectionError,
    setConnectionError,
    landGroups,
    setLandGroups,
    selectedWorld,
    setSelectedWorld,
    infiniteCampfire,
    setInfiniteCampfire,
    playerId,
    setPlayerId,
    isGuest,
    setIsGuest,
    roster,
    setRoster,
    loadingRoster,
    setLoadingRoster,
    influence,
    setInfluence,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
