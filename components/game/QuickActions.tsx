"use client";

import { useState } from "react";

interface QuickActionsProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
  onTimelineClick?: () => void;
  hasExaminedEntity?: boolean;
}

const QUICK_COMMANDS = [
  { label: "Look", command: "look", icon: "◎" },
  { label: "Inv", command: "inventory", icon: "▤" },
  { label: "Stats", command: "stats", icon: "◈" },
  { label: "Help", command: "help", icon: "?" },
] as const;

export function QuickActions({ onCommand, disabled = false, onTimelineClick, hasExaminedEntity }: QuickActionsProps) {
  const [expanded, setExpanded] = useState(false);

  const handleAction = (command: string) => {
    if (!disabled) {
      onCommand(command);
    }
  };

  return (
    <div className="md:hidden bg-[var(--shadow)] border-t border-[var(--slate)] shrink-0 overflow-hidden">
      {/* Collapsed toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[var(--mist)] hover:text-[var(--amber)] transition-colors active:bg-[var(--slate)]/20"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse quick actions" : "Expand quick actions"}
      >
        <span className="text-[10px] uppercase tracking-widest opacity-60">Quick</span>
        <span
          className="text-xs transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>

      {/* Expandable action row */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-center gap-1 px-3 pb-2 pt-0.5">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleAction(cmd.command)}
                disabled={disabled}
                className="flex-1 max-w-16 h-9 flex items-center justify-center gap-1.5
                  bg-[var(--void)]/50 border border-[var(--slate)]/50 rounded
                  text-[var(--arcane)] hover:text-[var(--amber)] hover:border-[var(--amber)]/30
                  disabled:opacity-40 disabled:pointer-events-none
                  transition-colors active:bg-[var(--slate)]/30"
                title={cmd.label}
              >
                <span className="text-sm">{cmd.icon}</span>
                <span className="text-[9px] text-[var(--mist)] uppercase tracking-wide">{cmd.label}</span>
              </button>
            ))}
            {onTimelineClick && hasExaminedEntity && (
              <button
                onClick={onTimelineClick}
                disabled={disabled}
                className="flex-1 max-w-16 h-9 flex items-center justify-center gap-1.5
                  bg-[var(--void)]/50 border border-[var(--amber)]/30 rounded
                  text-[var(--amber)] hover:border-[var(--amber)]/60
                  disabled:opacity-40 disabled:pointer-events-none
                  transition-colors active:bg-[var(--slate)]/30"
                title="View entity history"
              >
                <span className="text-sm">⧗</span>
                <span className="text-[9px] text-[var(--mist)] uppercase tracking-wide">History</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
