"use client";

import type { PlayerSkill } from "@/lib/api";

interface SkillBarProps {
  skill: PlayerSkill;
  compact?: boolean;
  showXPGain?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  combat: "var(--crimson)",
  magical: "#8b5cf6",
  gathering: "#22c55e",
  crafting: "var(--amber)",
  social: "#a855f7",
  exploration: "var(--arcane)",
  knowledge: "#6366f1",
  companion: "#f472b6",
  locomotion: "#14b8a6",
  professional: "#eab308",
};

export function SkillBar({ skill, compact, showXPGain }: SkillBarProps) {
  const progressPercent = skill.xp_to_next > 0
    ? Math.min(100, (skill.xp / skill.xp_to_next) * 100)
    : 100;

  const barColor = CATEGORY_COLORS[skill.category] || "var(--amber)";

  if (compact) {
    return (
      <div className="skill-bar-compact group">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-[var(--mist)] uppercase tracking-wider truncate">
            {skill.display_name}
          </span>
          <span className="text-[var(--fog)] font-mono ml-1">{skill.level}</span>
        </div>
        <div className="skill-bar-track">
          <div
            className={`skill-bar-fill ${showXPGain ? "skill-pulse" : ""}`}
            style={{
              width: `${progressPercent}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        {showXPGain && showXPGain > 0 && (
          <span className="skill-xp-inline">+{showXPGain}</span>
        )}
      </div>
    );
  }

  return (
    <div className="skill-bar-row group">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-sm flex-shrink-0"
          style={{ backgroundColor: barColor }}
        />
        <span className="text-[var(--fog)] text-xs uppercase tracking-wide flex-1 truncate">
          {skill.display_name}
        </span>
        <span className="text-[var(--text)] font-mono text-xs w-6 text-right">
          {skill.level}
        </span>
      </div>
      <div className="skill-bar-track mt-1">
        <div
          className={`skill-bar-fill ${showXPGain ? "skill-pulse" : ""}`}
          style={{
            width: `${progressPercent}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      {showXPGain && showXPGain > 0 && (
        <div className="text-[10px] text-right mt-0.5" style={{ color: barColor }}>
          +{showXPGain} XP
        </div>
      )}
    </div>
  );
}
