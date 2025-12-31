"use client";

import { useEffect, useRef } from "react";
import type { GameLogEntry } from "@/types/game";
import { ReasoningPanel } from "./ReasoningPanel";

interface GameLogProps {
  entries: GameLogEntry[];
  showReasoning?: boolean;
}

const typeStyles: Record<GameLogEntry["type"], string> = {
  narrative: "text-[var(--amber)]",
  combat: "text-[var(--crimson)]",
  dialogue: "text-[var(--arcane)]",
  system: "text-[var(--mist)]",
  action: "text-[var(--fog)]",
  intimate: "text-[var(--arcane)]",
};

// Check if a string is quoted dialogue
function isDialogue(text: string): boolean {
  return (text.startsWith('"') && text.endsWith('"')) ||
         (text.startsWith("'") && text.endsWith("'"));
}

// Parse narrative: dialogue on its own lines, paragraphs spaced
function renderNarrative(text: string): React.ReactNode {
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n\n+/);

  const renderParagraph = (para: string, paraIndex: number) => {
    // Split on quoted dialogue, keeping the quotes
    const dialoguePattern = /("[^"]+"|'[^']+')/g;
    const parts = para.split(dialoguePattern).filter(p => p.length > 0);

    // Build lines: narrative chunks inline, dialogue on own rows
    const lines: { content: string; isDialogue: boolean }[] = [];
    let currentNarrative = '';

    for (const part of parts) {
      if (isDialogue(part)) {
        // Flush any pending narrative
        if (currentNarrative.trim()) {
          lines.push({ content: currentNarrative.trim(), isDialogue: false });
          currentNarrative = '';
        }
        lines.push({ content: part, isDialogue: true });
      } else {
        // Handle newlines within narrative
        const sublines = part.split('\n');
        for (let i = 0; i < sublines.length; i++) {
          currentNarrative += sublines[i];
          if (i < sublines.length - 1) {
            // Newline in source - flush current line
            if (currentNarrative.trim()) {
              lines.push({ content: currentNarrative.trim(), isDialogue: false });
            }
            currentNarrative = '';
          }
        }
      }
    }
    // Flush remaining narrative
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

export function GameLog({ entries, showReasoning = false }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-[var(--void)] overscroll-contain">
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
              ? renderNarrative(entry.content)
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
