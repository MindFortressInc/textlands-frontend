"use client";

import { getTierFromScore, getProgressToNextTier, formatScore } from "@/lib/influence";

interface InfluenceBadgeProps {
  score: number;
  rank?: number;
  size?: "sm" | "md";
  showScore?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
}

export function InfluenceBadge({
  score,
  rank,
  size = "md",
  showScore = false,
  showProgress = false,
  onClick,
}: InfluenceBadgeProps) {
  const tier = getTierFromScore(score);
  const progress = getProgressToNextTier(score);

  const isSmall = size === "sm";
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        inline-flex flex-col gap-1
        ${isClickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
      `}
      title={isClickable ? "View Leaderboard" : undefined}
    >
      {/* Badge row */}
      <div className={`inline-flex items-center gap-1.5 ${isSmall ? "text-xs" : "text-sm"}`}>
        {/* Tier icon */}
        <span
          className="font-bold"
          style={{ color: `var(${tier.color})` }}
        >
          {tier.icon}
        </span>

        {/* Tier name */}
        <span
          className="font-medium"
          style={{ color: `var(${tier.color})` }}
        >
          {tier.name}
        </span>

        {/* Rank badge */}
        {rank && (
          <span className="text-[var(--mist)] text-[10px]">
            #{rank}
          </span>
        )}

        {/* Score */}
        {showScore && (
          <span className="text-[var(--mist)] text-[10px]">
            ({formatScore(score)})
          </span>
        )}
      </div>

      {/* Progress bar to next tier */}
      {showProgress && progress && (
        <div className="w-full">
          <div className="h-1 bg-[var(--slate)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress.progress}%`,
                backgroundColor: `var(${tier.color})`,
              }}
            />
          </div>
          <div className="text-[var(--mist)] text-[10px] mt-0.5">
            {progress.pointsNeeded} to {progress.nextTier.name}
          </div>
        </div>
      )}
    </div>
  );
}
