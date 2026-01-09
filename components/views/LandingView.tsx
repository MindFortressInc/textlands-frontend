"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUIStrings } from "@/contexts/UIStringsContext";
import { ThemePicker } from "@/components/ThemePicker";
import { ThemeChooser, hasChosenTheme } from "@/components/ThemeChooser";
import { UI, calcDropdownPosition, type DropdownDirection } from "@/lib/ui-config";
import type { RosterCharacter } from "@/lib/api";

interface LandingViewProps {
  onEnter: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onResumeCharacter: (char: RosterCharacter) => void;
  isLoggedIn: boolean;
  roster: RosterCharacter[];
  loadingRoster: boolean;
}

export function LandingView({ onEnter, onLogin, onLogout, onResumeCharacter, isLoggedIn, roster, loadingRoster }: LandingViewProps) {
  const { t } = useUIStrings();
  const [selectedChar, setSelectedChar] = useState<RosterCharacter | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showThemeChooser, setShowThemeChooser] = useState(false);
  const [openDirection, setOpenDirection] = useState<DropdownDirection>("down");
  const [maxDropdownHeight, setMaxDropdownHeight] = useState<number>(UI.dropdown.characterPickerMaxHeight);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter to active characters only
  const activeChars = roster.filter(c => c.status === "active");

  // Has characters = logged in with at least one character
  const hasCharacters = isLoggedIn && activeChars.length > 0;

  // Auto-select first character
  useEffect(() => {
    if (hasCharacters && !selectedChar && activeChars.length > 0) {
      setSelectedChar(activeChars[0]);
    }
  }, [hasCharacters, activeChars, selectedChar]);

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

  // Handle "Create new character" - show theme chooser for first-time users
  const handleCreateNew = () => {
    if (!hasChosenTheme()) {
      setShowThemeChooser(true);
    } else {
      onEnter();
    }
  };

  // Theme chooser completed - continue to world browser
  const handleThemeChosen = () => {
    setShowThemeChooser(false);
    onEnter();
  };

  // Show theme chooser overlay
  if (showThemeChooser) {
    return <ThemeChooser onComplete={handleThemeChosen} />;
  }

  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-atmospheric p-4 pt-[max(1rem,env(safe-area-inset-top))] animate-fade-in">
      {/* Decorative top line */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />

      <div className="text-center space-y-8 max-w-md corner-brackets p-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="text-[var(--mist)] text-[10px] tracking-[0.5em] uppercase">
            {hasCharacters ? t("welcome_back", "Welcome back to") : t("welcome_to", "Welcome to")}
          </div>
          <h1 className="text-[var(--amber)] text-3xl md:text-5xl font-bold tracking-[0.2em] title-glow">
            TEXTLANDS
          </h1>
          <div className="text-[var(--mist)] text-[10px] tracking-[0.3em] uppercase">Est. 2025</div>
        </div>

        {/* Tagline */}
        <p className="text-[var(--text-dim)] text-sm md:text-base italic">
          {t("tagline", "Choose your land. Become your character.")}
        </p>

        {/* LOGGED IN WITH CHARACTERS */}
        {hasCharacters ? (
          <div className="space-y-4">
            {/* Character selector - dropdown if 2+, inline if 1 */}
            {activeChars.length > 1 ? (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={handleTogglePicker}
                  className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded text-left hover:border-[var(--amber-dim)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      {selectedChar ? (
                        <div>
                          <span className="text-[var(--amber)] font-bold">{selectedChar.character_name}</span>
                          {selectedChar.occupation && (
                            <span className="text-[var(--mist)] text-xs ml-2">({selectedChar.occupation})</span>
                          )}
                          <span className="text-[var(--text-dim)] text-xs block">{selectedChar.world_name}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--mist)]">{t("select_character", "Select a character...")}</span>
                      )}
                    </div>
                    <span className="text-[var(--mist)]">{showPicker ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Dropdown */}
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
                        className={`w-full px-4 py-3 text-left hover:bg-[var(--stone)] transition-colors border-b border-[var(--slate)] last:border-b-0 ${
                          selectedChar?.id === char.id ? "bg-[var(--stone)]" : ""
                        }`}
                      >
                        <span className="text-[var(--amber)] font-bold">{char.character_name}</span>
                        {char.occupation && (
                          <span className="text-[var(--mist)] text-xs ml-1">({char.occupation})</span>
                        )}
                        <span className="text-[var(--text-dim)] text-xs block">{char.world_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Primary CTA: Continue with [character name] */}
            <button
              onClick={() => selectedChar && onResumeCharacter(selectedChar)}
              disabled={!selectedChar}
              className="group relative w-full px-10 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[52px] bg-[var(--shadow)] border border-[var(--amber-dim)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95 disabled:opacity-50"
            >
              <span className="relative z-10">
                {selectedChar ? `Continue with ${selectedChar.character_name}` : t("continue_journey", "Continue Journey")}
              </span>
              <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>

            {/* Secondary actions */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={handleCreateNew}
                className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
              >
                {t("create_new_character", "Create new character")}
              </button>
              <span className="text-[var(--slate)]">·</span>
              <button
                onClick={onLogout}
                className="text-[var(--mist)] hover:text-[var(--crimson)] transition-colors"
              >
                {t("log_out", "Log out")}
              </button>
            </div>
          </div>
        ) : isLoggedIn ? (
          /* LOGGED IN BUT NO CHARACTERS */
          <div className="space-y-4">
            <button
              onClick={handleCreateNew}
              className="group relative w-full px-10 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[52px] bg-[var(--shadow)] border border-[var(--amber-dim)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
            >
              <span className="relative z-10">
                {t("begin_adventure", "Begin Your Journey")}
              </span>
              <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
            <div className="flex items-center justify-center">
              <button
                onClick={onLogout}
                className="text-[var(--mist)] text-sm hover:text-[var(--crimson)] transition-colors"
              >
                {t("log_out", "Log out")}
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN */
          <>
            <button
              onClick={handleCreateNew}
              className="group relative px-10 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[52px] bg-[var(--shadow)] border border-[var(--slate)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
            >
              <span className="relative z-10">
                {t("begin_adventure", "Begin Your Journey")}
              </span>
              <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>

            <div className="pt-2">
              <button
                onClick={onLogin}
                className="text-[var(--mist)] text-sm hover:text-[var(--amber)] transition-colors"
              >
                {t("have_account", "Already playing?")} <span className="underline">{t("log_in")}</span>
              </button>
            </div>
          </>
        )}

        {/* Decorative text */}
        <div className="text-[var(--slate)] text-[10px] tracking-widest pt-2">
          {t("enter_the_lands", "ENTER THE LANDS")}
        </div>
      </div>

      {/* Nav links */}
      <div className="absolute bottom-[calc(3rem+env(safe-area-inset-bottom))] left-4 flex gap-4">
        <Link
          href="/hiscores"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] active:text-[var(--amber)] transition-colors min-h-[44px] flex items-center"
        >
          {t("hiscores")}
        </Link>
        <Link
          href="/recover"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] active:text-[var(--amber)] transition-colors min-h-[44px] flex items-center"
        >
          {t("lost_journey")}
        </Link>
      </div>

      {/* Theme picker */}
      <div className="absolute bottom-[calc(3rem+env(safe-area-inset-bottom))] right-4">
        <ThemePicker />
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />
    </main>
  );
}
