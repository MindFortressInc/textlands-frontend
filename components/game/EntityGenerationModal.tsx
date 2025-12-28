"use client";

import { useState, useEffect } from "react";
import type { EntityType, GeneratedEntity } from "@/types/game";
import * as api from "@/lib/api";

interface EntityGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
  worldName?: string;
  isDemo: boolean;
}

const ENTITY_TYPES: { type: EntityType; label: string; icon: string; description: string }[] = [
  { type: "npc", label: "NPC", icon: "☺", description: "A character to meet" },
  { type: "location", label: "Location", icon: "⌂", description: "A place to explore" },
  { type: "item", label: "Item", icon: "◆", description: "An object to find" },
  { type: "faction", label: "Faction", icon: "⚑", description: "A group or organization" },
  { type: "quest", label: "Quest", icon: "!", description: "A task or mission" },
  { type: "secret", label: "Secret", icon: "?", description: "Hidden lore or mystery" },
];

type Tab = "generate" | "browse";

export function EntityGenerationModal({
  isOpen,
  onClose,
  worldId,
  worldName,
  isDemo,
}: EntityGenerationModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [selectedType, setSelectedType] = useState<EntityType>("npc");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedEntity, setGeneratedEntity] = useState<GeneratedEntity | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Browse tab state
  const [entities, setEntities] = useState<GeneratedEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [browseType, setBrowseType] = useState<EntityType | "all">("all");

  // Fetch entities when browsing
  useEffect(() => {
    if (!isOpen || !worldId || isDemo || activeTab !== "browse") return;

    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const data = await api.getWorldEntities(worldId, browseType === "all" ? undefined : browseType);
        setEntities(data);
      } catch {
        setEntities([]);
      }
      setLoadingEntities(false);
    };

    fetchEntities();
  }, [isOpen, worldId, isDemo, activeTab, browseType]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGeneratedEntity(null);
      setError(null);
      setContext("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!worldId || !context.trim()) return;

    setGenerating(true);
    setError(null);
    setGeneratedEntity(null);

    try {
      const result = await api.generateEntity(worldId, {
        entity_type: selectedType,
        context: context.trim(),
      });
      setGeneratedEntity(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }

    setGenerating(false);
  };

  const handleNewGeneration = () => {
    setGeneratedEntity(null);
    setError(null);
    setContext("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">
            {worldName ? `FORGE: ${worldName}` : "ENTITY FORGE"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--slate)]">
          <button
            onClick={() => setActiveTab("generate")}
            className={`
              flex-1 py-3 px-4 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${activeTab === "generate"
                ? "text-[var(--amber)] border-[var(--amber)]"
                : "text-[var(--mist)] border-transparent hover:text-[var(--text)]"
              }
            `}
          >
            Generate New
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={`
              flex-1 py-3 px-4 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${activeTab === "browse"
                ? "text-[var(--amber)] border-[var(--amber)]"
                : "text-[var(--mist)] border-transparent hover:text-[var(--text)]"
              }
            `}
          >
            Browse Entities
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isDemo ? (
            <div className="text-center py-8 text-[var(--mist)]">
              <p>Entity generation unavailable in demo mode</p>
            </div>
          ) : activeTab === "generate" ? (
            generatedEntity ? (
              <GeneratedEntityDisplay entity={generatedEntity} onNew={handleNewGeneration} />
            ) : (
              <GenerateForm
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                context={context}
                onContextChange={setContext}
                onGenerate={handleGenerate}
                generating={generating}
                error={error}
              />
            )
          ) : (
            <BrowseEntities
              entities={entities}
              loading={loadingEntities}
              browseType={browseType}
              onTypeChange={setBrowseType}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)]">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerateForm({
  selectedType,
  onTypeChange,
  context,
  onContextChange,
  onGenerate,
  generating,
  error,
}: {
  selectedType: EntityType;
  onTypeChange: (type: EntityType) => void;
  context: string;
  onContextChange: (ctx: string) => void;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {/* Entity Type Selection */}
      <div>
        <label className="block text-[var(--text)] text-sm mb-2">What would you like to create?</label>
        <div className="grid grid-cols-3 gap-2">
          {ENTITY_TYPES.map((et) => (
            <button
              key={et.type}
              onClick={() => onTypeChange(et.type)}
              className={`
                p-3 rounded-lg border text-left transition-all
                ${selectedType === et.type
                  ? "border-[var(--amber)] bg-[var(--stone)]"
                  : "border-[var(--slate)] bg-[var(--shadow)] hover:border-[var(--amber-dim)]"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" style={{ color: selectedType === et.type ? "var(--amber)" : "var(--mist)" }}>
                  {et.icon}
                </span>
                <span className={selectedType === et.type ? "text-[var(--text)]" : "text-[var(--mist)]"}>
                  {et.label}
                </span>
              </div>
              <div className="text-[var(--mist)] text-xs mt-1">{et.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Context Input */}
      <div>
        <label className="block text-[var(--text)] text-sm mb-2">
          Describe what you want (the AI will flesh it out)
        </label>
        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder={getPlaceholder(selectedType)}
          rows={3}
          className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none resize-none"
        />
        <div className="text-[var(--mist)] text-xs mt-1">
          Be creative! Your contribution shapes the world.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-[var(--crimson)] text-sm p-2 bg-[var(--crimson)]/10 rounded">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={generating || !context.trim()}
        className="w-full py-3 px-4 bg-[var(--amber)] text-[var(--void)] rounded font-medium hover:bg-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {generating ? "Generating..." : "Forge Entity"}
      </button>

      {/* Info */}
      <div className="text-[var(--mist)] text-xs text-center">
        Generating entities earns Trailblazer points and governance rewards
      </div>
    </div>
  );
}

function GeneratedEntityDisplay({ entity, onNew }: { entity: GeneratedEntity; onNew: () => void }) {
  return (
    <div className="space-y-4">
      {/* Success Header */}
      <div className="text-center py-2">
        <span className="text-[var(--arcane)] text-2xl">✓</span>
        <h3 className="text-[var(--amber)] font-bold text-lg mt-2">{entity.name}</h3>
        <div className="text-[var(--mist)] text-sm">
          {entity.entity_type.toUpperCase()} {entity.is_new && <span className="text-[var(--arcane)]">(NEW!)</span>}
        </div>
      </div>

      {/* Reward */}
      {entity.reward && (
        <div className="p-3 bg-[var(--stone)] rounded-lg border border-[var(--amber-dim)]">
          <div className="text-[var(--amber)] text-sm font-medium mb-2">Rewards Earned</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[var(--text)] font-mono">{entity.reward.trailblazer_points}</div>
              <div className="text-[var(--mist)] text-xs">Trailblazer</div>
            </div>
            <div>
              <div className="text-[var(--text)] font-mono">{entity.reward.governance_points}</div>
              <div className="text-[var(--mist)] text-xs">Governance</div>
            </div>
            <div>
              <div className="text-[var(--text)] font-mono">{entity.reward.currency}</div>
              <div className="text-[var(--mist)] text-xs">Currency</div>
            </div>
          </div>
          {entity.reward.was_first_of_type && (
            <div className="text-[var(--amber)] text-xs text-center mt-2">
              First of its kind bonus!
            </div>
          )}
        </div>
      )}

      {/* Entity Details */}
      <div className="space-y-3">
        {entity.identity.backstory_summary && (
          <div>
            <div className="text-[var(--mist)] text-xs mb-1">Background</div>
            <div className="text-[var(--text)] text-sm">{entity.identity.backstory_summary}</div>
          </div>
        )}

        {entity.identity.personality_core && entity.identity.personality_core.length > 0 && (
          <div>
            <div className="text-[var(--mist)] text-xs mb-1">Traits</div>
            <div className="flex flex-wrap gap-1">
              {entity.identity.personality_core.map((trait, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-[var(--stone)] text-[var(--fog)] rounded">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {entity.state.current_goals && entity.state.current_goals.length > 0 && (
          <div>
            <div className="text-[var(--mist)] text-xs mb-1">Goals</div>
            <ul className="text-[var(--text)] text-sm list-disc list-inside">
              {entity.state.current_goals.map((goal, i) => (
                <li key={i}>{goal}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Create Another */}
      <button
        onClick={onNew}
        className="w-full py-2 px-4 bg-[var(--shadow)] border border-[var(--amber-dim)] rounded text-[var(--amber)] hover:bg-[var(--stone)] transition-colors"
      >
        Create Another
      </button>
    </div>
  );
}

function BrowseEntities({
  entities,
  loading,
  browseType,
  onTypeChange,
}: {
  entities: GeneratedEntity[];
  loading: boolean;
  browseType: EntityType | "all";
  onTypeChange: (type: EntityType | "all") => void;
}) {
  return (
    <div className="space-y-4">
      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTypeChange("all")}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            browseType === "all"
              ? "bg-[var(--amber)] text-[var(--void)]"
              : "bg-[var(--shadow)] text-[var(--mist)] hover:text-[var(--text)]"
          }`}
        >
          All
        </button>
        {ENTITY_TYPES.map((et) => (
          <button
            key={et.type}
            onClick={() => onTypeChange(et.type)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              browseType === et.type
                ? "bg-[var(--amber)] text-[var(--void)]"
                : "bg-[var(--shadow)] text-[var(--mist)] hover:text-[var(--text)]"
            }`}
          >
            {et.icon} {et.label}
          </button>
        ))}
      </div>

      {/* Entity List */}
      {loading ? (
        <div className="text-center py-8 text-[var(--mist)] animate-pulse">Loading...</div>
      ) : entities.length === 0 ? (
        <div className="text-center py-8 text-[var(--mist)]">
          <p>No entities found</p>
          <p className="text-sm mt-2">Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="p-3 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--amber)]">
                      {ENTITY_TYPES.find((et) => et.type === entity.entity_type)?.icon || "◇"}
                    </span>
                    <span className="text-[var(--text)] font-medium">{entity.name}</span>
                  </div>
                  <div className="text-[var(--mist)] text-xs mt-1">
                    {entity.entity_type} · {entity.canonical_level || "common"}
                  </div>
                </div>
                {entity.generated_by && (
                  <span className="text-[var(--mist)] text-xs">by player</span>
                )}
              </div>
              {entity.identity.backstory_summary && (
                <p className="text-[var(--fog)] text-sm mt-2 line-clamp-2">
                  {entity.identity.backstory_summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getPlaceholder(type: EntityType): string {
  switch (type) {
    case "npc":
      return "e.g., A gruff blacksmith with a mysterious past...";
    case "location":
      return "e.g., An abandoned lighthouse on a cliff...";
    case "item":
      return "e.g., A glowing amulet that hums faintly...";
    case "faction":
      return "e.g., A secret society of alchemists...";
    case "quest":
      return "e.g., Find the missing merchant's daughter...";
    case "secret":
      return "e.g., The true origin of the cursed forest...";
    default:
      return "Describe what you want to create...";
  }
}
