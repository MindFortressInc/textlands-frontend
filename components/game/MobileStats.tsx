"use client";

import { useState } from "react";
import type { Character } from "@/types/game";
import type { PlayerInfluence } from "@/lib/api";
import { InfluenceBadge } from "./InfluenceBadge";

interface MobileStatsProps {
  character: Character | null;
  zoneName?: string;
  influence?: PlayerInfluence | null;
  onLeaderboardClick?: () => void;
}

function MiniBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="h-1.5 w-full bg-[var(--void)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function MobileStats({ character, zoneName, influence, onLeaderboardClick }: MobileStatsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!character) return null;

  const { stats } = character;

  return (
    <div className="md:hidden bg-[var(--shadow)] border-b border-[var(--slate)] shrink-0">
      {/* Collapsed bar - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center gap-3 active:bg-[var(--stone)] transition-colors"
      >
        {/* Character name */}
        <span className="text-[var(--amber)] font-bold text-sm shrink-0">
          {character.name}
        </span>

        {/* Compact stat bars */}
        <div className="flex-1 flex items-center gap-2">
          {/* HP */}
          <div className="flex items-center gap-1.5 flex-1 max-w-20">
            <span className="text-[var(--crimson)] text-[10px] font-bold">HP</span>
            <MiniBar current={stats.hp} max={stats.max_hp} color="var(--crimson)" />
          </div>

          {/* MP */}
          <div className="flex items-center gap-1.5 flex-1 max-w-20">
            <span className="text-[var(--arcane)] text-[10px] font-bold">MP</span>
            <MiniBar current={stats.mana} max={stats.max_mana} color="var(--arcane)" />
          </div>

          {/* Gold */}
          <span className="text-[var(--amber)] text-xs tabular-nums shrink-0">
            {stats.gold}g
          </span>
        </div>

        {/* Expand indicator */}
        <span
          className="text-[var(--mist)] text-xs transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--slate)] animate-slide-down">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Left column - stats */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--crimson)]">Health</span>
                  <span className="text-[var(--mist)] tabular-nums">{stats.hp}/{stats.max_hp}</span>
                </div>
                <div className="stat-bar hp-bar">
                  <div className="stat-bar-fill" style={{ width: `${(stats.hp / stats.max_hp) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--arcane)]">Mana</span>
                  <span className="text-[var(--mist)] tabular-nums">{stats.mana}/{stats.max_mana}</span>
                </div>
                <div className="stat-bar mana-bar">
                  <div className="stat-bar-fill" style={{ width: `${(stats.mana / stats.max_mana) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--amber)]">Experience</span>
                  <span className="text-[var(--mist)] tabular-nums">{stats.xp % 100}/100</span>
                </div>
                <div className="stat-bar xp-bar">
                  <div className="stat-bar-fill" style={{ width: `${stats.xp % 100}%` }} />
                </div>
              </div>
            </div>

            {/* Right column - info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Class</span>
                <span className="text-[var(--text)] capitalize">{character.character_class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Race</span>
                <span className="text-[var(--text)] capitalize">{character.race}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Level</span>
                <span className="text-[var(--amber)]">{stats.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Gold</span>
                <span className="text-[var(--amber)]">{stats.gold}</span>
              </div>
              {influence && (
                <div className="pt-2 border-t border-[var(--slate)]">
                  <div className="text-[var(--mist)] mb-1">Influence</div>
                  <InfluenceBadge
                    score={influence.trailblazer_score}
                    rank={influence.rank}
                    size="sm"
                    onClick={onLeaderboardClick}
                  />
                </div>
              )}
              {zoneName && (
                <div className="pt-2 border-t border-[var(--slate)]">
                  <div className="text-[var(--mist)]">Location</div>
                  <div className="text-[var(--text)]">{zoneName}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
