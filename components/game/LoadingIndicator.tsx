"use client";

import { useState, useEffect } from "react";
import { TextShimmer } from "@/components/ui/text-shimmer";

const GAME_TIPS = [
  "You can describe any action naturally...",
  "Try talking to NPCs - they remember you...",
  "Your choices shape the world around you...",
  "Every NPC has their own story...",
  "Explore freely - there are no wrong paths...",
  "Your reputation follows you...",
  "Actions have consequences...",
  "Type 'look' to examine your surroundings...",
  "NPCs react based on your past interactions...",
  "The world evolves even when you're away...",
  "Be creative - Textlands adapts to you...",
  "Some secrets require patience to uncover...",
  "Your character's story is yours to write...",
  "Other players leave traces in the world...",
  "Every action ripples through time...",
];

interface LoadingIndicatorProps {
  show: boolean;
}

export function LoadingIndicator({ show }: LoadingIndicatorProps) {
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * GAME_TIPS.length)
  );

  // Rotate tips every 3 seconds while loading
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % GAME_TIPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [show]);

  // Reset to random tip when loading starts
  useEffect(() => {
    if (show) {
      setTipIndex(Math.floor(Math.random() * GAME_TIPS.length));
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="px-3 md:px-4 py-3 border-t border-[var(--slate)] bg-[var(--shadow)]">
      <TextShimmer
        duration={1.5}
        className="text-sm [--base-color:var(--mist)] [--base-gradient-color:var(--amber)]"
      >
        {GAME_TIPS[tipIndex]}
      </TextShimmer>
    </div>
  );
}
