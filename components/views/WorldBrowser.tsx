"use client";

import { useUIStrings } from "@/contexts/UIStringsContext";
import { ThemePicker } from "@/components/ThemePicker";
import type { LandGroup } from "@/lib/api";
import type { InfiniteWorld } from "@/types/game";

interface WorldBrowserProps {
  landGroups: LandGroup[];
  onSelect: (world: InfiniteWorld) => void;
  onBack: () => void;
  nsfwEnabled: boolean;
  nsfwAutoBlocked?: boolean;
  onRequestNsfw: () => void;
}

export function WorldBrowser({ landGroups, onSelect, onBack, nsfwEnabled, nsfwAutoBlocked, onRequestNsfw }: WorldBrowserProps) {
  const { t } = useUIStrings();

  // Separate SFW and locked/NSFW lands
  const sfwLands = landGroups.filter(g => !g.is_locked);
  const nsfwLands = landGroups.filter(g => g.is_locked);

  // Select a land → auto-pick first realm (backend will place them appropriately)
  const handleLandSelect = (group: LandGroup) => {
    if (group.realms.length > 0) {
      onSelect(group.realms[0]);
    }
  };

  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> {t("back", "Back")}
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">{t("choose_your_land", "CHOOSE YOUR LAND")}</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">{sfwLands.length} {t("lands_available", "LANDS AVAILABLE")}</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-fade-in">
            {/* SFW Lands */}
            {sfwLands.map((group) => (
              <button
                key={group.land}
                onClick={() => handleLandSelect(group)}
                className="w-full p-4 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-left hover:border-[var(--amber-dim)] hover:bg-[var(--void)] transition-colors"
              >
                <span className="text-[var(--amber)] font-bold block mb-1">{group.display_name}</span>
                <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{group.description}</p>
              </button>
            ))}

            {/* NSFW/Locked Lands */}
            {nsfwLands.length > 0 && (
              <>
                {nsfwEnabled ? (
                  // Show NSFW lands when unlocked
                  nsfwLands.map((group) => (
                    <button
                      key={group.land}
                      onClick={() => handleLandSelect(group)}
                      className="w-full p-4 bg-[var(--shadow)] border border-[var(--crimson)]/30 rounded-lg text-left hover:border-[var(--crimson)] hover:bg-[var(--void)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[var(--amber)] font-bold">{group.display_name}</span>
                        <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                      </div>
                      <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{group.description}</p>
                    </button>
                  ))
                ) : nsfwAutoBlocked ? (
                  // Auto-blocked after 3 rejections
                  <div className="w-full p-4 bg-[var(--shadow)] border border-[var(--stone)] rounded-lg flex items-start gap-3 opacity-40">
                    <span className="text-xl leading-none mt-0.5">🚫</span>
                    <div className="text-left">
                      <span className="text-[var(--mist)] font-bold block">{t("adults_only", "Adults Only")}</span>
                      <span className="text-[var(--slate)] text-xs">{nsfwLands.length} {t("lands_blocked", "lands · Blocked (enable in Settings)")}</span>
                    </div>
                  </div>
                ) : (
                  // Locked NSFW section - tap to verify
                  <button
                    onClick={onRequestNsfw}
                    className="w-full p-4 bg-[var(--shadow)] border border-[var(--stone)] rounded-lg flex items-start gap-3 hover:border-[var(--mist)] transition-colors opacity-60"
                  >
                    <span className="text-xl leading-none mt-0.5">🔒</span>
                    <div className="text-left">
                      <span className="text-[var(--mist)] font-bold block">{t("adults_only", "Adults Only")}</span>
                      <span className="text-[var(--slate)] text-xs">{nsfwLands.length} {t("lands_verify_age", "lands · Tap to verify age")}</span>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
