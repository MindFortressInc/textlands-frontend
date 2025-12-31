"use client";

import { useEffect, useRef } from "react";
import type { GameLogEntry, ContentSegment, EntityReference } from "@/types/game";
import { ReasoningPanel } from "./ReasoningPanel";
import { EntityHoverLink } from "./EntityHoverLink";

interface GameLogProps {
  entries: GameLogEntry[];
  showReasoning?: boolean;
  keyboardVisible?: boolean;
}

const typeStyles: Record<GameLogEntry["type"], string> = {
  narrative: "text-[var(--amber)]",
  combat: "text-[var(--crimson)]",
  dialogue: "text-[var(--arcane)]",
  system: "text-[var(--mist)]",
  action: "text-[var(--fog)]",
  intimate: "text-[var(--arcane)]",
};

// Segment type to CSS class mapping
const segmentStyles: Record<string, string> = {
  dialogue: "text-[var(--arcane)]",
  combat_hit: "text-[var(--crimson)]",
  combat_miss: "text-[var(--mist)]",
  combat_effect: "text-[var(--arcane)]",
  item_gained: "text-[var(--gold)]",
  item_lost: "text-[var(--crimson)]",
  item_used: "text-[var(--fog)]",
  movement: "text-[var(--fog)]",
  environment: "text-[var(--amber)]",
  narration: "text-[var(--amber)]",
};

// Render text with entity hover links using start/end offsets
function renderWithEntities(
  text: string,
  refs: EntityReference[]
): React.ReactNode {
  if (!refs?.length) return text;

  // Sort by start position to process in order
  const sorted = [...refs].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  let keyCounter = 0;

  for (const ref of sorted) {
    // Skip invalid refs (out of bounds or overlapping)
    if (ref.start < lastEnd || ref.end > text.length) continue;

    // Text before this entity
    if (ref.start > lastEnd) {
      parts.push(text.slice(lastEnd, ref.start));
    }

    // The entity as a hover link
    const entityText = text.slice(ref.start, ref.end);
    parts.push(
      <EntityHoverLink key={`entity-${keyCounter++}`} entity={ref}>
        {entityText}
      </EntityHoverLink>
    );

    lastEnd = ref.end;
  }

  // Remaining text after last entity
  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return <>{parts}</>;
}

// Render content segments from backend (preferred)
function renderSegments(segments: ContentSegment[]): React.ReactNode {
  return (
    <span className="block space-y-1">
      {segments.map((seg, i) => {
        const style = segmentStyles[seg.type] || "text-[var(--amber)]";

        // Dialogue gets special treatment with speaker
        if (seg.type === "dialogue" && seg.speaker) {
          return (
            <span key={i} className={`block ${style}`}>
              <span className="font-bold">{seg.speaker}</span>
              {seg.verb && <span className="text-[var(--mist)]"> {seg.verb}</span>}
              {": "}
              {seg.text}
            </span>
          );
        }

        return (
          <span key={i} className={`block ${style}`}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}

// Fallback: parse plain narrative string (legacy support)
function renderNarrativeFallback(text: string): React.ReactNode {
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n\n+/);

  const renderParagraph = (para: string, paraIndex: number) => {
    // Split on double-quoted dialogue only (single quotes conflict with apostrophes)
    const dialoguePattern = /("[^"]+")/g;
    const parts = para.split(dialoguePattern).filter(p => p.length > 0);

    const lines: { content: string; isDialogue: boolean }[] = [];
    let currentNarrative = '';

    for (const part of parts) {
      const isDialogue = part.startsWith('"') && part.endsWith('"');
      if (isDialogue) {
        if (currentNarrative.trim()) {
          lines.push({ content: currentNarrative.trim(), isDialogue: false });
          currentNarrative = '';
        }
        lines.push({ content: part, isDialogue: true });
      } else {
        const sublines = part.split('\n');
        for (let i = 0; i < sublines.length; i++) {
          currentNarrative += sublines[i];
          if (i < sublines.length - 1) {
            if (currentNarrative.trim()) {
              lines.push({ content: currentNarrative.trim(), isDialogue: false });
            }
            currentNarrative = '';
          }
        }
      }
    }
    if (currentNarrative.trim()) {
      lines.push({ content: currentNarrative.trim(), isDialogue: false });
    }

    return (
      <span key={paraIndex} className="block">
        {lines.map((line, i) => (
          <span
            key={i}
            className={`block ${line.isDialogue ? 'text-[var(--arcane)]' : ''}`}
          >
            {line.content}
          </span>
        ))}
      </span>
    );
  };

  if (paragraphs.length === 1) {
    return renderParagraph(paragraphs[0], 0);
  }

  return (
    <span className="block space-y-3">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;
        return renderParagraph(trimmed, i);
      })}
    </span>
  );
}

// Render narrative: entity_references > content_segments > fallback parsing
function renderNarrative(entry: GameLogEntry): React.ReactNode {
  // Entity references take priority - they provide interactive hover links
  if (entry.entity_references && entry.entity_references.length > 0) {
    return renderWithEntities(entry.content, entry.entity_references);
  }
  // Content segments for structured rendering
  if (entry.content_segments && entry.content_segments.length > 0) {
    return renderSegments(entry.content_segments);
  }
  // Fallback: parse plain text
  return renderNarrativeFallback(entry.content);
}

export function GameLog({ entries, showReasoning = false, keyboardVisible = false }: GameLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevKeyboardVisible = useRef(keyboardVisible);

  // Scroll to bottom when entries change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  // Scroll to bottom when keyboard opens (keeps recent narrative visible)
  useEffect(() => {
    // Only trigger on keyboard becoming visible (not on close)
    if (keyboardVisible && !prevKeyboardVisible.current && containerRef.current) {
      // Wait for keyboard animation to complete
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 350);
      return () => clearTimeout(timer);
    }
    prevKeyboardVisible.current = keyboardVisible;
  }, [keyboardVisible]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-[var(--void)] overscroll-contain"
    >
      {entries.length === 0 && (
        <div className="text-[var(--mist)]">Awaiting input...</div>
      )}

      {entries.map((entry) => (
        <div key={entry.id}>
          <div className={`${typeStyles[entry.type]} leading-relaxed text-[15px] md:text-sm`}>
            {entry.type === "dialogue" && entry.actor && (
              <span className="text-[var(--arcane)] font-bold">{entry.actor}: </span>
            )}
            {entry.type === "action" && <span className="text-[var(--mist)]">&gt; </span>}
            {entry.type === "system" && <span className="text-[var(--mist)]">[</span>}
            {entry.type === "narrative" || entry.type === "intimate"
              ? renderNarrative(entry)
              : <span className="whitespace-pre-wrap">{entry.content}</span>
            }
            {entry.type === "system" && <span className="text-[var(--mist)]">]</span>}
          </div>

          {/* Show reasoning panel if available */}
          {entry.reasoning && showReasoning && (
            <ReasoningPanel reasoning={entry.reasoning} />
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
