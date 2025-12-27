// Influence tier system utilities

export interface TierInfo {
  level: number;
  name: string;
  color: string;  // CSS variable name
  icon: string;   // ASCII character
  minScore: number;
  maxScore: number | null;
}

const TIERS: TierInfo[] = [
  { level: 0, name: "Wanderer", color: "--mist", icon: "*", minScore: 0, maxScore: 99 },
  { level: 1, name: "Pathfinder", color: "--text", icon: "+", minScore: 100, maxScore: 499 },
  { level: 2, name: "Trailblazer", color: "--arcane", icon: "#", minScore: 500, maxScore: 1999 },
  { level: 3, name: "Pioneer", color: "--amber", icon: "@", minScore: 2000, maxScore: 4999 },
  { level: 4, name: "Worldshaper", color: "--crimson", icon: "$", minScore: 5000, maxScore: null },
];

export function getTierFromScore(score: number): TierInfo {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

export function getProgressToNextTier(score: number): {
  progress: number;
  pointsNeeded: number;
  nextTier: TierInfo;
} | null {
  const currentTier = getTierFromScore(score);

  // Max tier - no next tier
  if (currentTier.maxScore === null) {
    return null;
  }

  const nextTier = TIERS[currentTier.level + 1];
  const tierRange = currentTier.maxScore - currentTier.minScore + 1;
  const progressInTier = score - currentTier.minScore;
  const progress = Math.round((progressInTier / tierRange) * 100);
  const pointsNeeded = nextTier.minScore - score;

  return { progress, pointsNeeded, nextTier };
}

export function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}
