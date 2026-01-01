"use client";

import { useState, useEffect } from "react";
import type { PlayerSkill, SkillsResponse, SkillCategory } from "@/lib/api";
import * as api from "@/lib/api";
import { SkillBar } from "./SkillBar";

interface SkillsTabProps {
  worldId: string | null;
  playerId: string | null;
  recentXPGain?: { skill_name: string; xp_gained: number } | null;
}

const CATEGORY_ORDER: SkillCategory[] = [
  "combat",
  "gathering",
  "crafting",
  "social",
  "exploration",
  "knowledge",
  "companion",
];

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  combat: "Combat",
  gathering: "Gathering",
  crafting: "Crafting",
  social: "Social",
  exploration: "Exploration",
  knowledge: "Knowledge",
  companion: "Companion",
};

function groupSkillsByCategory(skills: PlayerSkill[]): Record<SkillCategory, PlayerSkill[]> {
  const grouped: Record<SkillCategory, PlayerSkill[]> = {
    combat: [],
    gathering: [],
    crafting: [],
    social: [],
    exploration: [],
    knowledge: [],
    companion: [],
  };

  for (const skill of skills) {
    const cat = skill.category as SkillCategory;
    if (grouped[cat]) {
      grouped[cat].push(skill);
    }
  }

  // Sort each category by level descending
  for (const cat of CATEGORY_ORDER) {
    grouped[cat].sort((a, b) => b.level - a.level);
  }

  return grouped;
}

export function SkillsTab({ worldId, playerId, recentXPGain }: SkillsTabProps) {
  const [skills, setSkills] = useState<SkillsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<SkillCategory>>(
    new Set(["combat"])
  );

  useEffect(() => {
    if (!worldId || !playerId) return;

    setLoading(true);
    setError(null);

    api.getSkills(worldId, playerId)
      .then(setSkills)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [worldId, playerId]);

  const toggleCategory = (cat: SkillCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  if (!worldId || !playerId) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs">
        No active session
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs animate-pulse">
        Loading skills...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-[var(--crimson)] text-xs">
        {error}
      </div>
    );
  }

  if (!skills || skills.skills.length === 0) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs">
        No skills yet. Take actions to level up!
      </div>
    );
  }

  const grouped = groupSkillsByCategory(skills.skills);

  return (
    <div className="flex flex-col text-xs overflow-hidden">
      {/* Total Level Header */}
      <div className="p-3 border-b border-[var(--slate)] bg-[var(--stone)]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--amber)] text-[10px] uppercase tracking-wider">
            Total Level
          </span>
          <span className="text-[var(--text)] font-mono text-sm">
            {skills.total_level}
          </span>
        </div>
        {skills.highest_skill && (
          <div className="text-[var(--mist)] text-[10px] mt-1">
            Highest: {skills.highest_skill}
          </div>
        )}
      </div>

      {/* Skills by Category */}
      <div className="flex-1 overflow-y-auto">
        {CATEGORY_ORDER.map((cat) => {
          const catSkills = grouped[cat];
          if (catSkills.length === 0) return null;

          const isExpanded = expandedCategories.has(cat);
          const catTotal = catSkills.reduce((sum, s) => sum + s.level, 0);

          return (
            <div key={cat} className="border-b border-[var(--slate)]">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full p-2 flex items-center justify-between hover:bg-[var(--stone)] transition-colors"
              >
                <span className="text-[var(--fog)] text-[10px] uppercase tracking-wider">
                  {CATEGORY_LABELS[cat]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--mist)] font-mono text-[10px]">
                    {catTotal}
                  </span>
                  <span className="text-[var(--mist)] text-[10px]">
                    {isExpanded ? "−" : "+"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-2 pb-2 space-y-2">
                  {catSkills.map((skill) => (
                    <SkillBar
                      key={skill.skill_name}
                      skill={skill}
                      compact
                      showXPGain={
                        recentXPGain?.skill_name === skill.skill_name
                          ? recentXPGain.xp_gained
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
