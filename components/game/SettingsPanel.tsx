"use client";

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/lib/api";
import * as api from "@/lib/api";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDemo: boolean;
  nsfwEnabled: boolean;
  onNsfwToggle: (enabled: boolean) => void;
  nsfwVerified: boolean;
  onRequestAgeVerification: () => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  isDemo,
  nsfwEnabled,
  onNsfwToggle,
  nsfwVerified,
  onRequestAgeVerification,
}: SettingsPanelProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    show_reasoning: false,
    show_on_failure: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen && !isDemo) {
      api.getPreferences().then(setPreferences).catch(() => {
        // Use defaults on error
      });
    }
  }, [isOpen, isDemo]);

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    if (!isDemo) {
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="settings-panel w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--stone)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">SETTINGS</h2>
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
              Mechanics Display
            </h3>
            <p className="text-[var(--text-dim)] text-sm mb-4">
              Control when you see the underlying mechanics that determine action outcomes.
            </p>

            <div className="space-y-3">
              {/* Show Mechanics Toggle */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.show_reasoning}
                    onChange={(e) => updatePreference("show_reasoning", e.target.checked)}
                    disabled={loading || isDemo}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--arcane)] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="text-[var(--text)] font-medium group-hover:text-[var(--amber)] transition-colors">
                    Show Mechanics
                  </div>
                  <div className="text-[var(--text-dim)] text-sm">
                    Display success chances, factors, and outcomes for all actions
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
                    disabled={loading || isDemo || preferences.show_reasoning}
                    className="sr-only peer"
                  />
                  <div className={`w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--arcane)] transition-colors ${preferences.show_reasoning ? "opacity-50" : ""}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform ${preferences.show_reasoning ? "opacity-50" : ""}`} />
                </div>
                <div className="flex-1">
                  <div className={`text-[var(--text)] font-medium group-hover:text-[var(--amber)] transition-colors ${preferences.show_reasoning ? "opacity-50" : ""}`}>
                    Show on Failure Only
                  </div>
                  <div className={`text-[var(--text-dim)] text-sm ${preferences.show_reasoning ? "opacity-50" : ""}`}>
                    Only reveal mechanics when actions fail
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Content Section */}
          <div>
            <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
              <span className="text-[var(--crimson)]">*</span>
              Content
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
                    Adult Content (18+)
                  </div>
                  <div className="text-[var(--text-dim)] text-sm">
                    Show mature realms and allow explicit content in all worlds
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Demo Mode Notice */}
          {isDemo && (
            <div className="p-3 rounded border border-[var(--crimson)]/30 bg-[var(--crimson)]/5">
              <p className="text-[var(--crimson)] text-sm">
                Settings are not saved in demo mode. Connect to the server to save preferences.
              </p>
            </div>
          )}

          {/* Saved indicator */}
          {saved && (
            <div className="text-[var(--arcane)] text-sm text-center animate-fade-in">
              Preferences saved
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--stone)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
