"use client";

import { useEffect, useState } from "react";
import type { SkillXPGain } from "@/types/game";

interface SkillXPToastProps {
  gain: SkillXPGain;
  onDismiss: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  combat: "⚔",
  gathering: "⛏",
  crafting: "🔨",
  social: "💬",
  exploration: "🧭",
  knowledge: "📖",
  companion: "🐾",
  // Fallback for specific skills
  melee: "⚔",
  ranged: "🏹",
  defense: "🛡",
  magic: "✨",
  stealth: "👤",
  survival: "🏕",
};

const CATEGORY_COLORS: Record<string, string> = {
  combat: "var(--crimson)",
  gathering: "#22c55e",
  crafting: "var(--amber)",
  social: "#a855f7",
  exploration: "var(--arcane)",
  knowledge: "#6366f1",
  companion: "#f472b6",
};

function getSkillCategory(skillName: string): string {
  const combatSkills = ["melee", "ranged", "defense", "magic"];
  const gatheringSkills = ["mining", "woodcutting", "fishing", "herbalism"];
  const craftingSkills = ["smithing", "alchemy", "cooking", "enchanting"];
  const socialSkills = ["persuasion", "deception", "intimidation", "performance"];
  const explorationSkills = ["stealth", "survival", "athletics"];
  const knowledgeSkills = ["perception", "lore", "investigation", "medicine"];
  const companionSkills = ["beast_mastery", "taming"];

  if (combatSkills.includes(skillName)) return "combat";
  if (gatheringSkills.includes(skillName)) return "gathering";
  if (craftingSkills.includes(skillName)) return "crafting";
  if (socialSkills.includes(skillName)) return "social";
  if (explorationSkills.includes(skillName)) return "exploration";
  if (knowledgeSkills.includes(skillName)) return "knowledge";
  if (companionSkills.includes(skillName)) return "companion";
  return "exploration";
}

export function SkillXPToast({ gain, onDismiss }: SkillXPToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2500);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const category = getSkillCategory(gain.skill_name);
  const icon = CATEGORY_ICONS[gain.skill_name] || CATEGORY_ICONS[category] || "✦";
  const color = CATEGORY_COLORS[category] || "var(--amber)";

  return (
    <div
      className={`skill-xp-toast ${isExiting ? "skill-xp-toast-exit" : ""} ${
        gain.leveled_up ? "skill-xp-toast-levelup" : ""
      }`}
      style={{ "--skill-color": color } as React.CSSProperties}
    >
      <span className="skill-xp-icon">{icon}</span>
      <div className="skill-xp-content">
        {gain.leveled_up ? (
          <>
            <span className="skill-xp-levelup-text">
              {gain.display_name} LEVEL {gain.new_level}!
            </span>
            {gain.ability_unlocked && (
              <span className="skill-xp-ability">
                Unlocked: {gain.ability_unlocked}
              </span>
            )}
          </>
        ) : (
          <span className="skill-xp-text">
            {gain.display_name} <span className="skill-xp-amount">+{gain.xp_gained} XP</span>
          </span>
        )}
      </div>
    </div>
  );
}

interface SkillXPToastContainerProps {
  toasts: SkillXPGain[];
  onDismiss: (index: number) => void;
}

export function SkillXPToastContainer({ toasts, onDismiss }: SkillXPToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="skill-xp-toast-container">
      {toasts.map((toast, index) => (
        <SkillXPToast
          key={`${toast.skill_name}-${index}`}
          gain={toast}
          onDismiss={() => onDismiss(index)}
        />
      ))}
    </div>
  );
}
