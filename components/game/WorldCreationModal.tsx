"use client";

import { useState, useEffect } from "react";
import type { WorldTemplate } from "@/types/game";
import * as api from "@/lib/api";

interface WorldCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldCreated?: (worldId: string) => void;
  selectedTemplate?: WorldTemplate | null;
  isDemo: boolean;
}

const REALMS = [
  { value: "fantasy", label: "Fantasy", icon: "⚔" },
  { value: "scifi", label: "Sci-Fi", icon: "◈" },
  { value: "horror", label: "Horror", icon: "☠" },
  { value: "mystery", label: "Mystery", icon: "◎" },
  { value: "romance", label: "Romance", icon: "♡" },
  { value: "historical", label: "Historical", icon: "⚜" },
  { value: "contemporary", label: "Contemporary", icon: "▣" },
];

const TECH_LEVELS = [
  { value: "primitive", label: "Primitive" },
  { value: "medieval", label: "Medieval" },
  { value: "renaissance", label: "Renaissance" },
  { value: "industrial", label: "Industrial" },
  { value: "modern", label: "Modern" },
  { value: "near_future", label: "Near Future" },
  { value: "far_future", label: "Far Future" },
];

const TONES = [
  { value: "heroic", label: "Heroic" },
  { value: "grimdark", label: "Grimdark" },
  { value: "comedic", label: "Comedic" },
  { value: "noir", label: "Noir" },
  { value: "romantic", label: "Romantic" },
  { value: "slice_of_life", label: "Slice of Life" },
];

const STAKES = [
  { value: "low", label: "Low Stakes" },
  { value: "medium", label: "Medium Stakes" },
  { value: "high", label: "High Stakes" },
  { value: "apocalyptic", label: "Apocalyptic" },
];

