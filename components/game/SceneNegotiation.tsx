"use client";

import { useState } from "react";
import type {
  IntensityLevel,
  PlayerRole,
  SceneNegotiation as NegotiationType,
  ActiveScene,
} from "@/types/game";

interface SceneNegotiationProps {
  npcName: string;
  sceneId: string;
  onConfirm: (negotiation: NegotiationType & { scene_id: string }) => void;
  onCancel: () => void;
}

const ROLES: { value: PlayerRole; label: string; description: string }[] = [
  { value: "equal", label: "Equal", description: "Balanced dynamic, shared control" },
  { value: "dominant", label: "Dominant", description: "You take the lead" },
  { value: "submissive", label: "Submissive", description: "You follow their lead" },
  { value: "switch", label: "Switch", description: "Fluid, trading control" },
];

const INTENSITIES: { value: IntensityLevel; label: string; description: string }[] = [
  { value: "gentle", label: "Gentle", description: "Soft, tender, slow-paced" },
  { value: "moderate", label: "Moderate", description: "Natural, balanced intensity" },
  { value: "passionate", label: "Passionate", description: "Heated, enthusiastic" },
  { value: "intense", label: "Intense", description: "Raw, powerful, uninhibited" },
];

const COMMON_BOUNDARIES = [
  "No pain/violence",
  "No degradation",
  "No specific body parts",
  "Keep it romantic",
  "Fade to black option",
];

export function SceneNegotiation({
  npcName,
  sceneId,
  onConfirm,
  onCancel,
}: SceneNegotiationProps) {
  const [role, setRole] = useState<PlayerRole>("equal");
  const [intensity, setIntensity] = useState<IntensityLevel>("moderate");
  const [boundaries, setBoundaries] = useState<string[]>([]);
  const [customBoundary, setCustomBoundary] = useState("");
  const [safeword, setSafeword] = useState("red");

  const toggleBoundary = (boundary: string) => {
    setBoundaries((prev) =>
      prev.includes(boundary)
        ? prev.filter((b) => b !== boundary)
        : [...prev, boundary]
    );
  };

  const addCustomBoundary = () => {
    if (customBoundary.trim() && !boundaries.includes(customBoundary.trim())) {
      setBoundaries((prev) => [...prev, customBoundary.trim()]);
      setCustomBoundary("");
    }
  };

  const handleConfirm = () => {
    onConfirm({
      scene_id: sceneId,
      player_role: role,
      intensity,
      boundaries,
      safeword,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="negotiation-panel w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--amber)] mb-2">
          Scene with {npcName}
        </h2>
        <p className="text-[var(--text-dim)] text-sm mb-6">
          Set your preferences for this intimate encounter. You can use your safeword at any time to immediately end the scene.
        </p>

        {/* Role Selection */}
        <div className="mb-6">
          <h3 className="text-[var(--text)] font-semibold mb-3">Your Role</h3>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`p-3 rounded border text-left transition-all ${
                  role === r.value
                    ? "border-[var(--amber)] bg-[var(--amber)]/10 text-[var(--amber)]"
                    : "border-[var(--stone)] hover:border-[var(--slate)] text-[var(--text-dim)]"
                }`}
              >
                <div className="font-medium">{r.label}</div>
                <div className="text-xs opacity-70">{r.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Selection */}
        <div className="mb-6">
          <h3 className="text-[var(--text)] font-semibold mb-3">Intensity</h3>
          <div className="grid grid-cols-2 gap-2">
            {INTENSITIES.map((i) => (
              <button
                key={i.value}
                onClick={() => setIntensity(i.value)}
                className={`p-3 rounded border text-left transition-all ${
                  intensity === i.value
                    ? "border-[var(--arcane)] bg-[var(--arcane)]/10 text-[var(--arcane)]"
                    : "border-[var(--stone)] hover:border-[var(--slate)] text-[var(--text-dim)]"
                }`}
              >
                <div className="font-medium">{i.label}</div>
                <div className="text-xs opacity-70">{i.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Boundaries */}
        <div className="mb-6">
          <h3 className="text-[var(--text)] font-semibold mb-3">Boundaries</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_BOUNDARIES.map((b) => (
              <button
                key={b}
                onClick={() => toggleBoundary(b)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  boundaries.includes(b)
                    ? "bg-[var(--crimson)]/20 text-[var(--crimson)] border border-[var(--crimson)]"
                    : "bg-[var(--stone)] text-[var(--text-dim)] border border-transparent hover:border-[var(--slate)]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customBoundary}
              onChange={(e) => setCustomBoundary(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomBoundary()}
              placeholder="Add custom boundary..."
              className="flex-1 px-3 py-2 rounded bg-[var(--shadow)] border border-[var(--stone)] text-[var(--text)] placeholder:text-[var(--mist)] text-sm"
            />
            <button
              onClick={addCustomBoundary}
              className="px-4 py-2 rounded bg-[var(--stone)] text-[var(--text-dim)] hover:bg-[var(--slate)] transition-colors"
            >
              Add
            </button>
          </div>
          {boundaries.filter((b) => !COMMON_BOUNDARIES.includes(b)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {boundaries
                .filter((b) => !COMMON_BOUNDARIES.includes(b))
                .map((b) => (
                  <span
                    key={b}
                    className="px-3 py-1.5 rounded-full text-sm bg-[var(--crimson)]/20 text-[var(--crimson)] border border-[var(--crimson)] flex items-center gap-2"
                  >
                    {b}
                    <button
                      onClick={() => toggleBoundary(b)}
                      className="hover:text-white"
                    >
                      x
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Safeword */}
        <div className="mb-8">
          <h3 className="text-[var(--text)] font-semibold mb-3">Safeword</h3>
          <p className="text-[var(--text-dim)] text-xs mb-2">
            Say this word at any time to immediately end the scene. Default is &quot;red&quot;.
          </p>
          <input
            type="text"
            value={safeword}
            onChange={(e) => setSafeword(e.target.value)}
            placeholder="Your safeword..."
            className="w-full px-3 py-2 rounded bg-[var(--shadow)] border border-[var(--crimson)]/50 text-[var(--crimson)] placeholder:text-[var(--mist)] font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded border border-[var(--stone)] text-[var(--text-dim)] hover:bg-[var(--stone)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!safeword.trim()}
            className="flex-1 px-4 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Begin Scene
          </button>
        </div>
      </div>
    </div>
  );
}
