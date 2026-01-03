"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { SkillsResponse, PlayerSkill, SkillCategory } from "@/lib/api";

interface SkillsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
  playerId: string | null;
}

const CATEGORY_CONFIG: Record<SkillCategory, { icon: string; label: string; color: string }> = {
  combat: { icon: "⚔", label: "COMBAT", color: "var(--crimson)" },
  magical: { icon: "✦", label: "MAGICAL", color: "#8b5cf6" },
  gathering: { icon: "⛏", label: "GATHER", color: "#22c55e" },
  crafting: { icon: "⚒", label: "CRAFT", color: "var(--amber)" },
  social: { icon: "☆", label: "SOCIAL", color: "var(--arcane)" },
  exploration: { icon: "◈", label: "EXPLOR", color: "#06b6d4" },
  knowledge: { icon: "◉", label: "KNOW", color: "#a855f7" },
  companion: { icon: "♦", label: "COMPAN", color: "#f472b6" },
  locomotion: { icon: "⇢", label: "MOVE", color: "#14b8a6" },
  professional: { icon: "◆", label: "PROF", color: "#eab308" },
};

const CATEGORY_ORDER: SkillCategory[] = [
  "combat", "magical", "gathering", "crafting", "social", "exploration", "knowledge", "companion", "locomotion", "professional"
];

const SKILL_ICONS: Record<string, string> = {
  melee: "┃",
  ranged: "→",
  defense: "◇",
  magic: "✦",
  mining: "⛏",
  woodcutting: "∥",
  fishing: "∿",
  herbalism: "❀",
  smithing: "⚒",
  alchemy: "⚗",
  cooking: "◎",
  enchanting: "✧",
  persuasion: "♡",
  deception: "◐",
  intimidation: "▲",
  performance: "♪",
  stealth: "◌",
  perception: "◉",
  survival: "☀",
  athletics: "⚡",
  lore: "▣",
  investigation: "?",
  medicine: "+",
  beast_mastery: "♦",
  taming: "◇",
};

function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const filledBlocks = Math.floor(percentage / 5);
  const emptyBlocks = 20 - filledBlocks;

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="text-[var(--amber)] font-bold w-8">L{level}</span>
      <div className="flex-1 flex items-center">
        <span className="text-[var(--slate)]">[</span>
        <span className="text-[var(--amber)]">{"▓".repeat(filledBlocks)}</span>
        <span className="text-[var(--stone)]">{"░".repeat(emptyBlocks)}</span>
        <span className="text-[var(--slate)]">]</span>
      </div>
      <span className="text-[var(--mist)] w-16 text-right text-[10px]">
        {current.toLocaleString()}/{max.toLocaleString()}
      </span>
    </div>
  );
}

