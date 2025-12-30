"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useUIStrings } from "@/contexts/UIStringsContext";
import { ThemePicker } from "@/components/ThemePicker";
import { UI, calcDropdownPosition, type DropdownDirection } from "@/lib/ui-config";
import type { RosterCharacter } from "@/lib/api";

interface LandingViewProps {
  onEnter: () => void;
  onLogin: () => void;
  onResumeCharacter: (char: RosterCharacter) => void;
  isLoggedIn: boolean;
  roster: RosterCharacter[];
  loadingRoster: boolean;
}

export function LandingView({ onEnter, onLogin, onResumeCharacter, isLoggedIn, roster, loadingRoster }: LandingViewProps) {
  const { t } = useUIStrings();
  const [selectedChar, setSelectedChar] = useState<RosterCharacter | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [openDirection, setOpenDirection] = useState<DropdownDirection>("down");
  const [maxDropdownHeight, setMaxDropdownHeight] = useState<number>(UI.dropdown.characterPickerMaxHeight);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter to active characters only
  const activeChars = roster.filter(c => c.status === "active");

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
          <div className="text-[var(--mist)] text-[10px] tracking-[0.5em] uppercase">{t("welcome_to", "Welcome to")}</div>
          <h1 className="text-[var(--amber)] text-3xl md:text-5xl font-bold tracking-[0.2em] title-glow">
            TEXTLANDS
          </h1>
          <div className="text-[var(--mist)] text-[10px] tracking-[0.3em] uppercase">Est. MMXXV</div>
        </div>

        {/* Tagline */}
        <p className="text-[var(--text-dim)] text-sm md:text-base italic">
          {t("tagline", "Choose your land. Become your character.")}
        </p>

        {/* Character picker for logged-in users with characters */}
        {isLoggedIn && activeChars.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={handleTogglePicker}
                className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded text-left hover:border-[var(--amber-dim)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    {selectedChar ? (
                      <>
                        <span className="text-[var(--amber)] font-bold">{selectedChar.character_name}</span>
                        <span className="text-[var(--mist)] text-xs ml-2">in {selectedChar.world_name}</span>
                      </>
                    ) : (
                      <span className="text-[var(--mist)]">{t("select_character", "Select a character...")}</span>
                    )}
                  </div>
                  <span className="text-[var(--mist)]">{showPicker ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Dropdown - dynamic direction based on available space */}
              {showPicker && (
                <div
                  className={`absolute left-0 right-0 bg-[var(--shadow)] border border-[var(--slate)] rounded overflow-y-auto z-10 ${
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
                      className="w-full px-4 py-2 text-left hover:bg-[var(--stone)] transition-colors border-b border-[var(--slate)] last:border-b-0"
                    >
                      <span className="text-[var(--amber)]">{char.character_name}</span>
                      {char.occupation && (
                        <span className="text-[var(--mist)] text-xs ml-1">({char.occupation})</span>
                      )}
                      <span className="text-[var(--text-dim)] text-xs block">{char.world_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Resume button */}
            {selectedChar && (
              <button
                onClick={() => onResumeCharacter(selectedChar)}
                className="group relative w-full px-6 py-3 text-[var(--amber)] font-bold bg-[var(--shadow)] border border-[var(--amber-dim)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
              >
                {t("continue_as", "Continue as")} {selectedChar.character_name}
              </button>
            )}

            <div className="text-[var(--slate)] text-[10px]">— or —</div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onEnter}
          className="group relative px-10 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[52px] bg-[var(--shadow)] border border-[var(--slate)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
        >
          <span className="relative z-10">
            {isLoggedIn && activeChars.length > 0 ? t("new_character", "New Character") : t("begin_adventure", "Begin Your Journey")}
          </span>
          <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>

        {/* Decorative text */}
        <div className="text-[var(--slate)] text-[10px] tracking-widest">
          {t("enter_the_lands", "ENTER THE LANDS")}
        </div>
      </div>

      {/* Nav links */}
      <div className="absolute bottom-4 left-4 pb-[env(safe-area-inset-bottom)] flex gap-4">
        {isLoggedIn ? (
          <Link
            href="/characters"
            className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
          >
            {loadingRoster ? t("loading") : `${activeChars.length} ${t("n_characters")}`}
          </Link>
        ) : (
          <button
            onClick={onLogin}
            className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
          >
            {t("log_in")}
          </button>
        )}
        <Link
          href="/hiscores"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
        >
          {t("hiscores")}
        </Link>
        <Link
          href="/recover"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
        >
          {t("lost_journey")}
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
