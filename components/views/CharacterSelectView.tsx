"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUIStrings } from "@/contexts/UIStringsContext";
import { ThemePicker } from "@/components/ThemePicker";
import { UI, calcDropdownPosition, type DropdownDirection } from "@/lib/ui-config";
import type { RosterCharacter } from "@/lib/api";

interface CharacterSelectViewProps {
  roster: RosterCharacter[];
  onSelect: (char: RosterCharacter) => void;
  onNewCharacter: () => void;
  loadingRoster: boolean;
}

export function CharacterSelectView({ roster, onSelect, onNewCharacter, loadingRoster }: CharacterSelectViewProps) {
  const { t } = useUIStrings();
  const [selectedChar, setSelectedChar] = useState<RosterCharacter | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [openDirection, setOpenDirection] = useState<DropdownDirection>("up");
  const [maxDropdownHeight, setMaxDropdownHeight] = useState<number>(UI.dropdown.characterPickerMaxHeight);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter to active characters only
  const activeChars = roster.filter(c => c.status === "active");

  // Auto-select first character if none selected
  useEffect(() => {
    if (!selectedChar && activeChars.length > 0) {
      setSelectedChar(activeChars[0]);
    }
  }, [activeChars, selectedChar]);

  // Calculate dropdown direction and max height when opening
  const handleTogglePicker = () => {
    if (!showPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pos = calcDropdownPosition(rect, { maxHeight: UI.dropdown.characterPickerMaxHeight });
      setOpenDirection(pos.direction);
      setMaxDropdownHeight(pos.maxHeight);
    }
    setShowPicker(!showPicker);
  };

  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-atmospheric p-4 pt-[max(1rem,env(safe-area-inset-top))] animate-fade-in">
      {/* Decorative top line */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />

      <div className="text-center space-y-8 max-w-md corner-brackets p-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-[var(--amber)] text-3xl md:text-4xl font-bold tracking-[0.2em] title-glow">
            TEXTLANDS
          </h1>
          <div className="text-[var(--mist)] text-sm">{t("choose_your_character")}</div>
        </div>

        {/* Character picker */}
        {loadingRoster ? (
          <div className="text-[var(--mist)] text-sm animate-pulse">{t("loading_characters")}</div>
        ) : (
          <div className="space-y-4">
            {/* Character dropdown */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={handleTogglePicker}
                className="w-full px-4 py-4 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-left hover:border-[var(--amber-dim)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    {selectedChar ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--amber)] font-bold text-lg">{selectedChar.character_name}</span>
                          {selectedChar.occupation && (
                            <span className="text-[var(--mist)] text-xs">({selectedChar.occupation})</span>
                          )}
                        </div>
                        <span className="text-[var(--text-dim)] text-sm">{selectedChar.world_name}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--mist)]">{t("select_character")}</span>
                    )}
                  </div>
                  <span className="text-[var(--mist)] text-lg">{showPicker ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Dropdown - dynamic direction based on available space */}
              {showPicker && (
                <div
                  className={`absolute left-0 right-0 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg overflow-y-auto z-10 ${
                    openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
                  }`}
                  style={{ maxHeight: maxDropdownHeight }}
                >
                  {activeChars.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedChar(char);
                        setShowPicker(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[var(--stone)] transition-colors border-b border-[var(--slate)] last:border-b-0 ${
                        selectedChar?.id === char.id ? "bg-[var(--stone)]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--amber)] font-bold">{char.character_name}</span>
                        {char.occupation && (
                          <span className="text-[var(--mist)] text-xs">({char.occupation})</span>
                        )}
                      </div>
                      <span className="text-[var(--text-dim)] text-xs">{char.world_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Enter button */}
            <button
              onClick={() => selectedChar && onSelect(selectedChar)}
              disabled={!selectedChar}
              className="group relative w-full px-8 py-4 text-[var(--amber)] font-bold text-lg bg-[var(--shadow)] border border-[var(--amber-dim)] rounded-lg transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">{t("enter")}</span>
              <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--slate)]" />
              <span className="text-[var(--slate)] text-xs">or</span>
              <div className="flex-1 h-px bg-[var(--slate)]" />
            </div>

            {/* New Character button */}
            <button
              onClick={onNewCharacter}
              className="w-full px-6 py-3 text-[var(--mist)] text-sm bg-transparent border border-[var(--slate)] rounded-lg transition-colors hover:text-[var(--text)] hover:border-[var(--amber-dim)]"
            >
              {t("create_new_character")}
            </button>
          </div>
        )}
      </div>

      {/* Bottom links */}
      <div className="absolute bottom-4 left-4 pb-[env(safe-area-inset-bottom)] flex gap-4">
        <Link
          href="/characters"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
        >
          {t("manage_characters")}
        </Link>
        <Link
          href="/hiscores"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
        >
          {t("hiscores")}
        </Link>
      </div>

      {/* Theme picker */}
      <div className="absolute bottom-4 right-4 pb-[env(safe-area-inset-bottom)]">
        <ThemePicker />
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />
    </main>
  );
}
