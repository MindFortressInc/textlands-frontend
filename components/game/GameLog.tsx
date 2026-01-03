"use client";

import { useEffect, useRef } from "react";
import type { GameLogEntry } from "@/types/game";
import { ReasoningPanel } from "./ReasoningPanel";
import { GameNarrative } from "./GameNarrative";

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
            {entry.type === "narrative" || entry.type === "intimate" ? (
              <GameNarrative
                narrative={entry.content}
                contentSegments={entry.content_segments}
                entityReferences={entry.entity_references}
              />
            ) : (
              <span className="whitespace-pre-wrap">{entry.content}</span>
            )}
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
