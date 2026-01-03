"use client";

import { useEffect, useState } from "react";
import type { FloatingEffect } from "@/contexts/FloatingEffectsContext";

interface LocationBannerProps {
  effect: FloatingEffect;
  onComplete: () => void;
}

export function LocationBanner({ effect, onComplete }: LocationBannerProps) {
  const [isExiting, setIsExiting] = useState(false);

  const showDuration = 2000;
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

  return (
    <div
      className={`
        floating-effect location-banner
        text-xl font-bold tracking-wider select-none pointer-events-none
        text-[var(--amber)] text-center
        ${isExiting ? "location-exit" : "location-enter"}
      `}
    >
      <span className="text-[var(--mist)] opacity-60">══</span>
      <span className="mx-3">{effect.value}</span>
      <span className="text-[var(--mist)] opacity-60">══</span>
    </div>
  );
}
