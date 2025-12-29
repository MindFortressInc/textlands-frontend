"use client";

import type { PlayerWorldStats } from "@/types/game";
import type { PlayerInfluence } from "@/lib/api";
import { InfluenceBadge } from "./InfluenceBadge";
import { formatScore } from "@/lib/influence";

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerWorldStats | null;
  influence: PlayerInfluence | null;
  worldName?: string;
  onLeaderboardClick?: () => void;
}

export function PlayerStatsModal({
  isOpen,
  onClose,
  stats,
  influence,
  worldName,
  onLeaderboardClick,
}: PlayerStatsModalProps) {
  if (!isOpen) return null;

  const formatPlaytime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">
            {worldName ? `STATS: ${worldName}` : "PLAYER STATS"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!stats && !influence ? (
            <div className="text-center py-8 text-[var(--mist)] animate-pulse">
              Loading...
            </div>
          ) : (
            <>
              {/* Influence Section */}
              {influence && (
                <div className="space-y-3">
                  <h3 className="text-[var(--text)] font-semibold flex items-center gap-2">
                    <span className="text-[var(--arcane)]">*</span>
                    Influence
                  </h3>

                  <div className="p-3 bg-[var(--shadow)] rounded-lg border border-[var(--slate)]">
                    <div className="flex items-center justify-between mb-3">
                      <InfluenceBadge
                        score={influence.trailblazer_score}
                        rank={influence.rank}
                        showScore
                        showProgress
                      />
                      {influence.is_world_creator && (
                        <span className="text-xs px-2 py-0.5 bg-[var(--amber)]/20 text-[var(--amber)] rounded">
                          Creator
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-[var(--text)] font-medium mb-1">
                      {influence.title}
                    </div>

                    {/* Tier Progress */}
                    <div className="text-xs text-[var(--mist)] mb-3">
                      Tier {influence.tier_progress.current_tier} → {influence.tier_progress.next_tier}
                      <span className="ml-2">
                        ({influence.tier_progress.points_needed} pts to next tier)
                      </span>
                    </div>

                    {/* Powers */}
                    {influence.powers.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-[var(--mist)] mb-1">Powers</div>
                        <div className="flex flex-wrap gap-1">
                          {influence.powers.map((power) => (
                            <span
                              key={power}
                              className="text-xs px-2 py-0.5 bg-[var(--stone)] text-[var(--fog)] rounded"
                            >
                              {power}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decay Warning */}
                    {influence.decay_at_risk && (
                      <div className="text-xs text-[var(--crimson)] p-2 bg-[var(--crimson)]/10 rounded">
                        Influence decay at risk - play to maintain tier
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Section */}
              {stats && (
                <div className="space-y-3">
                  <h3 className="text-[var(--text)] font-semibold flex items-center gap-2">
                    <span className="text-[var(--arcane)]">*</span>
                    World Progress
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Trailblazer"
                      value={formatScore(stats.trailblazer_score)}
                    />
                    <StatCard
                      label="Governance"
                      value={formatScore(stats.governance_points)}
                    />
                    <StatCard
                      label="Currency"
                      value={formatScore(stats.currency)}
                    />
                    <StatCard
                      label="Entities"
                      value={stats.entities_created_count.toString()}
                    />
                    <StatCard
                      label="Playtime"
                      value={formatPlaytime(stats.total_playtime_minutes)}
                    />
                    <StatCard
                      label="Last Played"
                      value={formatDate(stats.last_played_at)}
                    />
                  </div>
                </div>
              )}

              {/* Passive Income (from influence) */}
              {influence && influence.total_passive_income > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[var(--text)] font-semibold flex items-center gap-2">
                    <span className="text-[var(--arcane)]">*</span>
                    Passive Income
                  </h3>
                  <div className="p-3 bg-[var(--shadow)] rounded-lg border border-[var(--slate)]">
                    <div className="text-[var(--amber)] font-mono text-lg">
                      +{formatScore(influence.total_passive_income)}/day
                    </div>
                    <div className="text-xs text-[var(--mist)]">
                      From entities you created
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)] flex gap-3">
          {onLeaderboardClick && (
            <button
              onClick={() => {
                onClose();
                onLeaderboardClick();
              }}
              className="flex-1 py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber-dim)] transition-colors"
            >
              View HiScores
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--shadow)] rounded-lg border border-[var(--slate)]">
      <div className="text-xs text-[var(--mist)] mb-1">{label}</div>
      <div className="text-[var(--text)] font-mono">{value}</div>
    </div>
  );
}
