"use client";

import { useState, useRef, useEffect } from "react";
import type { WorldChatterEvent } from "@/lib/useWebSocket";

interface ChatterMessage extends WorldChatterEvent {
  id: string;
}

interface WorldChatterProps {
  messages: ChatterMessage[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMute?: () => void;
  isMuted?: boolean;
}

// Icons for chatter types
const CHATTER_ICONS: Record<WorldChatterEvent["chatter_type"], string> = {
  gossip: "~",
  news: "!",
  ambiance: "*",
  event: "+",
};

// Style by priority: 7+ highlight, 5-6 normal, 1-4 subtle
function getPriorityStyle(priority: number): string {
  if (priority >= 7) return "text-[var(--amber)] font-medium";
  if (priority >= 5) return "text-[var(--text)]";
  return "text-[var(--fog)] opacity-80";
}

export function WorldChatter({
  messages,
  isCollapsed,
  onToggleCollapse,
  onMute,
  isMuted = false,
}: WorldChatterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll to bottom on new messages (unless user is hovering/reading)
  useEffect(() => {
    if (scrollRef.current && !isHovered) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isHovered]);

  // Don't render at all if muted and collapsed
  if (isMuted && isCollapsed) return null;

  return (
    <div className="border-t border-[var(--slate)] bg-[var(--shadow)] flex flex-col shrink-0">
      {/* Header bar - always visible */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--slate)]/50">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs uppercase tracking-wider"
        >
          <span className="text-[var(--fog)]">{isCollapsed ? "+" : "-"}</span>
          <span>World Whispers</span>
          {messages.length > 0 && isCollapsed && (
            <span className="text-[var(--amber)] animate-pulse">
              ({messages.length})
            </span>
          )}
        </button>
        {onMute && (
          <button
            onClick={onMute}
            className={`text-xs ${
              isMuted ? "text-[var(--crimson)]" : "text-[var(--fog)]"
            } hover:text-[var(--amber)] transition-colors`}
            title={isMuted ? "Unmute whispers" : "Mute whispers"}
          >
            {isMuted ? "[MUTED]" : "[mute]"}
          </button>
        )}
      </div>

      {/* Messages area - collapsible */}
      {!isCollapsed && !isMuted && (
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="h-[15vh] min-h-[80px] max-h-[150px] overflow-y-auto px-3 py-2 space-y-1.5"
        >
          {messages.length === 0 ? (
            <div className="text-[var(--fog)] text-xs italic">
              Listening to the world...
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-xs leading-relaxed ${getPriorityStyle(msg.priority)}`}
              >
                <span className="text-[var(--fog)] mr-1.5">
                  {CHATTER_ICONS[msg.chatter_type]}
                </span>
                <span className="italic">&ldquo;{msg.message}&rdquo;</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
