"use client";

import { useState } from "react";
import type { Character } from "@/types/game";
import type { PlayerInfluence, LocationFootprint } from "@/lib/api";
import { InfluenceBadge } from "./InfluenceBadge";

interface CharacterPanelProps {
  character: Character | null;
  zoneName?: string;
  influence?: PlayerInfluence | null;
  onLeaderboardClick?: () => void;
  onStatsClick?: () => void;
  footprints?: LocationFootprint[];
  onLeaveMessage?: (message: string) => Promise<void>;
  loadingFootprints?: boolean;
}

function StatBar({ current, max, type }: { current: number; max: number; type: "hp" | "mana" | "xp" }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className={`stat-bar ${type}-bar`}>
      <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CharacterPanel({
  character,
  zoneName,
  influence,
  onLeaderboardClick,
  onStatsClick,
  footprints,
  onLeaveMessage,
  loadingFootprints,
}: CharacterPanelProps) {
  const [footprintsExpanded, setFootprintsExpanded] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !onLeaveMessage) return;
    setSendingMessage(true);
    try {
      await onLeaveMessage(messageInput.trim());
      setMessageInput("");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  if (!character) {
    return (
      <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] p-4 text-[var(--mist)] text-sm">
        No character
      </div>
    );
  }

  const stats = character.stats || { hp: 0, max_hp: 100, mana: 0, max_mana: 50, gold: 0, xp: 0, level: 1 };

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

      {/* Footprints */}
      {footprints !== undefined && (
        <div className="border-t border-[var(--slate)]">
          <button
            onClick={() => setFootprintsExpanded(!footprintsExpanded)}
            className="w-full p-3 flex items-center justify-between text-xs hover:bg-[var(--stone)] transition-colors"
          >
            <span className="text-[var(--mist)]">
              Travelers {footprints.length > 0 && `(${footprints.length})`}
            </span>
            <span className="text-[var(--mist)]">
              {footprintsExpanded ? "−" : "+"}
            </span>
          </button>

          {footprintsExpanded && (
            <div className="px-3 pb-3 space-y-2">
              {loadingFootprints ? (
                <div className="text-[var(--mist)] text-xs animate-pulse">Loading...</div>
              ) : footprints.length === 0 ? (
                <div className="text-[var(--mist)] text-xs">No recent visitors</div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {footprints.slice(0, 10).map((fp, i) => (
                    <div key={`${fp.player_id}-${i}`} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--fog)]">{fp.display_name}</span>
                        <span className="text-[var(--mist)]">{formatTimeAgo(fp.visited_at)}</span>
                      </div>
                      {fp.message && (
                        <div className="text-[var(--mist)] italic mt-0.5 truncate">
                          &quot;{fp.message}&quot;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Leave message input */}
              {onLeaveMessage && (
                <div className="pt-2 border-t border-[var(--slate)]">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Leave a note..."
                      maxLength={100}
                      disabled={sendingMessage}
                      className="flex-1 px-2 py-1 text-xs bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                      className="px-2 py-1 text-xs bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingMessage ? "..." : "Send"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
