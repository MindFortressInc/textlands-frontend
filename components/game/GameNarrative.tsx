"use client";

import { useMemo } from "react";
import type { ContentSegment, EntityReference } from "@/types/game";
import { EntityHoverLink } from "./EntityHoverLink";

interface GameNarrativeProps {
  narrative: string;
  contentSegments?: ContentSegment[];
  entityReferences?: EntityReference[];
}

// ============ ENTITY LINKING HELPERS ============

/**
 * Find entity references within a text segment by matching entity names.
 * Since segment text doesn't have character offsets, we search for entity names.
 */
function findEntitiesInText(
  text: string,
  refs: EntityReference[]
): { text: string; entity?: EntityReference }[] {
  if (!refs?.length) return [{ text }];

  const parts: { text: string; entity?: EntityReference }[] = [];
  let remaining = text;
  let searchStart = 0;

  // Sort refs by name length (longest first) to avoid partial matches
  const sortedRefs = [...refs].sort((a, b) => b.name.length - a.name.length);

  while (remaining.length > 0) {
    let earliestMatch: { index: number; ref: EntityReference } | null = null;

    // Find the earliest matching entity in remaining text
    for (const ref of sortedRefs) {
      const idx = remaining.toLowerCase().indexOf(ref.name.toLowerCase());
      if (idx !== -1 && (!earliestMatch || idx < earliestMatch.index)) {
        earliestMatch = { index: idx, ref };
      }
    }

    if (!earliestMatch) {
      // No more matches, add remaining text
      parts.push({ text: remaining });
      break;
    }

    // Add text before the match
    if (earliestMatch.index > 0) {
      parts.push({ text: remaining.slice(0, earliestMatch.index) });
    }

    // Add the entity match (preserve original case from text)
    const matchedText = remaining.slice(
      earliestMatch.index,
      earliestMatch.index + earliestMatch.ref.name.length
    );
    parts.push({ text: matchedText, entity: earliestMatch.ref });

    // Continue with remaining text
    remaining = remaining.slice(earliestMatch.index + earliestMatch.ref.name.length);
  }

  return parts;
}

/**
 * Render text with entity hover links embedded
 */
