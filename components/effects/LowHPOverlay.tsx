"use client";

import { useEffect, useState } from "react";

interface LowHPOverlayProps {
  hpPercent: number;
  threshold?: number; // Default 20%
}

export function LowHPOverlay({ hpPercent, threshold = 20 }: LowHPOverlayProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [wasAboveThreshold, setWasAboveThreshold] = useState(true);

  const isCritical = hpPercent <= threshold && hpPercent > 0;

  // Detect when HP crosses from above threshold to at/below threshold
  useEffect(() => {
    if (isCritical && wasAboveThreshold) {
      // Just crossed into critical - trigger flash
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isCritical, wasAboveThreshold]);

  // Track previous state
  useEffect(() => {
    setWasAboveThreshold(hpPercent > threshold);
  }, [hpPercent, threshold]);

  // Don't render if HP is above threshold
  if (!isCritical && !showFlash) return null;

  return (
    <div
      className={`low-hp-overlay ${showFlash ? "low-hp-flash" : ""} ${isCritical && !showFlash ? "low-hp-vignette" : ""}`}
      aria-hidden="true"
    />
  );
}
