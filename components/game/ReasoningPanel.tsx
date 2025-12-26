"use client";

import type { ReasoningInfo } from "@/types/game";

interface ReasoningPanelProps {
  reasoning: ReasoningInfo;
  compact?: boolean;
}

const OUTCOME_STYLES: Record<string, { color: string; label: string }> = {
  "success": { color: "var(--arcane)", label: "Success" },
  "exceptional success": { color: "var(--amber)", label: "Exceptional" },
  "failure": { color: "var(--crimson)", label: "Failure" },
  "significant setback": { color: "var(--crimson)", label: "Setback" },
};

export function ReasoningPanel({ reasoning, compact = false }: ReasoningPanelProps) {
  const outcomeStyle = OUTCOME_STYLES[reasoning.outcome] || { color: "var(--mist)", label: reasoning.outcome };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-[var(--mist)] mt-1">
        <span className="opacity-50">[</span>
        <span style={{ color: outcomeStyle.color }}>{outcomeStyle.label}</span>
        <span className="opacity-50">·</span>
        <span>{reasoning.success_chance}</span>
        <span className="opacity-50">]</span>
      </div>
    );
  }

  const hasStrengths = reasoning.your_strengths.length > 0 && reasoning.your_strengths[0] !== "None notable";
  const hasChallenges = reasoning.challenges.length > 0 && reasoning.challenges[0] !== "None notable";
  const hasConsequence = reasoning.consequence && reasoning.consequence !== "No lasting effects";

  return (
    <div className="reasoning-panel mt-2 p-3 rounded border border-[var(--stone)] bg-[var(--shadow)]/50 text-sm font-mono">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--stone)]/50">
        <span className="text-[var(--mist)] uppercase text-xs tracking-wider">
          {reasoning.action_type}
        </span>
        <div className="flex items-center gap-2">
          <span style={{ color: outcomeStyle.color }} className="font-medium">
            {outcomeStyle.label}
          </span>
          <span className="text-[var(--mist)]">({reasoning.success_chance})</span>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-1.5">
        {hasStrengths && (
          <div className="flex items-start gap-2">
            <span className="text-[var(--arcane)] shrink-0">+</span>
            <span className="text-[var(--text-dim)]">
              {reasoning.your_strengths.join(", ")}
            </span>
          </div>
        )}

        {hasChallenges && (
          <div className="flex items-start gap-2">
            <span className="text-[var(--crimson)] shrink-0">-</span>
            <span className="text-[var(--text-dim)]">
              {reasoning.challenges.join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Consequence */}
      {hasConsequence && (
        <div className="mt-2 pt-2 border-t border-[var(--stone)]/50">
          <span className="text-[var(--amber)] text-xs">
            {reasoning.consequence}
          </span>
        </div>
      )}
    </div>
  );
}
