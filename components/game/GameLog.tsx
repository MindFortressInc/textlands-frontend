"use client";

import { useEffect, useRef } from "react";
import type { GameLogEntry } from "@/types/game";

interface GameLogProps {
  entries: GameLogEntry[];
}

const typeStyles: Record<GameLogEntry["type"], string> = {
  narrative: "text-[var(--amber)]",
  combat: "text-[var(--crimson)]",
  dialogue: "text-[var(--arcane)]",
  system: "text-[var(--mist)]",
  action: "text-[var(--fog)]",
};

export function GameLog({ entries }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--void)]">
      {entries.length === 0 && (
        <div className="text-[var(--mist)]">Awaiting input...</div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className={`${typeStyles[entry.type]} leading-relaxed`}>
          {entry.type === "dialogue" && entry.actor && (
            <span className="text-[var(--arcane)] font-bold">{entry.actor}: </span>
          )}
          {entry.type === "action" && <span className="text-[var(--mist)]">&gt; </span>}
          {entry.type === "system" && <span className="text-[var(--mist)]">[</span>}
          <span className="whitespace-pre-wrap">{entry.content}</span>
          {entry.type === "system" && <span className="text-[var(--mist)]">]</span>}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
