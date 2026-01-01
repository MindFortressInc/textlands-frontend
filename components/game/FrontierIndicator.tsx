"use client";

import { useState, useEffect } from "react";
import type { FrontierStatus, FrontierZone } from "@/types/game";
import * as api from "@/lib/api";

interface FrontierIndicatorProps {
  worldId: string | null;
  playerId: string | null;
  compact?: boolean;
}

const ZONE_CONFIG: Record<FrontierZone, {
  label: string;
  color: string;
  bgColor: string;
  pulse: boolean;
}> = {
  safe: {
    label: "SAFE",
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
    pulse: false,
  },
  frontier: {
    label: "FRONTIER",
    color: "var(--amber)",
    bgColor: "rgba(245, 158, 11, 0.1)",
    pulse: false,
  },
  wilderness: {
    label: "WILDERNESS",
    color: "var(--crimson)",
    bgColor: "rgba(239, 68, 68, 0.1)",
    pulse: true,
  },
  deep_wild: {
    label: "DEEP WILD",
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.15)",
    pulse: true,
  },
};

export function FrontierIndicator({ worldId, playerId, compact }: FrontierIndicatorProps) {
  const [frontier, setFrontier] = useState<FrontierStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!worldId || !playerId) return;

    setLoading(true);
    api.getFrontierStatus(worldId, playerId)
      .then(setFrontier)
      .catch(() => {
        // Silently fail - frontier status is optional
        setFrontier(null);
      })
      .finally(() => setLoading(false));
  }, [worldId, playerId]);

  if (loading || !frontier) return null;

  // Don't show indicator for safe zones unless compact mode
  if (frontier.zone === "safe" && !compact) return null;

  const config = ZONE_CONFIG[frontier.zone];
  const attrition = frontier.danger_info.attrition_range;

  if (compact) {
    return (
      <span
        className={`frontier-badge ${config.pulse ? "frontier-pulse" : ""}`}
        style={{
          color: config.color,
          backgroundColor: config.bgColor,
        }}
      >
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={`frontier-indicator ${config.pulse ? "frontier-pulse" : ""}`}
      style={{
        borderColor: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-wider font-bold"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        {frontier.danger_info.difficulty_modifier > 0 && (
          <span className="text-[var(--mist)] text-[10px]">
            +{frontier.danger_info.difficulty_modifier * 100}% difficulty
          </span>
        )}
      </div>

      {attrition && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[var(--crimson)] text-[10px]">⚠</span>
          <span className="text-[var(--mist)] text-[10px]">
            {attrition[0]}-{attrition[1]} HP/action
          </span>
          {frontier.danger_info.survival_skill_helps && (
            <span className="text-[var(--arcane)] text-[10px]">(Survival helps)</span>
          )}
        </div>
      )}

      {frontier.settlement_level !== "established" && frontier.settlement_progress.next_threshold && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-[var(--mist)]">
              Settlement: {frontier.settlement_level}
            </span>
            <span className="text-[var(--mist)]">
              {frontier.settlement_activity}/{frontier.settlement_progress.next_threshold}
            </span>
          </div>
          <div className="h-1 bg-[var(--shadow)] border border-[var(--slate)]">
            <div
              className="h-full bg-[var(--amber-dim)]"
              style={{ width: `${frontier.settlement_progress.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
