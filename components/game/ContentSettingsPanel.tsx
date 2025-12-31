"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContentTrigger, PlayerContentSettings, DiscoveredDesire } from "@/lib/api";
import * as api from "@/lib/api";

interface ContentSettingsPanelProps {
  playerId: string | null;
  nsfwEnabled: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const SPICY_LEVELS = [
  { level: 1, name: "Vanilla", desc: "Clean romance, fade to black" },
  { level: 2, name: "Mild", desc: "Kissing, action violence" },
  { level: 3, name: "Medium", desc: "Sensual scenes, dark themes" },
  { level: 4, name: "Hot", desc: "Explicit, gore, heavy themes" },
  { level: 5, name: "No Limits", desc: "Anything goes" },
];

const TRIGGER_OPTIONS: { id: ContentTrigger; label: string; desc: string }[] = [
  { id: "sexual_violence", label: "Sexual Violence", desc: "Non-consensual scenarios" },
  { id: "gore_torture", label: "Gore/Torture", desc: "Extreme violence" },
  { id: "self_harm", label: "Self-Harm", desc: "Suicide, self-destruction" },
  { id: "child_harm", label: "Child Harm", desc: "Minors in danger" },
  { id: "animal_harm", label: "Animal Harm", desc: "Violence against animals" },
  { id: "body_horror", label: "Body Horror", desc: "Grotesque transformation" },
  { id: "addiction", label: "Addiction", desc: "Substance abuse themes" },
  { id: "infidelity", label: "Infidelity", desc: "Cheating storylines" },
  { id: "love_triangles", label: "Love Triangles", desc: "Multi-person conflict" },
];

export function ContentSettingsPanel({
  playerId,
  nsfwEnabled,
  isOpen,
  onClose,
}: ContentSettingsPanelProps) {
  const [settings, setSettings] = useState<PlayerContentSettings>({
    spicy_level: 3,
    blocked_triggers: [],
    sensitive_content_shield: true,
  });
  const [desires, setDesires] = useState<DiscoveredDesire[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings when panel opens
  useEffect(() => {
    if (isOpen && playerId) {
      setLoading(true);
      Promise.all([
        api.getPlayerContentSettings(playerId).catch(() => settings),
        api.getPlayerDesires(playerId).catch(() => ({ desires: [], discovery_count: 0 })),
      ])
        .then(([contentSettings, desiresResponse]) => {
          setSettings(contentSettings);
          setDesires(desiresResponse.desires);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, playerId]);

  const saveSettings = useCallback(
    async (newSettings: Partial<PlayerContentSettings>) => {
      if (!playerId) return;
      setSaving(true);
      try {
        const updated = await api.updatePlayerContentSettings(playerId, newSettings);
        setSettings(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        // Silently fail - settings revert
      }
      setSaving(false);
    },
    [playerId]
  );

  const handleSpicyChange = (level: number) => {
    const newSettings = { ...settings, spicy_level: level };
    setSettings(newSettings);
    saveSettings({ spicy_level: level });
  };

  const handleTriggerToggle = (trigger: ContentTrigger) => {
    const isBlocked = settings.blocked_triggers.includes(trigger);
    const newBlocked = isBlocked
      ? settings.blocked_triggers.filter((t) => t !== trigger)
      : [...settings.blocked_triggers, trigger];
    const newSettings = { ...settings, blocked_triggers: newBlocked };
    setSettings(newSettings);
    saveSettings({ blocked_triggers: newBlocked });
  };

  if (!isOpen) return null;

  const currentLevel = SPICY_LEVELS.find((l) => l.level === settings.spicy_level) || SPICY_LEVELS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="content-settings-panel w-full max-w-lg bg-[var(--void)] border border-[var(--slate)] overflow-hidden relative">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--crimson)]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[var(--crimson)]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[var(--crimson)]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--crimson)]" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--stone)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--crimson)] text-lg">*</span>
            <h2 className="text-[var(--text)] font-bold tracking-widest text-sm">
              CONTENT INTENSITY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors w-6 h-6 flex items-center justify-center"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-[var(--mist)]">Loading...</div>
          ) : (
            <div className="p-4 space-y-6">
              {/* NSFW Required Notice */}
              {!nsfwEnabled && (
                <div className="p-3 bg-[var(--stone)] border border-[var(--slate)] text-sm">
                  <span className="text-[var(--amber)]">*</span>
                  <span className="text-[var(--text-dim)] ml-2">
                    Enable 18+ mode in Settings to access content controls
                  </span>
                </div>
              )}

              {/* Spicy Level Slider */}
              <div className={!nsfwEnabled ? "opacity-40 pointer-events-none" : ""}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[var(--text)] text-sm tracking-wide">SPICY LEVEL</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--crimson)] font-bold text-lg">{settings.spicy_level}</span>
                    <span className="text-[var(--amber)]">/5</span>
                  </div>
                </div>

                {/* Custom slider track */}
                <div className="relative h-8 mb-2">
                  {/* Track background with segments */}
                  <div className="absolute inset-y-2 left-0 right-0 flex">
                    {SPICY_LEVELS.map((level, i) => (
                      <button
                        key={level.level}
                        onClick={() => handleSpicyChange(level.level)}
                        disabled={saving}
                        className={`flex-1 transition-all duration-200 ${
                          i === 0 ? "rounded-l" : ""
                        } ${i === SPICY_LEVELS.length - 1 ? "rounded-r" : ""} ${
                          level.level <= settings.spicy_level
                            ? "bg-gradient-to-r from-[var(--crimson)] to-[var(--amber)]"
                            : "bg-[var(--stone)]"
                        } hover:brightness-125`}
                      />
                    ))}
                  </div>

                  {/* Level markers */}
                  <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-1 text-[10px] text-[var(--mist)]">
                    {SPICY_LEVELS.map((level) => (
                      <span
                        key={level.level}
                        className={
                          level.level === settings.spicy_level ? "text-[var(--amber)]" : ""
                        }
                      >
                        {level.level}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Current level description */}
                <div className="mt-6 p-3 bg-[var(--shadow)] border-l-2 border-[var(--crimson)]">
                  <div className="text-[var(--amber)] font-bold text-sm">{currentLevel.name}</div>
                  <div className="text-[var(--text-dim)] text-xs mt-1">{currentLevel.desc}</div>
                </div>

                {/* NSFW minimum warning */}
                {settings.spicy_level < 3 && nsfwEnabled && (
                  <div className="text-[var(--mist)] text-xs mt-2 italic">
                    * NSFW lands enforce minimum level 3
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--stone)] border-dashed" />

              {/* Blocked Content */}
              <div className={!nsfwEnabled ? "opacity-40 pointer-events-none" : ""}>
                <div className="text-[var(--text)] text-sm tracking-wide mb-3">
                  BLOCKED CONTENT
                </div>
                <div className="text-[var(--text-dim)] text-xs mb-4">
                  These will NEVER appear in your story.
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {TRIGGER_OPTIONS.map((trigger) => {
                    const isBlocked = settings.blocked_triggers.includes(trigger.id);
                    return (
                      <button
                        key={trigger.id}
                        onClick={() => handleTriggerToggle(trigger.id)}
                        disabled={saving}
                        className={`flex items-center gap-3 p-2 text-left transition-all ${
                          isBlocked
                            ? "bg-[var(--stone)] border-l-2 border-[var(--crimson)]"
                            : "bg-transparent hover:bg-[var(--shadow)]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 border flex items-center justify-center text-xs ${
                            isBlocked
                              ? "border-[var(--crimson)] bg-[var(--crimson)] text-[var(--void)]"
                              : "border-[var(--slate)]"
                          }`}
                        >
                          {isBlocked && "x"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm ${
                              isBlocked ? "text-[var(--text)]" : "text-[var(--text-dim)]"
                            }`}
                          >
                            {trigger.label}
                          </div>
                        </div>
                        <div className="text-[var(--mist)] text-xs hidden sm:block">
                          {trigger.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--stone)] border-dashed" />

              {/* Discovered Desires */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[var(--text)] text-sm tracking-wide">
                    DISCOVERED PREFERENCES
                  </div>
                  <span className="text-[var(--mist)] text-xs">(read-only)</span>
                </div>

                {desires.length === 0 ? (
                  <div className="p-4 bg-[var(--shadow)] text-center">
                    <div className="text-[var(--mist)] text-sm">No preferences discovered yet</div>
                    <div className="text-[var(--text-dim)] text-xs mt-2">
                      These are learned from your gameplay and book choices.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {desires.map((desire, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 bg-[var(--shadow)] border-l-2 border-[var(--arcane)]"
                      >
                        <div className="text-[var(--arcane)] text-xs">*</div>
                        <div className="flex-1 text-[var(--text)] text-sm">{desire.label}</div>
                        <div className="text-[var(--mist)] text-xs">
                          {Math.round(desire.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                    <div className="text-[var(--text-dim)] text-xs mt-2 italic">
                      These personalize your experience based on choices, not settings.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--stone)] flex items-center justify-between">
          <div className="text-xs">
            {saved ? (
              <span className="text-[var(--arcane)]">* Saved</span>
            ) : saving ? (
              <span className="text-[var(--mist)]">Saving...</span>
            ) : (
              <span className="text-[var(--mist)]">Auto-saves on change</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors text-sm tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
