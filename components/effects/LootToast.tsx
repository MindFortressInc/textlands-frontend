"use client";

import { useEffect, useState } from "react";
import type { FloatingEffect } from "@/contexts/FloatingEffectsContext";

interface LootToastProps {
  effect: FloatingEffect;
  onComplete: () => void;
}

export function LootToast({ effect, onComplete }: LootToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const showDuration = 2500;
  const exitDuration = 500;

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

  const quantity = effect.quantity || 1;

  return (
    <div
      className={`
        floating-effect loot-toast
        px-3 py-2 rounded
        bg-[var(--shadow)] border border-[var(--slate)]
        border-l-[3px] border-l-[var(--gold)]
        shadow-lg select-none
        ${isExiting ? "loot-exit" : "loot-enter"}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-[var(--gold)]">◈</span>
        <span className="text-[var(--text)] text-sm font-medium">{effect.value}</span>
        {quantity > 1 && (
          <span className="text-[var(--mist)] text-xs">×{quantity}</span>
        )}
      </div>
    </div>
  );
}
