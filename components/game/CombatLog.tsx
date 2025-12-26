"use client";

import { useEffect, useRef } from "react";
import type { CombatLogEntry } from "@/types/game";

interface CombatLogProps {
  entries: CombatLogEntry[];
  compact?: boolean;
}

export function CombatLog({ entries, compact = false }: CombatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-[var(--mist)] text-sm p-3">
        Combat begins...
      </div>
    );
  }

  if (compact) {
    // Compact view - just the last few entries
    const recentEntries = entries.slice(-3);
    return (
      <div className="space-y-1 p-2 text-xs">
        {recentEntries.map((entry, i) => (
          <div key={i} className="text-[var(--text-dim)]">
            <span className="text-[var(--amber)]">{entry.actor}</span>
            {" "}
            {entry.message}
          </div>
        ))}
      </div>
    );
  }

  // Group by round
  const roundGroups: { round: number; entries: CombatLogEntry[] }[] = [];
  entries.forEach((entry) => {
    const existing = roundGroups.find((g) => g.round === entry.round);
    if (existing) {
      existing.entries.push(entry);
    } else {
      roundGroups.push({ round: entry.round, entries: [entry] });
    }
  });

  return (
    <div className="combat-log overflow-y-auto max-h-48 p-3 space-y-3">
      {roundGroups.map((group) => (
        <div key={group.round}>
          <div className="text-[var(--mist)] text-xs uppercase tracking-wider mb-1">
            Round {group.round}
          </div>
          <div className="space-y-1.5 pl-2 border-l border-[var(--stone)]">
            {group.entries.map((entry, i) => (
              <div key={i} className="text-sm">
                <span className="text-[var(--amber)] font-medium">{entry.actor}</span>
                {entry.action === "attack" && entry.target && (
                  <>
                    <span className="text-[var(--mist)]"> attacks </span>
                    <span className="text-[var(--crimson)]">{entry.target}</span>
                  </>
                )}
                {entry.damage > 0 && (
                  <span className="text-[var(--crimson)]"> -{entry.damage}</span>
                )}
                {entry.message && (
                  <div className="text-[var(--text-dim)] text-xs mt-0.5 italic">
                    {entry.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