function SkillRow({
  skill,
  selected,
  onClick,
  categoryColor,
}: {
  skill: PlayerSkill;
  selected: boolean;
  onClick: () => void;
  categoryColor: string;
}) {
  const hasAbilities = skill.unlocked_abilities.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 transition-all duration-150 font-mono text-sm
        ${selected
          ? "bg-[var(--stone)] border-l-2"
          : "border-l-2 border-transparent hover:bg-[var(--shadow)] hover:border-[var(--slate)]"
        }`}
      style={{ borderLeftColor: selected ? categoryColor : undefined }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: categoryColor }} className="w-4 text-center">
          {SKILL_ICONS[skill.skill_name] || "○"}
        </span>
        <span className="flex-1 text-[var(--fog)]">{skill.display_name}</span>
        {hasAbilities && (
          <span className="text-[var(--arcane)] text-[10px]">★{skill.unlocked_abilities.length}</span>
        )}
      </div>
      <div className="mt-1 pl-6">
        <XPBar current={skill.xp} max={skill.xp_to_next} level={skill.level} />
      </div>
    </button>
  );
}

function AbilityCard({ ability }: { ability: string }) {
  return (
    <div className="border border-[var(--slate)] bg-[var(--void)] px-2 py-1.5">
      <span className="text-[var(--amber)] font-bold text-xs">{ability}</span>
    </div>
  );
}

function SkillDetail({ skill }: { skill: PlayerSkill }) {
  const config = CATEGORY_CONFIG[skill.category];
  const percentage = skill.xp_to_next > 0
    ? Math.floor((skill.xp / skill.xp_to_next) * 100)
    : 100;

  // Calculate milestone progress (25, 50, 75, 99)
  const milestones = [25, 50, 75, 99];

  return (
    <div className="p-3 space-y-3 font-mono text-sm">
      {/* Skill Header */}
      <div className="border border-[var(--slate)] p-2 bg-[var(--void)]">
        <div className="flex items-center justify-center gap-2">
          <span style={{ color: config.color }} className="text-lg">
            {SKILL_ICONS[skill.skill_name] || "○"}
          </span>
          <span
            className="font-bold text-center"
            style={{ color: config.color }}
          >
            {skill.display_name.toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-[var(--mist)] text-center mt-1">
          [{config.label}]
        </div>
      </div>

      {/* Level Display */}
      <div className="border border-[var(--slate)] bg-[var(--shadow)] p-3 text-center">
        <div className="text-[var(--mist)] text-[10px] tracking-widest mb-1">LEVEL</div>
        <div
          className="text-3xl font-bold tracking-wider"
          style={{
            color: config.color,
            textShadow: `0 0 10px ${config.color}40`,
          }}
        >
          {skill.level}
        </div>
        <div className="text-[var(--mist)] text-[10px] mt-1">
          {percentage}% to next
        </div>
      </div>

      {/* XP Progress */}
      <div className="border border-[var(--slate)] bg-[var(--void)]">
        <div className="text-[10px] text-[var(--mist)] px-2 py-1 border-b border-[var(--slate)] bg-[var(--shadow)] tracking-widest">
          ┌─ EXPERIENCE ─┐
        </div>
        <div className="p-2">
          <div className="flex justify-between text-xs text-[var(--fog)] mb-1">
            <span>CURRENT</span>
            <span className="text-[var(--amber)]">{skill.xp.toLocaleString()} XP</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--fog)]">
            <span>TO NEXT</span>
            <span className="text-[var(--mist)]">{skill.xp_to_next.toLocaleString()} XP</span>
          </div>
          {/* Visual progress bar */}
          <div className="mt-2 h-2 bg-[var(--stone)] border border-[var(--slate)] relative overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: config.color,
                boxShadow: `0 0 8px ${config.color}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="border border-[var(--slate)] bg-[var(--void)]">
        <div className="text-[10px] text-[var(--mist)] px-2 py-1 border-b border-[var(--slate)] bg-[var(--shadow)] tracking-widest">
          ┌─ MILESTONES ─┐
        </div>
        <div className="p-2 flex justify-between">
          {milestones.map((m) => {
            const unlocked = skill.level >= m;
            return (
              <div key={m} className="text-center">
                <div
                  className={`w-8 h-8 border flex items-center justify-center text-xs font-bold ${
                    unlocked
                      ? "border-[var(--amber)] text-[var(--amber)] bg-[var(--shadow)]"
                      : "border-[var(--slate)] text-[var(--slate)]"
                  }`}
                  style={unlocked ? { boxShadow: "0 0 8px var(--amber)" } : undefined}
                >
                  {m}
                </div>
                <div className="text-[8px] text-[var(--mist)] mt-1">
                  {unlocked ? "✓" : "○"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Abilities */}
      {skill.unlocked_abilities.length > 0 && (
        <div className="border border-[var(--slate)] bg-[var(--void)]">
          <div className="text-[10px] text-[var(--mist)] px-2 py-1 border-b border-[var(--slate)] bg-[var(--shadow)] tracking-widest flex justify-between">
            <span>┌─ ABILITIES ─┐</span>
            <span className="text-[var(--arcane)]">★{skill.unlocked_abilities.length}</span>
          </div>
          <div className="p-2 space-y-2">
            {skill.unlocked_abilities.map((ability, idx) => (
              <AbilityCard key={idx} ability={ability} />
            ))}
          </div>
        </div>
      )}

      {skill.unlocked_abilities.length === 0 && skill.level < 25 && (
        <div className="text-center text-[var(--mist)] text-xs py-4 border border-dashed border-[var(--slate)]">
          <div className="text-[var(--arcane)] mb-1">★</div>
          First ability unlocks at LV.25
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  category,
  active,
  onClick,
  skillCount,
}: {
  category: SkillCategory;
  active: boolean;
  onClick: () => void;
  skillCount: number;
}) {
  const config = CATEGORY_CONFIG[category];

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1.5 text-left font-mono text-xs transition-all duration-150
        ${active
          ? "bg-[var(--stone)] border-r-2"
          : "hover:bg-[var(--shadow)] border-r-2 border-transparent"
        }`}
      style={{ borderRightColor: active ? config.color : undefined }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: config.color }}>{config.icon}</span>
        <span className={active ? "text-[var(--fog)]" : "text-[var(--mist)]"}>
          {config.label}
        </span>
        <span className="text-[var(--slate)] text-[10px] ml-auto">{skillCount}</span>
      </div>
    </button>
  );
}

export function SkillsPanel({ isOpen, onClose, worldId, playerId }: SkillsPanelProps) {
  const [skillsData, setSkillsData] = useState<SkillsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("combat");
  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill | null>(null);

  // Get skills by category from response
  const skillsByCategory = skillsData?.skills_by_category;
  const categorySkills = skillsByCategory?.[activeCategory] || [];

  // Fetch skills on open
  useEffect(() => {
    if (isOpen && worldId && playerId) {
      setLoading(true);
      setError(null);
      setSelectedSkill(null);
      setActiveCategory("combat");
      api
        .getSkills(worldId, playerId)
        .then((data) => {
          setSkillsData(data);
          // Select first skill in first category
          const combatSkills = data.skills_by_category?.combat || [];
          if (combatSkills.length > 0) {
            setSelectedSkill(combatSkills[0]);
          }
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, worldId, playerId]);

  // Update selected skill when category changes
  useEffect(() => {
    if (categorySkills.length > 0 && !categorySkills.find(s => s.skill_name === selectedSkill?.skill_name)) {
      setSelectedSkill(categorySkills[0]);
    }
  }, [activeCategory, categorySkills, selectedSkill?.skill_name]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!skillsData || !isOpen) return;

    if (e.key === "Escape") {
      onClose();
      return;
    }

    const currentCategoryIndex = CATEGORY_ORDER.indexOf(activeCategory);

    // Tab/Shift+Tab for category switching
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        const newIndex = currentCategoryIndex > 0 ? currentCategoryIndex - 1 : CATEGORY_ORDER.length - 1;
        setActiveCategory(CATEGORY_ORDER[newIndex]);
      } else {
        const newIndex = (currentCategoryIndex + 1) % CATEGORY_ORDER.length;
        setActiveCategory(CATEGORY_ORDER[newIndex]);
      }
      return;
    }

    // Arrow keys for skill selection within category
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      const currentIndex = categorySkills.findIndex(s => s.skill_name === selectedSkill?.skill_name);
      const newIndex = Math.min(currentIndex + 1, categorySkills.length - 1);
      setSelectedSkill(categorySkills[newIndex]);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      const currentIndex = categorySkills.findIndex(s => s.skill_name === selectedSkill?.skill_name);
      const newIndex = Math.max(currentIndex - 1, 0);
      setSelectedSkill(categorySkills[newIndex]);
    }
  }, [skillsData, isOpen, activeCategory, categorySkills, selectedSkill, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with scanlines */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          )`,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-[var(--void)] border-2 border-[var(--slate)] w-full max-w-3xl max-h-[80vh] flex flex-col font-mono shadow-2xl"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* CRT screen effect overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(255,255,255,0.1) 1px,
              rgba(255,255,255,0.1) 2px
            )`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-[var(--slate)] bg-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--amber)] font-bold tracking-wider">◈ SKILLS ◈</span>
            {skillsData && (
              <span className="text-[var(--mist)] text-xs">
                [TOTAL LV: <span className="text-[var(--amber)]">{skillsData.total_level}</span>]
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--mist)] text-xs hidden sm:block">
              TAB categories • ↑↓/jk select • ESC close
            </span>
            <button
              onClick={onClose}
              className="text-[var(--mist)] hover:text-[var(--crimson)] transition-colors font-bold"
            >
              [×]
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[var(--amber)] animate-pulse">◌ LOADING ◌</div>
            <div className="text-[var(--mist)] text-xs mt-2">Fetching skill data...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-[var(--crimson)]">⚠ ERROR</div>
            <div className="text-[var(--mist)] text-xs mt-2">{error}</div>
          </div>
        ) : !skillsData ? (
          <div className="p-8 text-center text-[var(--mist)]">No skill data</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Category Tabs */}
            <div className="w-24 border-r border-[var(--slate)] bg-[var(--shadow)] overflow-y-auto flex-shrink-0">
              <div className="py-1">
                {CATEGORY_ORDER.map((cat) => (
                  <CategoryTab
                    key={cat}
                    category={cat}
                    active={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                    skillCount={skillsByCategory?.[cat]?.length || 0}
                  />
                ))}
              </div>
            </div>

            {/* Middle: Skill List */}
            <div className="flex-1 overflow-y-auto border-r border-[var(--slate)]">
              <div className="p-2">
                <div className="text-[10px] text-[var(--mist)] mb-2 tracking-widest px-2 flex items-center gap-2">
                  <span style={{ color: CATEGORY_CONFIG[activeCategory].color }}>
                    {CATEGORY_CONFIG[activeCategory].icon}
                  </span>
                  <span>┌─ {CATEGORY_CONFIG[activeCategory].label} SKILLS ─┐</span>
                </div>
                {categorySkills.length === 0 ? (
                  <div className="text-[var(--mist)] text-sm py-8 text-center border border-dashed border-[var(--slate)]">
                    ∅ No skills in this category
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {categorySkills.map((skill) => (
                      <SkillRow
                        key={skill.skill_name}
                        skill={skill}
                        selected={selectedSkill?.skill_name === skill.skill_name}
                        onClick={() => setSelectedSkill(skill)}
                        categoryColor={CATEGORY_CONFIG[skill.category].color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Skill Detail */}
            <div className="w-72 bg-[var(--shadow)] overflow-y-auto flex-shrink-0">
              {selectedSkill ? (
                <SkillDetail skill={selectedSkill} />
              ) : (
                <div className="p-4 text-center text-[var(--mist)] text-xs h-full flex items-center justify-center">
                  <div>
                    <div className="text-2xl mb-2 opacity-30">◈</div>
                    <div>Select a skill</div>
                    <div>to view details</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-1.5 border-t-2 border-[var(--slate)] bg-[var(--shadow)] text-[10px] text-[var(--mist)] flex justify-between">
          <span>TEXTLANDS v1.0</span>
          <span>◈ SKILL SYSTEM ◈</span>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.9; filter: brightness(1.1); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
