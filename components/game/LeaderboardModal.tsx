"use client";

import { useState, useEffect } from "react";
import { InfluenceBadge } from "./InfluenceBadge";
import { formatScore } from "@/lib/influence";
import * as api from "@/lib/api";
import type { LeaderboardEntry } from "@/types/game";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
  worldName?: string;
  playerId: string | null;
}

type Tab = "world" | "global";

export function LeaderboardModal({
  isOpen,
  onClose,
  worldId,
  worldName,
  playerId,
}: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(worldId ? "world" : "global");
  const [worldLeaderboard, setWorldLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch leaderboard data when modal opens or tab changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "world" && worldId) {
          const data = await api.getWorldLeaderboard(worldId);
          setWorldLeaderboard(data);
        } else if (activeTab === "global") {
          const data = await api.getGlobalLeaderboard();
          setGlobalLeaderboard(data);
        }
      } catch (err) {
        console.error("[Leaderboard] Failed to fetch:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [isOpen, activeTab, worldId]);

  if (!isOpen) return null;

  const currentData = activeTab === "world" ? worldLeaderboard : globalLeaderboard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">HISCORES</h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--slate)]">
          {worldId && (
            <button
              onClick={() => setActiveTab("world")}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${activeTab === "world"
                  ? "text-[var(--amber)] border-[var(--amber)]"
                  : "text-[var(--mist)] border-transparent hover:text-[var(--text)]"
                }
              `}
            >
              {worldName || "This World"}
            </button>
          )}
          <button
            onClick={() => setActiveTab("global")}
            className={`
              flex-1 py-3 px-4 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${activeTab === "global"
                ? "text-[var(--amber)] border-[var(--amber)]"
                : "text-[var(--mist)] border-transparent hover:text-[var(--text)]"
              }
            `}
          >
            Global
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--mist)] animate-pulse">
              Loading...
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-8 text-[var(--mist)]">
              <p>No rankings yet</p>
              <p className="text-sm mt-2">Be the first trailblazer!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentData.map((entry) => {
                const isCurrentPlayer = entry.player_id === playerId;
                return (
                  <div
                    key={entry.player_id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg
                      bg-[var(--shadow)] border transition-colors
                      ${isCurrentPlayer
                        ? "border-[var(--amber)] bg-[var(--stone)]"
                        : "border-[var(--slate)] hover:border-[var(--amber-dim)]"
                      }
                    `}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      <span className={`
                        font-bold text-lg
                        ${entry.rank === 1 ? "text-[var(--amber)]" :
                          entry.rank === 2 ? "text-[var(--text)]" :
                          entry.rank === 3 ? "text-[var(--arcane)]" :
                          "text-[var(--mist)]"}
                      `}>
                        {entry.rank}
                      </span>
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <InfluenceBadge score={entry.trailblazer_score} size="sm" />
                        {isCurrentPlayer && (
                          <span className="text-[var(--amber)] text-xs">(You)</span>
                        )}
                      </div>
                      <div className="text-[var(--mist)] text-xs mt-1 truncate">
                        {entry.entities_created} entities created
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-[var(--text)] font-mono">
                        {formatScore(entry.trailblazer_score)}
                      </div>
                      <div className="text-[var(--mist)] text-[10px]">
                        score
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)]">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
