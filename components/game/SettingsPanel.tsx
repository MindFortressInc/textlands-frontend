"use client";

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/lib/api";
import * as api from "@/lib/api";
import { useUIStrings } from "@/contexts/UIStringsContext";
import { ContentSettingsPanel } from "./ContentSettingsPanel";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nsfwEnabled: boolean;
  onNsfwToggle: (enabled: boolean) => void;
  nsfwVerified: boolean;
  onRequestAgeVerification: () => void;
  playerId?: string | null;
}

export function SettingsPanel({
  isOpen,
  onClose,
  nsfwEnabled,
  onNsfwToggle,
  nsfwVerified,
  onRequestAgeVerification,
  playerId,
}: SettingsPanelProps) {
  const { t } = useUIStrings();
  const [preferences, setPreferences] = useState<UserPreferences>({
    show_reasoning: false,
    show_on_failure: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contentSettingsOpen, setContentSettingsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getPreferences().then(setPreferences).catch(() => {
        // Use defaults on error
      });
    }
  }, [isOpen]);

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    setLoading(true);
    try {
      await api.updatePreferences({ [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // Revert on error
      setPreferences(preferences);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="settings-panel w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--stone)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">{t("settings").toUpperCase()}</h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Mechanics Section */}
          <div>
            <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
              <span className="text-[var(--arcane)]">*</span>
              {t("mechanics_display")}
            </h3>
            <p className="text-[var(--text-dim)] text-sm mb-4">
              {t("mechanics_display_desc")}
            </p>

            <div className="space-y-3">
              {/* Show Mechanics Toggle */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.show_reasoning}
                    onChange={(e) => updatePreference("show_reasoning", e.target.checked)}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--arcane)] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="text-[var(--text)] font-medium group-hover:text-[var(--amber)] transition-colors">
                    {t("show_mechanics")}
                  </div>
                  <div className="text-[var(--text-dim)] text-sm">
                    {t("show_mechanics_desc")}
                  </div>
                </div>
              </label>

              {/* Show on Failure Toggle */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.show_on_failure}
                    onChange={(e) => updatePreference("show_on_failure", e.target.checked)}
                    disabled={loading || preferences.show_reasoning}
                    className="sr-only peer"
                  />
                  <div className={`w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--arcane)] transition-colors ${preferences.show_reasoning ? "opacity-50" : ""}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform ${preferences.show_reasoning ? "opacity-50" : ""}`} />
                </div>
                <div className="flex-1">
                  <div className={`text-[var(--text)] font-medium group-hover:text-[var(--amber)] transition-colors ${preferences.show_reasoning ? "opacity-50" : ""}`}>
                    {t("show_on_failure_only")}
                  </div>
                  <div className={`text-[var(--text-dim)] text-sm ${preferences.show_reasoning ? "opacity-50" : ""}`}>
                    {t("show_on_failure_desc")}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Content Section */}
          <div>
            <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
              <span className="text-[var(--crimson)]">*</span>
              {t("content")}
            </h3>

            <div className="space-y-3">
              {/* NSFW Toggle */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={nsfwEnabled}
                    onChange={(e) => {
                      if (e.target.checked && !nsfwVerified) {
                        // Need age verification first
                        onRequestAgeVerification();
                      } else {
                        onNsfwToggle(e.target.checked);
                      }
                    }}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--crimson)] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="text-[var(--text)] font-medium group-hover:text-[var(--amber)] transition-colors">
                    {t("adult_content_18")}
                  </div>
                  <div className="text-[var(--text-dim)] text-sm">
                    {t("adult_content_desc")}
                  </div>
                </div>
              </label>

              {/* Content Intensity Button */}
              {nsfwEnabled && (
                <button
                  onClick={() => setContentSettingsOpen(true)}
                  className="w-full mt-3 px-4 py-3 bg-[var(--shadow)] border border-[var(--stone)] hover:border-[var(--crimson)] hover:bg-[var(--stone)] transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[var(--text)] font-medium group-hover:text-[var(--crimson)] transition-colors text-sm">
                        {t("content_intensity") || "Content Intensity"}
                      </div>
                      <div className="text-[var(--text-dim)] text-xs mt-0.5">
                        {t("content_intensity_desc") || "Spicy level, triggers, preferences"}
                      </div>
                    </div>
                    <span className="text-[var(--mist)] group-hover:text-[var(--crimson)] transition-colors">
                      &rarr;
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Saved indicator */}
          {saved && (
            <div className="text-[var(--arcane)] text-sm text-center animate-fade-in">
              {t("preferences_saved")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--stone)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>

      {/* Content Settings Sub-Panel */}
      <ContentSettingsPanel
        playerId={playerId ?? null}
        nsfwEnabled={nsfwEnabled}
        isOpen={contentSettingsOpen}
        onClose={() => setContentSettingsOpen(false)}
      />
    </div>
  );
}
