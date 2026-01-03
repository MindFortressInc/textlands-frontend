"use client";

import { useEffect, useState } from "react";
import type { FloatingEffect } from "@/contexts/FloatingEffectsContext";

interface GoldFloaterProps {
  effect: FloatingEffect;
  onComplete: () => void;
}

export function GoldFloater({ effect, onComplete }: GoldFloaterProps) {
  const [isExiting, setIsExiting] = useState(false);

  const showDuration = 1200;
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
  }, [onComplete]);

  const value = typeof effect.value === "number" ? effect.value : parseInt(effect.value as string, 10);
  const isGain = value > 0;
  const displayValue = isGain ? `+${value}g` : `${value}g`;

  return (
    <div
      className={`
        floating-effect gold-floater effect-float-up
        font-bold tabular-nums select-none pointer-events-none text-base
        ${isGain ? "text-[var(--gold)]" : "text-[var(--crimson)]"}
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
