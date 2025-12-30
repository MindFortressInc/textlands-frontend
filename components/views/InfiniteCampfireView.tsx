"use client";

import { useState } from "react";
import { useUIStrings } from "@/contexts/UIStringsContext";
import { ThemePicker } from "@/components/ThemePicker";
import type { InfiniteCampfireResponse, InfiniteCampfireCharacter } from "@/types/game";

interface InfiniteCampfireViewProps {
  campfire: InfiniteCampfireResponse;
  onSelect: (character: InfiniteCampfireCharacter) => void;
  onBack: () => void;
  loading: boolean;
  onCreateOwn?: () => void;
}

export function InfiniteCampfireView({ campfire, onSelect, onBack, loading, onCreateOwn }: InfiniteCampfireViewProps) {
  const { t } = useUIStrings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> {t("back", "Back")}
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">{campfire.page_title || campfire.world_name}</span>
          {campfire.page_subtitle && (
            <div className="text-[var(--mist)] text-[10px] tracking-widest">{campfire.page_subtitle}</div>
          )}
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Intro narrative */}
        <div className="p-6 border-b border-[var(--slate)] bg-gradient-to-b from-[var(--shadow)] to-transparent">
          <div className="max-w-2xl mx-auto">
            <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap text-sm md:text-base text-center">
              {campfire.intro_text}
            </p>
          </div>
        </div>

        {/* Character selection */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-5xl mx-auto">
            {campfire.characters.length === 0 && !onCreateOwn ? (
              <div className="text-center py-8">
                <p className="text-[var(--mist)]">{t("no_characters_available")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-fade-in">
                {campfire.characters.filter(c => c.is_playable).map((char) => {
                  const isExpanded = expandedId === char.id;
                  const needsExpand = (char.physical_summary && char.physical_summary.length > 100) ||
                                      (char.backstory_hook && char.backstory_hook.length > 80);

                  return (
                    <div
                      key={char.id}
                      className="character-card w-full p-5 text-left group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Character portrait placeholder */}
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--slate)] to-[var(--stone)] flex items-center justify-center text-[var(--amber)] text-2xl shrink-0 group-hover:from-[var(--amber-dim)] group-hover:to-[var(--slate)] transition-all">
                          {char.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[var(--amber)] font-bold text-lg">{char.name}</span>
                            {char.occupation && (
                              <span className="text-[var(--arcane)] text-[10px] tracking-wider uppercase shrink-0 mt-1">
                                {char.occupation}
                              </span>
                            )}
                          </div>
                          <p className={`text-[var(--text-dim)] text-sm mb-2 ${isExpanded ? "" : "line-clamp-2"}`}>
                            {char.physical_summary}
                          </p>
                          {char.backstory_hook && (
                            <p className={`text-[var(--mist)] text-xs italic ${isExpanded ? "" : "line-clamp-2"}`}>
                              {char.backstory_hook}
                            </p>
                          )}
                          {needsExpand && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(isExpanded ? null : char.id);
                              }}
                              className="text-[var(--amber-dim)] text-xs mt-1 hover:text-[var(--amber)] transition-colors"
                            >
                              {isExpanded ? t("show_less", "Show less") : t("show_more", "Show more...")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Footer with personality and select button */}
                      <div className="mt-3 pt-3 border-t border-[var(--slate)] flex items-center justify-between">
                        {char.personality_summary && (
                          <span className="text-[var(--mist)] text-[10px] tracking-wider uppercase">
                            {char.personality_summary}
                          </span>
                        )}
                        <button
                          onClick={() => onSelect(char)}
                          disabled={loading}
                          className="ml-auto px-4 py-1.5 text-[var(--amber)] text-sm font-bold border border-[var(--amber-dim)] rounded hover:bg-[var(--amber-dim)] hover:text-[var(--bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t("play", "Play")} →
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Create Your Own - at bottom for advanced users */}
                {onCreateOwn && (
                  <button
                    onClick={onCreateOwn}
                    disabled={loading}
                    className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed group border-dashed md:col-span-2"
                  >
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed border-[var(--slate)] flex items-center justify-center text-[var(--mist)] text-2xl group-hover:border-[var(--amber-dim)] group-hover:text-[var(--amber)] transition-colors">
                        +
                      </div>
                      <div>
                        <span className="text-[var(--mist)] font-bold group-hover:text-[var(--amber)] transition-colors">{t("create_your_own")}</span>
                        <p className="text-[var(--text-dim)] text-sm">{t("describe_character_concept")}</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
