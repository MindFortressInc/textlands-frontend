"use client";

import { useState } from "react";

interface QuickActionsProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

type ActionMode = "move" | "actions";

const DIRECTIONS = [
  { label: "N", command: "north", key: "n" },
  { label: "W", command: "west", key: "w" },
  { label: "E", command: "east", key: "e" },
  { label: "S", command: "south", key: "s" },
] as const;

const QUICK_COMMANDS = [
  { label: "Look", command: "look", icon: "◎" },
  { label: "Inv", command: "inventory", icon: "▤" },
  { label: "Stats", command: "stats", icon: "◈" },
  { label: "Help", command: "help", icon: "?" },
] as const;

export function QuickActions({ onCommand, disabled = false }: QuickActionsProps) {
  const [mode, setMode] = useState<ActionMode>("move");

  const handleAction = (command: string) => {
    if (!disabled) {
      onCommand(command);
    }
  };

  return (
    <div className="md:hidden bg-[var(--shadow)] border-t border-[var(--slate)] shrink-0">
      {/* Mode tabs */}
      <div className="flex border-b border-[var(--slate)]">
        <button
          onClick={() => setMode("move")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            mode === "move"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] -mb-px"
              : "text-[var(--mist)]"
          }`}
        >
          Move
        </button>
        <button
          onClick={() => setMode("actions")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            mode === "actions"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] -mb-px"
              : "text-[var(--mist)]"
          }`}
        >
          Actions
        </button>
      </div>

      {/* Content */}
      <div className="p-2">
        {mode === "move" ? (
          /* Directional pad layout */
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-1 w-fit">
              {/* Top row - just N */}
              <div />
              <DirectionButton
                label="N"
                command="north"
                onClick={handleAction}
                disabled={disabled}
              />
              <div />

              {/* Middle row - W, Look, E */}
              <DirectionButton
                label="W"
                command="west"
                onClick={handleAction}
                disabled={disabled}
              />
              <button
                onClick={() => handleAction("look")}
                disabled={disabled}
                className="quick-btn w-12 h-12 flex items-center justify-center text-[var(--arcane)] disabled:opacity-40"
                title="Look around"
              >
                ◎
              </button>
              <DirectionButton
                label="E"
                command="east"
                onClick={handleAction}
                disabled={disabled}
              />

              {/* Bottom row - just S */}
              <div />
              <DirectionButton
                label="S"
                command="south"
                onClick={handleAction}
                disabled={disabled}
              />
              <div />
            </div>
          </div>
        ) : (
          /* Quick action buttons */
          <div className="grid grid-cols-4 gap-2">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleAction(cmd.command)}
                disabled={disabled}
                className="quick-btn h-11 flex flex-col items-center justify-center gap-0.5 disabled:opacity-40"
              >
                <span className="text-[var(--arcane)] text-base">{cmd.icon}</span>
                <span className="text-[10px] text-[var(--mist)]">{cmd.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DirectionButton({
  label,
  command,
  onClick,
  disabled,
}: {
  label: string;
  command: string;
  onClick: (cmd: string) => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={() => onClick(command)}
      disabled={disabled}
      className="quick-btn w-12 h-12 flex items-center justify-center text-[var(--amber)] font-bold disabled:opacity-40"
      title={`Go ${command}`}
    >
      {label}
    </button>
  );
}
