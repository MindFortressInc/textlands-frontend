"use client";

import type { RelationshipStatus as RelationshipStatusType } from "@/types/game";

interface RelationshipStatusProps {
  relationship: RelationshipStatusType;
  onInitiateScene?: () => void;
  compact?: boolean;
}

const LEVEL_CONFIG: Record<
  RelationshipStatusType["level"],
  { label: string; color: string; icon: string }
> = {
  stranger: { label: "Stranger", color: "var(--mist)", icon: "?" },
  acquaintance: { label: "Acquaintance", color: "var(--text-dim)", icon: "○" },
  friendly: { label: "Friendly", color: "var(--arcane)", icon: "◐" },
  close: { label: "Close", color: "var(--amber)", icon: "◑" },
  intimate: { label: "Intimate", color: "var(--crimson)", icon: "●" },
  bonded: { label: "Bonded", color: "#ff69b4", icon: "♥" },
};

export function RelationshipStatus({
  relationship,
  onInitiateScene,
  compact = false,
}: RelationshipStatusProps) {
  const config = LEVEL_CONFIG[relationship.level];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <span style={{ color: config.color }}>{config.icon}</span>
        <span className="text-[var(--text-dim)]">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="relationship-card p-4 rounded-lg border border-[var(--stone)] bg-[var(--shadow)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[var(--amber)] font-semibold">{relationship.npc_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: config.color }} className="text-lg">
              {config.icon}
            </span>
            <span style={{ color: config.color }} className="text-sm font-medium">
              {config.label}
            </span>
          </div>
        </div>
        {relationship.can_initiate_scene && onInitiateScene && (
          <button
            onClick={onInitiateScene}
            className="px-3 py-1.5 rounded text-sm bg-[var(--crimson)]/20 text-[var(--crimson)] border border-[var(--crimson)]/50 hover:bg-[var(--crimson)]/30 transition-colors"
          >
            Initiate...
          </button>
        )}
      </div>

      {/* Stats Bars */}
      <div className="space-y-3">
        {/* Trust */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-dim)]">Trust</span>
            <span className="text-[var(--arcane)]">{relationship.trust}%</span>
          </div>
          <div className="h-1.5 bg-[var(--stone)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--arcane)] transition-all duration-500"
              style={{ width: `${relationship.trust}%` }}
            />
          </div>
        </div>

        {/* Attraction */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-dim)]">Attraction</span>
            <span className="text-[var(--crimson)]">{relationship.attraction}%</span>
          </div>
          <div className="h-1.5 bg-[var(--stone)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--crimson)] transition-all duration-500"
              style={{ width: `${relationship.attraction}%` }}
            />
          </div>
        </div>
      </div>

      {/* History Summary */}
      {relationship.history_summary && (
        <p className="mt-4 text-[var(--text-dim)] text-sm italic">
          {relationship.history_summary}
        </p>
      )}

      {/* Last Interaction */}
      {relationship.last_interaction && (
        <p className="mt-2 text-[var(--mist)] text-xs">
          Last: {relationship.last_interaction}
        </p>
      )}
    </div>
  );
}
