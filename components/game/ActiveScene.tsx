"use client";

import { useState, useRef, useEffect } from "react";
import type { ActiveScene as ActiveSceneType } from "@/types/game";

interface ActiveSceneProps {
  scene: ActiveSceneType;
  onAction: (action: string) => void;
  onSafeword: () => void;
  onComplete: (aftercareQuality: "minimal" | "standard" | "extended") => void;
  isProcessing: boolean;
}

const AFTERCARE_OPTIONS: {
  value: "minimal" | "standard" | "extended";
  label: string;
  description: string;
}[] = [
  { value: "minimal", label: "Quick", description: "Brief acknowledgment" },
  { value: "standard", label: "Standard", description: "Tender moment together" },
  { value: "extended", label: "Extended", description: "Deep connection and care" },
];

export function ActiveScene({
  scene,
  onAction,
  onSafeword,
  onComplete,
  isProcessing,
}: ActiveSceneProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [scene.narrative]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onAction(input.trim());
      setInput("");
    }
  };

  const handleSuggestion = (action: string) => {
    if (!isProcessing) {
      onAction(action);
    }
  };

  const isAftercare = scene.phase === "aftercare";

  return (
    <div className="scene-container flex flex-col h-full">
      {/* Scene Header with Safeword */}
      <div className="scene-header flex items-center justify-between p-3 border-b border-[var(--stone)]">
        <div className="flex items-center gap-3">
          <span className="text-[var(--amber)] font-semibold">{scene.npc_name}</span>
          <span className="text-[var(--mist)] text-sm">
            {scene.intensity} · {scene.player_role}
          </span>
        </div>
        <button
          onClick={onSafeword}
          className="safeword-button px-4 py-2 rounded bg-[var(--crimson)] text-white font-bold uppercase text-sm tracking-wider hover:opacity-90 transition-opacity animate-pulse-subtle"
          title={`Safeword: ${scene.safeword}`}
        >
          {scene.safeword}
        </button>
      </div>

      {/* Narrative Display */}
      <div className="scene-narrative flex-1 p-4 overflow-y-auto">
        <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap">
          {scene.narrative}
        </p>
        {scene.mood && (
          <p className="text-[var(--arcane)] text-sm mt-4 italic">
            The mood is {scene.mood}...
          </p>
        )}
      </div>

      {/* Aftercare Phase */}
      {isAftercare ? (
        <div className="p-4 border-t border-[var(--stone)]">
          <p className="text-[var(--text-dim)] text-sm mb-4">
            The scene has concluded. Choose how you&apos;d like to spend this moment together.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AFTERCARE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onComplete(opt.value)}
                disabled={isProcessing}
                className="p-3 rounded border border-[var(--stone)] hover:border-[var(--amber)] hover:bg-[var(--amber)]/5 transition-all text-center disabled:opacity-50"
              >
                <div className="text-[var(--amber)] font-medium">{opt.label}</div>
                <div className="text-[var(--text-dim)] text-xs">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Suggested Actions */}
          {scene.suggested_actions.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--stone)]/50">
              <div className="flex flex-wrap gap-2">
                {scene.suggested_actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(action)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-full text-sm bg-[var(--stone)] text-[var(--text-dim)] hover:bg-[var(--slate)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--stone)]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isProcessing ? "..." : "Describe your action..."}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 rounded bg-[var(--shadow)] border border-[var(--stone)] text-[var(--text)] placeholder:text-[var(--mist)] focus:border-[var(--amber)] focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-6 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Act
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
