"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type EffectType = "damage" | "heal" | "gold" | "loot" | "location";

export interface FloatingEffect {
  id: string;
  type: EffectType;
  value: number | string;
  timestamp: number;
  // Optional metadata
  quantity?: number;
  isCritical?: boolean;
}

interface FloatingEffectsContextType {
  effects: FloatingEffect[];
  addEffect: (effect: Omit<FloatingEffect, "id" | "timestamp">) => void;
  removeEffect: (id: string) => void;
}

const FloatingEffectsContext = createContext<FloatingEffectsContextType | null>(null);

let effectCounter = 0;

export function FloatingEffectsProvider({ children }: { children: ReactNode }) {
  const [effects, setEffects] = useState<FloatingEffect[]>([]);

  const addEffect = useCallback((effect: Omit<FloatingEffect, "id" | "timestamp">) => {
    const id = `effect-${++effectCounter}-${Date.now()}`;
    const newEffect: FloatingEffect = {
      ...effect,
      id,
      timestamp: Date.now(),
    };
    setEffects((prev) => [...prev, newEffect]);
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <FloatingEffectsContext.Provider value={{ effects, addEffect, removeEffect }}>
      {children}
    </FloatingEffectsContext.Provider>
  );
}

export function useFloatingEffects() {
  const context = useContext(FloatingEffectsContext);
  if (!context) {
    throw new Error("useFloatingEffects must be used within FloatingEffectsProvider");
  }
  return context;
}
