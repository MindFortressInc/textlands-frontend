"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Character, GameLogEntry, ReasoningInfo } from "@/types/game";
import type { LocationFootprint } from "@/lib/api";

// Log entry types - matches GameLogEntry["type"]
type LogType = GameLogEntry["type"];

interface GameContextType {
  // Character state
  character: Character | null;
  setCharacter: (char: Character | null) => void;

  // Game log
  entries: GameLogEntry[];
  setEntries: React.Dispatch<React.SetStateAction<GameLogEntry[]>>;
  addLog: (type: LogType, content: string, actor?: string, reasoning?: ReasoningInfo) => void;
  clearLog: () => void;

  // Location
  zoneName: string;
  setZoneName: (name: string) => void;

  // Processing state
  processing: boolean;
  setProcessing: (p: boolean) => void;

  // Suggested actions
  suggestions: string[];
  setSuggestions: (s: string[]) => void;

  // Location footprints
  footprints: LocationFootprint[];
  setFootprints: (f: LocationFootprint[]) => void;
  loadingFootprints: boolean;
  setLoadingFootprints: (l: boolean) => void;
  currentLocationEntityId: string | null;
  setCurrentLocationEntityId: (id: string | null) => void;
}

const GameContext = createContext<GameContextType | null>(null);

let logIdCounter = 0;

export function GameProvider({ children }: { children: ReactNode }) {
  // Character state
  const [character, setCharacter] = useState<Character | null>(null);

  // Game log
  const [entries, setEntries] = useState<GameLogEntry[]>([]);

  // Location
  const [zoneName, setZoneName] = useState("...");

  // Processing state
  const [processing, setProcessing] = useState(false);

  // Suggested actions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Location footprints
  const [footprints, setFootprints] = useState<LocationFootprint[]>([]);
  const [loadingFootprints, setLoadingFootprints] = useState(false);
  const [currentLocationEntityId, setCurrentLocationEntityId] = useState<string | null>(null);

  // Add log entry helper
  const addLog = useCallback((
    type: LogType,
    content: string,
    actor?: string,
    reasoning?: ReasoningInfo
  ) => {
    const entry: GameLogEntry = {
      id: `log-${++logIdCounter}`,
      type,
      content,
      timestamp: new Date(),
      actor,
      reasoning,
    };
    setEntries((prev) => [...prev, entry]);
  }, []);

  // Clear log
  const clearLog = useCallback(() => {
    setEntries([]);
  }, []);

  const value: GameContextType = {
    character,
    setCharacter,
    entries,
    setEntries,
    addLog,
    clearLog,
    zoneName,
    setZoneName,
    processing,
    setProcessing,
    suggestions,
    setSuggestions,
    footprints,
    setFootprints,
    loadingFootprints,
    setLoadingFootprints,
    currentLocationEntityId,
    setCurrentLocationEntityId,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