export function WorldCreationModal({
  isOpen,
  onClose,
  onWorldCreated,
  selectedTemplate,
  isDemo,
}: WorldCreationModalProps) {
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [realm, setRealm] = useState("fantasy");
  const [isNsfw, setIsNsfw] = useState(false);

  // Rules state
  const [techLevel, setTechLevel] = useState("medieval");
  const [magicExists, setMagicExists] = useState(true);
  const [primaryTone, setPrimaryTone] = useState("heroic");
  const [stakesLevel, setStakesLevel] = useState("medium");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setName(selectedTemplate?.name ? `${selectedTemplate.name} World` : "");
      setTagline("");
      setDescription(selectedTemplate?.description || "");
      setRealm(selectedTemplate?.genre || "fantasy");
    }
  }, [isOpen, selectedTemplate]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || !tagline.trim()) {
      setError("Name and tagline are required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await api.createWorld({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        realm,
        template_slug: selectedTemplate?.slug,
        is_nsfw: isNsfw,
        physics_rules: {
          tech_level: techLevel,
          magic_exists: magicExists,
        },
        tone_rules: {
          primary_tone: primaryTone,
          stakes_level: stakesLevel,
        },
      });

      if (result.success && onWorldCreated) {
        onWorldCreated(result.world.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create world");
    }

    setCreating(false);
  };

  const canProceed = step === 1 ? name.trim() && tagline.trim() : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">CREATE WORLD</h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-[var(--slate)]">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              step === 1 ? "text-[var(--amber)] bg-[var(--stone)]" : "text-[var(--mist)]"
            }`}
          >
            1. Basics
          </button>
          <button
            onClick={() => step > 1 && setStep(2)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              step === 2 ? "text-[var(--amber)] bg-[var(--stone)]" : "text-[var(--mist)]"
            } ${step < 2 ? "opacity-50" : ""}`}
          >
            2. Rules
          </button>
          <button
            onClick={() => step > 2 && setStep(3)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              step === 3 ? "text-[var(--amber)] bg-[var(--stone)]" : "text-[var(--mist)]"
            } ${step < 3 ? "opacity-50" : ""}`}
          >
            3. Review
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isDemo ? (
            <div className="text-center py-8 text-[var(--mist)]">
              <p>World creation unavailable in demo mode</p>
            </div>
          ) : step === 1 ? (
            <Step1Basics
              name={name}
              setName={setName}
              tagline={tagline}
              setTagline={setTagline}
              description={description}
              setDescription={setDescription}
              realm={realm}
              setRealm={setRealm}
              isNsfw={isNsfw}
              setIsNsfw={setIsNsfw}
            />
          ) : step === 2 ? (
            <Step2Rules
              techLevel={techLevel}
              setTechLevel={setTechLevel}
              magicExists={magicExists}
              setMagicExists={setMagicExists}
              primaryTone={primaryTone}
              setPrimaryTone={setPrimaryTone}
              stakesLevel={stakesLevel}
              setStakesLevel={setStakesLevel}
            />
          ) : (
            <Step3Review
              name={name}
              tagline={tagline}
              description={description}
              realm={realm}
              isNsfw={isNsfw}
              techLevel={techLevel}
              magicExists={magicExists}
              primaryTone={primaryTone}
              stakesLevel={stakesLevel}
            />
          )}

          {error && (
            <div className="mt-4 text-[var(--crimson)] text-sm p-2 bg-[var(--crimson)]/10 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)] flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] transition-colors"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="flex-1 py-2 px-4 bg-[var(--amber)] text-[var(--void)] rounded font-medium hover:bg-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2 px-4 bg-[var(--amber)] text-[var(--void)] rounded font-medium hover:bg-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Creating..." : "Create World"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1Basics({
  name, setName,
  tagline, setTagline,
  description, setDescription,
  realm, setRealm,
  isNsfw, setIsNsfw,
}: {
  name: string; setName: (v: string) => void;
  tagline: string; setTagline: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  realm: string; setRealm: (v: string) => void;
  isNsfw: boolean; setIsNsfw: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[var(--text)] text-sm mb-1">World Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., The Shattered Kingdoms"
          maxLength={50}
          className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[var(--text)] text-sm mb-1">Tagline *</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g., Where empires fall and heroes rise"
          maxLength={100}
          className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[var(--text)] text-sm mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your world..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-[var(--text)] text-sm mb-2">Realm</label>
        <div className="grid grid-cols-4 gap-2">
          {REALMS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRealm(r.value)}
              className={`p-2 rounded border text-center transition-all ${
                realm === r.value
                  ? "border-[var(--amber)] bg-[var(--stone)]"
                  : "border-[var(--slate)] hover:border-[var(--amber-dim)]"
              }`}
            >
              <div className="text-lg">{r.icon}</div>
              <div className={`text-xs ${realm === r.value ? "text-[var(--text)]" : "text-[var(--mist)]"}`}>
                {r.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isNsfw}
          onChange={(e) => setIsNsfw(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--crimson)] transition-colors relative">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform" />
        </div>
        <div>
          <div className="text-[var(--text)] text-sm">Adult Content (18+)</div>
          <div className="text-[var(--mist)] text-xs">Enable mature themes</div>
        </div>
      </label>
    </div>
  );
}

function Step2Rules({
  techLevel, setTechLevel,
  magicExists, setMagicExists,
  primaryTone, setPrimaryTone,
  stakesLevel, setStakesLevel,
}: {
  techLevel: string; setTechLevel: (v: string) => void;
  magicExists: boolean; setMagicExists: (v: boolean) => void;
  primaryTone: string; setPrimaryTone: (v: string) => void;
  stakesLevel: string; setStakesLevel: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[var(--text)] text-sm mb-2">Technology Level</label>
        <select
          value={techLevel}
          onChange={(e) => setTechLevel(e.target.value)}
          className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] focus:border-[var(--amber-dim)] focus:outline-none"
        >
          {TECH_LEVELS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={magicExists}
          onChange={(e) => setMagicExists(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--arcane)] transition-colors relative">
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full peer-checked:translate-x-4 transition-transform" />
        </div>
        <div>
          <div className="text-[var(--text)] text-sm">Magic Exists</div>
          <div className="text-[var(--mist)] text-xs">Enable supernatural elements</div>
        </div>
      </label>

      <div>
        <label className="block text-[var(--text)] text-sm mb-2">Primary Tone</label>
        <div className="grid grid-cols-3 gap-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => setPrimaryTone(t.value)}
              className={`p-2 rounded border text-sm transition-all ${
                primaryTone === t.value
                  ? "border-[var(--amber)] bg-[var(--stone)] text-[var(--text)]"
                  : "border-[var(--slate)] text-[var(--mist)] hover:border-[var(--amber-dim)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[var(--text)] text-sm mb-2">Stakes Level</label>
        <div className="grid grid-cols-4 gap-2">
          {STAKES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStakesLevel(s.value)}
              className={`p-2 rounded border text-xs transition-all ${
                stakesLevel === s.value
                  ? "border-[var(--amber)] bg-[var(--stone)] text-[var(--text)]"
                  : "border-[var(--slate)] text-[var(--mist)] hover:border-[var(--amber-dim)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3Review({
  name, tagline, description, realm, isNsfw,
  techLevel, magicExists, primaryTone, stakesLevel,
}: {
  name: string;
  tagline: string;
  description: string;
  realm: string;
  isNsfw: boolean;
  techLevel: string;
  magicExists: boolean;
  primaryTone: string;
  stakesLevel: string;
}) {
  const realmInfo = REALMS.find((r) => r.value === realm);

  return (
    <div className="space-y-4">
      <div className="text-center pb-4 border-b border-[var(--slate)]">
        <div className="text-3xl mb-2">{realmInfo?.icon || "◇"}</div>
        <h3 className="text-[var(--amber)] font-bold text-lg">{name}</h3>
        <p className="text-[var(--fog)] text-sm italic">{tagline}</p>
        {isNsfw && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-[var(--crimson)]/20 text-[var(--crimson)] rounded">
            18+
          </span>
        )}
      </div>

      {description && (
        <div>
          <div className="text-[var(--mist)] text-xs mb-1">Description</div>
          <p className="text-[var(--text)] text-sm">{description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[var(--shadow)] rounded border border-[var(--slate)]">
          <div className="text-[var(--mist)] text-xs mb-1">Realm</div>
          <div className="text-[var(--text)]">{realmInfo?.label || realm}</div>
        </div>
        <div className="p-3 bg-[var(--shadow)] rounded border border-[var(--slate)]">
          <div className="text-[var(--mist)] text-xs mb-1">Tech Level</div>
          <div className="text-[var(--text)]">{TECH_LEVELS.find((t) => t.value === techLevel)?.label}</div>
        </div>
        <div className="p-3 bg-[var(--shadow)] rounded border border-[var(--slate)]">
          <div className="text-[var(--mist)] text-xs mb-1">Magic</div>
          <div className="text-[var(--text)]">{magicExists ? "Yes" : "No"}</div>
        </div>
        <div className="p-3 bg-[var(--shadow)] rounded border border-[var(--slate)]">
          <div className="text-[var(--mist)] text-xs mb-1">Tone</div>
          <div className="text-[var(--text)]">{TONES.find((t) => t.value === primaryTone)?.label}</div>
        </div>
      </div>

      <div className="p-3 bg-[var(--amber)]/10 border border-[var(--amber-dim)] rounded text-center">
        <div className="text-[var(--amber)] text-sm font-medium">Ready to create your world!</div>
        <div className="text-[var(--mist)] text-xs mt-1">
          You&apos;ll be the creator and can earn passive income from player activity
        </div>
      </div>
    </div>
  );
}
