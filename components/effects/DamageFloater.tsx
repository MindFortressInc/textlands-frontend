"use client";

import { useEffect, useState } from "react";
import type { FloatingEffect } from "@/contexts/FloatingEffectsContext";

interface DamageFloaterProps {
  effect: FloatingEffect;
  onComplete: () => void;
}

export function DamageFloater({ effect, onComplete }: DamageFloaterProps) {
  const [isExiting, setIsExiting] = useState(false);

  const isDamage = effect.type === "damage";
  const isHeal = effect.type === "heal";
  const isCritical = effect.isCritical;

  // Duration based on type
  const showDuration = isCritical ? 1500 : 1200;
  const exitDuration = 300;

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, showDuration);

    const removeTimer = setTimeout(() => {
      onComplete();
    }, showDuration + exitDuration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete, showDuration, exitDuration]);

  const value = typeof effect.value === "number" ? effect.value : parseInt(effect.value as string, 10);
  const displayValue = isDamage ? value : `+${Math.abs(value)}`;

  return (
    <div
      className={`
        floating-effect damage-floater
        font-bold tabular-nums select-none pointer-events-none
        ${isDamage ? "text-[var(--crimson)]" : "text-[#22c55e]"}
        ${isCritical ? "text-xl effect-critical" : "text-base effect-float-up"}
        ${isExiting ? "opacity-0" : ""}
      `}
      style={{
        transition: isExiting ? `opacity ${exitDuration}ms ease-out` : undefined,
      }}
    >
      {displayValue}
    </div>
  );
}
