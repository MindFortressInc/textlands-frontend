"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { CombatSession, ActiveScene } from "@/types/game";

interface NegotiatingState {
  npc_id: string;
  scene_id: string;
  npc_name: string;
}

interface CombatContextType {
  // Combat state
  activeCombat: CombatSession | null;
  setActiveCombat: (combat: CombatSession | null) => void;
  combatNarrative: string;
  setCombatNarrative: (narrative: string) => void;

  // Scene/Intimacy state
  activeScene: ActiveScene | null;
  setActiveScene: (scene: ActiveScene | null) => void;
  negotiating: NegotiatingState | null;
  setNegotiating: (state: NegotiatingState | null) => void;

  // Helper to check if in combat or scene
  isInCombat: boolean;
  isInScene: boolean;
}

const CombatContext = createContext<CombatContextType | null>(null);

export function CombatProvider({ children }: { children: ReactNode }) {
  // Combat state
  const [activeCombat, setActiveCombat] = useState<CombatSession | null>(null);
  const [combatNarrative, setCombatNarrative] = useState<string>("");

  // Scene/Intimacy state
  const [activeScene, setActiveScene] = useState<ActiveScene | null>(null);
  const [negotiating, setNegotiating] = useState<NegotiatingState | null>(null);

  const value: CombatContextType = {
    activeCombat,
    setActiveCombat,
    combatNarrative,
    setCombatNarrative,
    activeScene,
    setActiveScene,
    negotiating,
    setNegotiating,
    isInCombat: activeCombat !== null && activeCombat.state === "active",
    isInScene: activeScene !== null,
  };

  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>;
}

export function useCombat() {
  const context = useContext(CombatContext);
  if (!context) {
    throw new Error("useCombat must be used within a CombatProvider");
  }
  return context;
}
