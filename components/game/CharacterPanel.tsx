"use client";

import type { Character } from "@/types/game";
import type { PlayerInfluence } from "@/lib/api";
import { InfluenceBadge } from "./InfluenceBadge";

interface CharacterPanelProps {
  character: Character | null;
  zoneName?: string;
  influence?: PlayerInfluence | null;
  onLeaderboardClick?: () => void;
}

function StatBar({ current, max, type }: { current: number; max: number; type: "hp" | "mana" | "xp" }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className={`stat-bar ${type}-bar`}>
      <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CharacterPanel({ character, zoneName, influence, onLeaderboardClick }: CharacterPanelProps) {
  if (!character) {
    return (
      <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] p-4 text-[var(--mist)] text-sm">
        No character
      </div>
    );
  }

  const { stats } = character;

  return (
    <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] flex flex-col text-sm">
      {/* Header */}
      <div className="p-3 border-b border-[var(--slate)]">
        <div className="text-[var(--amber)] font-bold">{character.name}</div>
        <div className="text-[var(--mist)] text-xs">
          Lv.{stats.level} {character.race} {character.character_class}
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-3 flex-1">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--crimson)]">HP</span>
            <span className="text-[var(--mist)]">{stats.hp}/{stats.max_hp}</span>
          </div>
          <StatBar current={stats.hp} max={stats.max_hp} type="hp" />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--arcane)]">MP</span>
            <span className="text-[var(--mist)]">{stats.mana}/{stats.max_mana}</span>
          </div>
          <StatBar current={stats.mana} max={stats.max_mana} type="mana" />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--amber)]">XP</span>
            <span className="text-[var(--mist)]">{stats.xp % 100}/100</span>
          </div>
          <StatBar current={stats.xp % 100} max={100} type="xp" />
        </div>

        <div className="pt-2 border-t border-[var(--slate)]">
          <div className="flex justify-between">
            <span className="text-[var(--mist)]">Gold</span>
            <span className="text-[var(--amber)]">{stats.gold}</span>
          </div>
        </div>

        {/* Influence */}
        {influence && (
          <div className="pt-2 border-t border-[var(--slate)]">
            <div className="text-[var(--mist)] text-xs mb-2">Influence</div>
            <InfluenceBadge
              score={influence.trailblazer_score}
              rank={influence.rank}
              showScore
              showProgress
              onClick={onLeaderboardClick}
            />
          </div>
        )}
      </div>

      {/* Location */}
      {zoneName && (
        <div className="p-3 border-t border-[var(--slate)] bg-[var(--stone)]">
          <div className="text-[var(--mist)] text-xs">Location</div>
          <div className="text-[var(--fog)]">{zoneName}</div>
        </div>
      )}
    </div>
  );
}