function TextWithEntities({
  text,
  entities,
  className = "",
}: {
  text: string;
  entities?: EntityReference[];
  className?: string;
}) {
  const parts = useMemo(
    () => findEntitiesInText(text, entities || []),
    [text, entities]
  );

  if (!entities?.length) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.entity ? (
          <EntityHoverLink key={i} entity={part.entity}>
            {part.text}
          </EntityHoverLink>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}

// ============ SEGMENT COMPONENTS ============

/**
 * Speech bubble for dialogue - terminal-native with ASCII-inspired borders
 */
function SpeechBubble({
  speaker,
  verb,
  text,
  entities,
}: {
  speaker: string;
  verb?: string;
  text: string;
  entities?: EntityReference[];
}) {
  return (
    <div className="speech-bubble group relative my-3 ml-2">
      {/* Speaker attribution */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-[var(--arcane)] font-bold tracking-wide">
          {speaker}
        </span>
        {verb && (
          <span className="text-[var(--mist)] text-xs italic opacity-70">
            {verb}
          </span>
        )}
      </div>

      {/* Speech content with left border accent */}
      <div className="relative pl-3 border-l-2 border-[var(--arcane)]/40 group-hover:border-[var(--arcane)]/70 transition-colors">
        <span className="text-[var(--text)] leading-relaxed">
          <span className="text-[var(--mist)] opacity-50">&ldquo;</span>
          <TextWithEntities text={text} entities={entities} />
          <span className="text-[var(--mist)] opacity-50">&rdquo;</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Combat line - hits in crimson with floating damage, misses in gray italic
 */
function CombatLine({
  type,
  text,
  damage,
  attacker,
  target,
  entities,
}: {
  type: "combat_hit" | "combat_miss" | "combat_effect";
  text: string;
  damage?: number;
  attacker?: string;
  target?: string;
  entities?: EntityReference[];
}) {
  if (type === "combat_miss") {
    return (
      <div className="combat-line my-2 flex items-start gap-2">
        <span className="text-[var(--mist)] opacity-60 shrink-0">◇</span>
        <TextWithEntities
          text={text}
          entities={entities}
          className="text-[var(--mist)] italic opacity-70"
        />
      </div>
    );
  }

  if (type === "combat_effect") {
    return (
      <div className="combat-line my-2 flex items-start gap-2">
        <span className="text-[var(--arcane)] shrink-0 animate-pulse">✧</span>
        <TextWithEntities
          text={text}
          entities={entities}
          className="text-[var(--arcane)]"
        />
      </div>
    );
  }

  // combat_hit
  return (
    <div className="combat-line my-2 relative">
      <div className="flex items-start gap-2">
        <span className="text-[var(--crimson)] shrink-0">◆</span>
        <TextWithEntities
          text={text}
          entities={entities}
          className="text-[var(--crimson)] font-medium"
        />

        {/* Floating damage number */}
        {damage !== undefined && damage > 0 && (
          <span className="damage-floater inline-flex items-center ml-2 px-1.5 py-0.5 bg-[var(--crimson)]/20 border border-[var(--crimson)]/40 rounded text-[var(--crimson)] text-xs font-bold tabular-nums">
            -{damage}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Loot line - gains in gold with subtle glow, losses in red
 */
function LootLine({
  type,
  text,
  itemName,
  quantity,
  entities,
}: {
  type: "item_gained" | "item_lost" | "item_used";
  text: string;
  itemName?: string;
  quantity?: number;
  entities?: EntityReference[];
}) {
  const isGain = type === "item_gained";
  const isLoss = type === "item_lost";
  const isUsed = type === "item_used";

  const icon = isGain ? "◈" : isLoss ? "◇" : "○";
  const colorClass = isGain
    ? "text-[var(--gold)]"
    : isLoss
    ? "text-[var(--crimson)] opacity-80"
    : "text-[var(--fog)]";

  return (
    <div className={`loot-line my-2 flex items-start gap-2 ${isGain ? 'loot-gained' : ''}`}>
      <span className={`${colorClass} shrink-0 ${isGain ? 'animate-loot-pulse' : ''}`}>
        {icon}
      </span>
      <div className="flex items-baseline gap-2 flex-wrap">
        <TextWithEntities
          text={text}
          entities={entities}
          className={colorClass}
        />

        {/* Quantity badge for gains */}
        {isGain && quantity !== undefined && quantity > 1 && (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded text-[var(--gold)] text-xs font-medium tabular-nums">
            ×{quantity}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Movement line - shows location changes
 */
function MovementLine({
  text,
  toLocation,
  entities,
}: {
  text: string;
  toLocation?: string;
  entities?: EntityReference[];
}) {
  return (
    <div className="movement-line my-2 flex items-start gap-2">
      <span className="text-[var(--fog)] shrink-0 opacity-70">→</span>
      <TextWithEntities
        text={text}
        entities={entities}
        className="text-[var(--fog)]"
      />
    </div>
  );
}

/**
 * Environment/scene description - atmospheric with subtle styling
 */
function EnvironmentLine({
  text,
  entities,
}: {
  text: string;
  entities?: EntityReference[];
}) {
  return (
    <div className="environment-line my-3 pl-2 border-l border-[var(--slate)]/30">
      <TextWithEntities
        text={text}
        entities={entities}
        className="text-[var(--amber)] opacity-90 italic"
      />
    </div>
  );
}

/**
 * Standard narration paragraph
 */
function NarrationParagraph({
  text,
  entities,
}: {
  text: string;
  entities?: EntityReference[];
}) {
  return (
    <p className="narration-paragraph my-2 leading-relaxed">
      <TextWithEntities
        text={text}
        entities={entities}
        className="text-[var(--amber)]"
      />
    </p>
  );
}

// ============ FALLBACK RENDERER ============

/**
 * Fallback: Split narrative on \n\n and render as paragraphs
 * Also attempts to detect dialogue (quoted text) for styling
 */
function renderFallback(narrative: string, entities?: EntityReference[]) {
  const paragraphs = narrative.split(/\n\n+/).filter((p) => p.trim());

  return (
    <div className="narrative-fallback space-y-3">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();

        // Check if this paragraph is primarily dialogue (starts and ends with quotes)
        const isDialogue = /^["'].*["']$/.test(trimmed);

        if (isDialogue) {
          return (
            <p
              key={i}
              className="text-[var(--arcane)] pl-3 border-l-2 border-[var(--arcane)]/30"
            >
              <TextWithEntities text={trimmed} entities={entities} />
            </p>
          );
        }

        return (
          <p key={i} className="text-[var(--amber)] leading-relaxed">
            <TextWithEntities text={trimmed} entities={entities} />
          </p>
        );
      })}
    </div>
  );
}

// ============ MAIN COMPONENT ============

/**
 * GameNarrative - Segment-first rendering for rich game narratives
 *
 * Priority:
 * 1. content_segments (if available) - rich visual treatment per segment type
 * 2. narrative with entity_references - paragraph rendering with hover links
 * 3. plain narrative - split on \n\n for paragraphs
 */
export function GameNarrative({
  narrative,
  contentSegments,
  entityReferences,
}: GameNarrativeProps) {
  // Use segments if available
  if (contentSegments && contentSegments.length > 0) {
    return (
      <div className="game-narrative space-y-1">
        {contentSegments.map((segment, i) => {
          switch (segment.type) {
            case "dialogue":
              return (
                <SpeechBubble
                  key={i}
                  speaker={segment.speaker || "Unknown"}
                  verb={segment.verb}
                  text={segment.text}
                  entities={entityReferences}
                />
              );

            case "combat_hit":
            case "combat_miss":
            case "combat_effect":
              return (
                <CombatLine
                  key={i}
                  type={segment.type}
                  text={segment.text}
                  damage={segment.damage}
                  attacker={segment.attacker}
                  target={segment.target}
                  entities={entityReferences}
                />
              );

            case "item_gained":
            case "item_lost":
            case "item_used":
              return (
                <LootLine
                  key={i}
                  type={segment.type}
                  text={segment.text}
                  itemName={segment.item_name}
                  quantity={segment.quantity}
                  entities={entityReferences}
                />
              );

            case "movement":
              return (
                <MovementLine
                  key={i}
                  text={segment.text}
                  toLocation={segment.to_location}
                  entities={entityReferences}
                />
              );

            case "environment":
              return (
                <EnvironmentLine
                  key={i}
                  text={segment.text}
                  entities={entityReferences}
                />
              );

            case "narration":
            default:
              return (
                <NarrationParagraph
                  key={i}
                  text={segment.text}
                  entities={entityReferences}
                />
              );
          }
        })}
      </div>
    );
  }

  // Fallback to paragraph rendering
  return renderFallback(narrative, entityReferences);
}

export default GameNarrative;
