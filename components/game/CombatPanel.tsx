"use client";

import { useState } from "react";
import type { CombatSession, CombatParticipant } from "@/types/game";

interface CombatPanelProps {
  combat: CombatSession;
  playerId: string;
  onAction: (action: "attack" | "defend" | "skill" | "item" | "flee", targetId?: string) => void;
  isProcessing: boolean;
  lastNarrative?: string;
}

const ACTIONS: { value: "attack" | "defend" | "skill" | "flee"; label: string; icon: string; description: string }[] = [
  { value: "attack", label: "Attack", icon: "X", description: "Strike your target" },
  { value: "defend", label: "Defend", icon: "O", description: "Brace for impact" },
  { value: "skill", label: "Skill", icon: "*", description: "Use an ability" },
  { value: "flee", label: "Flee", icon: "<", description: "Attempt escape" },
];

function HealthBar({ current, max, isPlayer }: { current: number; max: number; isPlayer: boolean }) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  const color = isPlayer
    ? percent > 50 ? "var(--arcane)" : percent > 25 ? "var(--amber)" : "var(--crimson)"
    : "var(--crimson)";

  return (
    <div className="h-2 bg-[var(--stone)] rounded-full overflow-hidden">
      <div
        className="h-full transition-all duration-300"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ParticipantCard({
  participant,
  isCurrentTurn,
  isSelected,
  onClick,
}: {
  participant: CombatParticipant;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onClick?: () => void;
}) {
  const isEnemy = !participant.is_player;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        w-full p-3 rounded border text-left transition-all
        ${isCurrentTurn ? "border-[var(--amber)] bg-[var(--amber)]/10" : "border-[var(--stone)]"}
        ${isSelected ? "ring-2 ring-[var(--arcane)]" : ""}
        ${isEnemy && onClick ? "hover:border-[var(--crimson)] hover:bg-[var(--crimson)]/5 cursor-pointer" : ""}
        ${!onClick ? "cursor-default" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCurrentTurn && (
            <span className="text-[var(--amber)] animate-pulse">*</span>
          )}
          <span className={participant.is_player ? "text-[var(--arcane)]" : "text-[var(--crimson)]"}>
            {participant.name}
          </span>
        </div>
        <span className="text-[var(--mist)] text-sm font-mono">
          {participant.hp}/{participant.max_hp}
        </span>
      </div>
      <HealthBar current={participant.hp} max={participant.max_hp} isPlayer={participant.is_player} />
    </button>
  );
}

export function CombatPanel({
  combat,
  playerId,
  onAction,
  isProcessing,
  lastNarrative,
}: CombatPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const currentTurnParticipant = combat.participants[combat.current_turn_index];
  const isPlayerTurn = currentTurnParticipant?.id === playerId;
  const players = combat.participants.filter((p) => p.is_player);
  const enemies = combat.participants.filter((p) => !p.is_player);

  const handleAction = (action: "attack" | "defend" | "skill" | "flee") => {
    if (action === "attack" && !selectedTarget && enemies.length > 0) {
      // Auto-select first enemy if none selected
      onAction(action, enemies[0].id);
    } else {
      onAction(action, selectedTarget || undefined);
    }
  };

  const selectTarget = (targetId: string) => {
    setSelectedTarget(selectedTarget === targetId ? null : targetId);
  };

  // Combat ended states
  if (combat.state === "victory") {
    return (
      <div className="combat-panel p-6 text-center">
        <div className="text-[var(--amber)] text-4xl mb-4">V</div>
        <h2 className="text-[var(--amber)] text-xl font-bold mb-2">VICTORY</h2>
        <p className="text-[var(--text-dim)]">{lastNarrative || "You are victorious!"}</p>
      </div>
    );
  }

  if (combat.state === "defeat") {
    return (
      <div className="combat-panel p-6 text-center">
        <div className="text-[var(--crimson)] text-4xl mb-4">X</div>
        <h2 className="text-[var(--crimson)] text-xl font-bold mb-2">DEFEAT</h2>
        <p className="text-[var(--text-dim)]">{lastNarrative || "You have fallen..."}</p>
      </div>
    );
  }

  if (combat.state === "fled") {
    return (
      <div className="combat-panel p-6 text-center">
        <div className="text-[var(--mist)] text-4xl mb-4">&lt;</div>
        <h2 className="text-[var(--mist)] text-xl font-bold mb-2">ESCAPED</h2>
        <p className="text-[var(--text-dim)]">{lastNarrative || "You fled from battle."}</p>
      </div>
    );
  }

  return (
    <div className="combat-panel flex flex-col h-full">
      {/* Combat Header */}
      <div className="p-3 border-b border-[var(--stone)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[var(--crimson)] font-bold uppercase tracking-wider">COMBAT</span>
          <span className="text-[var(--mist)] text-sm">Round {combat.round}</span>
        </div>
        <div className="text-[var(--amber)] text-sm">
          {isPlayerTurn ? "Your Turn" : `${currentTurnParticipant?.name}'s Turn`}
        </div>
      </div>

      {/* Battlefield */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Narrative */}
        {lastNarrative && (
          <div className="mb-4 p-3 rounded bg-[var(--shadow)] border border-[var(--stone)]">
            <p className="text-[var(--amber)] text-sm italic">{lastNarrative}</p>
          </div>
        )}

        {/* Enemies */}
        <div className="mb-4">
          <div className="text-[var(--mist)] text-xs uppercase tracking-wider mb-2">Enemies</div>
          <div className="grid gap-2">
            {enemies.map((enemy) => (
              <ParticipantCard
                key={enemy.id}
                participant={enemy}
                isCurrentTurn={currentTurnParticipant?.id === enemy.id}
                isSelected={selectedTarget === enemy.id}
                onClick={isPlayerTurn && enemy.hp > 0 ? () => selectTarget(enemy.id) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-[var(--stone)]" />
          <span className="text-[var(--mist)] text-xs">VS</span>
          <div className="flex-1 h-px bg-[var(--stone)]" />
        </div>

        {/* Players */}
        <div>
          <div className="text-[var(--mist)] text-xs uppercase tracking-wider mb-2">Allies</div>
          <div className="grid gap-2">
            {players.map((player) => (
              <ParticipantCard
                key={player.id}
                participant={player}
                isCurrentTurn={currentTurnParticipant?.id === player.id}
                isSelected={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isPlayerTurn && (
        <div className="p-3 border-t border-[var(--stone)]">
          <div className="grid grid-cols-4 gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action.value}
                onClick={() => handleAction(action.value)}
                disabled={isProcessing}
                className="p-3 rounded border border-[var(--stone)] hover:border-[var(--amber)] hover:bg-[var(--amber)]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                title={action.description}
              >
                <div className="text-[var(--amber)] text-lg font-mono mb-1">{action.icon}</div>
                <div className="text-[var(--text-dim)] text-xs">{action.label}</div>
              </button>
            ))}
          </div>
          {selectedTarget && (
            <div className="mt-2 text-center text-[var(--mist)] text-xs">
              Target: {enemies.find((e) => e.id === selectedTarget)?.name}
            </div>
          )}
        </div>
      )}

      {/* Waiting for turn */}
      {!isPlayerTurn && (
        <div className="p-4 border-t border-[var(--stone)] text-center">
          <div className="text-[var(--mist)] animate-pulse">
            Waiting for {currentTurnParticipant?.name}...
          </div>
        </div>
      )}
    </div>
  );
}
