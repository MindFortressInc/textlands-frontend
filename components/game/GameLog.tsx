"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const prevEntriesLength = useRef(entries.length);
  // Track if user was at bottom before keyboard change
  const wasAtBottomRef = useRef(true);

  // Check if scrolled to bottom (with small tolerance)
  const isAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // Scroll to bottom when NEW entries are added (not just any entry change)
  useEffect(() => {
    if (entries.length > prevEntriesLength.current && containerRef.current) {
      // Only auto-scroll if user was already at/near bottom
      if (wasAtBottomRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
    prevEntriesLength.current = entries.length;
  }, [entries.length]);

  // Track scroll position to know if we should auto-scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      wasAtBottomRef.current = isAtBottom();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isAtBottom]);

  // Preserve scroll position when keyboard opens/closes
  useEffect(() => {
    if (keyboardVisible !== prevKeyboardVisible.current && containerRef.current) {
      // If keyboard is opening and user was at bottom, scroll to bottom after animation
      if (keyboardVisible && wasAtBottomRef.current) {
        const timer = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 350);
        return () => clearTimeout(timer);
      }
      // If keyboard is closing and user was at bottom, scroll to bottom
      if (!keyboardVisible && wasAtBottomRef.current) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
      }
    }
    prevKeyboardVisible.current = keyboardVisible;
  }, [keyboardVisible]);

  return (
    <div
      ref={containerRef}
      className="game-log-area flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-[var(--void)] overscroll-contain pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
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
