"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type {
  Party,
  PartyPlayerMember,
  PartyNpcMember,
  PartyNpcDetail,
  BehaviorMode,
  LoyaltyLevel,
} from "@/lib/api";

interface PartyTabProps {
  playerId?: string;
}

const ROLE_COLORS: Record<string, string> = {
  tank: "var(--crimson)",
  healer: "var(--arcane)",
  dps: "var(--amber)",
  support: "#a78bfa", // purple
};

const ROLE_LABELS: Record<string, string> = {
  tank: "TNK",
  healer: "HLR",
  dps: "DPS",
  support: "SUP",
};

const LOYALTY_COLORS: Record<LoyaltyLevel, string> = {
  devoted: "#22c55e",
  loyal: "var(--arcane)",
  neutral: "var(--mist)",
  suspicious: "var(--amber)",
  leaving: "var(--crimson)",
};

function getLoyaltyLevel(loyalty: number): LoyaltyLevel {
  if (loyalty >= 0.8) return "devoted";
  if (loyalty >= 0.6) return "loyal";
  if (loyalty >= 0.4) return "neutral";
  if (loyalty >= 0.2) return "suspicious";
  return "leaving";
}

function getMoraleStatus(morale: number): { label: string; color: string } {
  if (morale >= 0.7) return { label: "High", color: "#22c55e" };
  if (morale >= 0.4) return { label: "OK", color: "var(--amber)" };
  if (morale >= 0.2) return { label: "Low", color: "var(--crimson)" };
  return { label: "Critical", color: "var(--crimson)" };
}

export function PartyTab({ playerId }: PartyTabProps) {
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<PartyNpcDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadParty = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getParty();
      setParty(res.party);
    } catch {
      setError("Failed to load party");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadParty();
    const interval = setInterval(loadParty, 30000);
    return () => clearInterval(interval);
  }, [loadParty]);

  const openNpcDetail = async (entityId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getPartyNpcDetail(entityId);
      setSelectedNpc(detail);
    } catch {
      console.error("[Party] Failed to load NPC detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!playerId) {
    return (
      <div className="p-4 text-center">
        <div className="text-[var(--mist)] text-xs">Sign in to view party</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="text-[var(--mist)] text-xs animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-[var(--crimson)] text-xs">{error}</div>
      </div>
    );
  }

  // NPC Detail View
  if (selectedNpc) {
    return (
      <NpcDetailView
        npc={selectedNpc}
        onBack={() => setSelectedNpc(null)}
        onRefresh={loadParty}
      />
    );
  }

  if (!party) {
    return (
      <div className="p-4 text-center stagger-fade-in">
        <div className="text-[var(--mist)] text-xs mb-2">No party</div>
        <div className="text-[10px] text-[var(--mist)]">
          Recruit NPCs or invite players in-game to form a party
        </div>
      </div>
    );
  }

  const totalMembers = party.players.length + party.npcs.length;

  return (
    <div className="stagger-fade-in">
      {/* Party Header */}
      <div className="px-3 py-2 border-b border-[var(--slate)] bg-[var(--stone)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="party-icon">&#9733;</span>
            <span className="text-xs text-[var(--amber)] font-medium truncate">
              {party.name}
            </span>
          </div>
          <div className="text-[10px] text-[var(--mist)]">
            {totalMembers}/{party.max_size}
          </div>
        </div>
      </div>

      {/* Players Section */}
      {party.players.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[10px] text-[var(--mist)] uppercase tracking-wider bg-[var(--shadow)] flex items-center gap-1.5">
            <span className="player-icon">&#9679;</span>
            <span>Players — {party.players.length}</span>
          </div>
          {party.players.map((player) => (
            <PlayerMemberCard
              key={player.player_id}
              player={player}
              isCurrentPlayer={player.player_id === playerId}
            />
          ))}
        </div>
      )}

      {/* NPCs Section */}
      {party.npcs.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[10px] text-[var(--mist)] uppercase tracking-wider bg-[var(--shadow)] flex items-center gap-1.5">
            <span className="npc-icon" style={{ color: "var(--entity-npc)" }}>&#9670;</span>
            <span>Companions — {party.npcs.length}</span>
          </div>
          {party.npcs.map((npc) => (
            <NpcMemberCard
              key={npc.entity_id}
              npc={npc}
              onClick={() => openNpcDetail(npc.entity_id)}
              loading={loadingDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Player member card
function PlayerMemberCard({
  player,
  isCurrentPlayer,
}: {
  player: PartyPlayerMember;
  isCurrentPlayer: boolean;
}) {
  return (
    <div className="party-member-card px-3 py-2 border-b border-[var(--slate)] last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        {/* Online indicator */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            player.is_online ? "bg-green-500 online-pulse" : "bg-[var(--slate)]"
          }`}
        />
        {/* Name */}
        <span
          className={`text-xs flex-1 truncate ${
            player.is_online ? "text-[var(--text)]" : "text-[var(--mist)]"
          }`}
        >
          {player.name}
          {isCurrentPlayer && (
            <span className="text-[var(--mist)]"> (you)</span>
          )}
        </span>
        {/* Leader badge */}
        {player.is_leader && (
          <span className="text-[9px] px-1.5 py-0.5 bg-[var(--amber-dim)] text-[var(--amber)] rounded">
            LEADER
          </span>
        )}
        {/* Level */}
        {player.level && (
          <span className="text-[10px] text-[var(--mist)]">Lv.{player.level}</span>
        )}
      </div>
      {/* HP Bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[var(--mist)] w-6">HP</span>
        <div className="flex-1 stat-bar hp-bar">
          <div
            className="stat-bar-fill"
            style={{ width: `${player.hp_percent}%` }}
          />
        </div>
        <span className="text-[9px] text-[var(--mist)] w-12 text-right">
          {player.hp}/{player.max_hp}
        </span>
      </div>
    </div>
  );
}

// NPC member card
function NpcMemberCard({
  npc,
  onClick,
  loading,
}: {
  npc: PartyNpcMember;
  onClick: () => void;
  loading: boolean;
}) {
  const loyaltyLevel = getLoyaltyLevel(npc.loyalty);
  const loyaltyColor = LOYALTY_COLORS[loyaltyLevel];
  const moraleStatus = getMoraleStatus(npc.morale);
  const isWarning = loyaltyLevel === "suspicious" || loyaltyLevel === "leaving";
  const isCritical = loyaltyLevel === "leaving" || npc.morale < 0.2;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`party-member-card npc-card w-full px-3 py-2 border-b border-[var(--slate)] last:border-0 text-left hover:bg-[var(--stone)] transition-colors group ${
        isCritical ? "npc-critical" : ""
      } ${!npc.is_alive ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {/* Role badge */}
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold"
          style={{
            backgroundColor: `${ROLE_COLORS[npc.role]}20`,
            color: ROLE_COLORS[npc.role],
            border: `1px solid ${ROLE_COLORS[npc.role]}40`,
          }}
        >
          {ROLE_LABELS[npc.role]}
        </span>
        {/* Name */}
        <span className="text-xs text-[var(--text)] flex-1 truncate group-hover:text-[var(--amber)] transition-colors">
          {npc.name}
        </span>
        {/* Warning indicator */}
        {isWarning && (
          <span className="loyalty-warning text-[10px]">
            {loyaltyLevel === "leaving" ? "!!!" : "!"}
          </span>
        )}
        {/* Behavior mode */}
        <BehaviorBadge mode={npc.behavior_mode} />
        {/* Arrow */}
        <span className="text-[var(--mist)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          &gt;
        </span>
      </div>

      {/* HP Bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] text-[var(--mist)] w-6">HP</span>
        <div className="flex-1 stat-bar hp-bar">
          <div
            className="stat-bar-fill"
            style={{ width: `${npc.hp_percent}%` }}
          />
        </div>
        <span className="text-[9px] text-[var(--mist)] w-12 text-right">
          {npc.hp}/{npc.max_hp}
        </span>
      </div>

      {/* Loyalty & Morale */}
      <div className="flex gap-3">
        {/* Loyalty */}
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[9px] text-[var(--mist)]">Loyalty</span>
          <div className="flex-1 h-1 bg-[var(--shadow)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${npc.loyalty * 100}%`,
                backgroundColor: loyaltyColor,
              }}
            />
          </div>
        </div>
        {/* Morale */}
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[9px] text-[var(--mist)]">Morale</span>
          <div className="flex-1 h-1 bg-[var(--shadow)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${npc.morale * 100}%`,
                backgroundColor: moraleStatus.color,
              }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

// Behavior mode badge
function BehaviorBadge({ mode }: { mode: BehaviorMode }) {
  const config = {
    ai_controlled: { label: "AUTO", color: "var(--mist)" },
    player_orders: { label: "CMD", color: "var(--arcane)" },
    defensive: { label: "DEF", color: "var(--amber)" },
  };
  const { label, color } = config[mode];

  return (
    <span
      className="text-[8px] px-1 py-0.5 rounded uppercase tracking-wider"
      style={{ color, borderColor: color, border: "1px solid" }}
    >
      {label}
    </span>
  );
}

// NPC Detail View
function NpcDetailView({
  npc,
  onBack,
  onRefresh,
}: {
  npc: PartyNpcDetail;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [changingBehavior, setChangingBehavior] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);

  const loyaltyLevel = getLoyaltyLevel(npc.loyalty);
  const loyaltyColor = LOYALTY_COLORS[loyaltyLevel];
  const moraleStatus = getMoraleStatus(npc.morale);

  const handleBehaviorChange = async (mode: BehaviorMode) => {
    setChangingBehavior(true);
    try {
      await api.setNpcBehavior(npc.entity_id, mode);
      onRefresh();
    } catch {
      console.error("[Party] Failed to change behavior");
    } finally {
      setChangingBehavior(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await api.dismissNpc(npc.entity_id);
      onBack();
      onRefresh();
    } catch {
      console.error("[Party] Failed to dismiss NPC");
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="flex flex-col h-full stagger-fade-in">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--slate)] flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-[var(--mist)] hover:text-[var(--text)] transition-colors"
        >
          &lt;
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--amber)] font-medium truncate">
            {npc.name}
          </div>
          <div className="text-[10px] text-[var(--mist)] capitalize">
            {npc.combat_role}
          </div>
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded capitalize"
          style={{ color: loyaltyColor, border: `1px solid ${loyaltyColor}` }}
        >
          {loyaltyLevel}
        </span>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Stats */}
        <div className="space-y-2">
          {/* Loyalty */}
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-[var(--mist)]">Loyalty</span>
              <span style={{ color: loyaltyColor }}>
                {Math.round(npc.loyalty * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-[var(--shadow)] border border-[var(--slate)] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${npc.loyalty * 100}%`,
                  backgroundColor: loyaltyColor,
                }}
              />
            </div>
          </div>

          {/* Morale */}
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-[var(--mist)]">Morale</span>
              <span style={{ color: moraleStatus.color }}>
                {moraleStatus.label}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--shadow)] border border-[var(--slate)] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${npc.morale * 100}%`,
                  backgroundColor: moraleStatus.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Identity Section */}
        <div className="border border-[var(--slate)] rounded p-2 bg-[var(--shadow)]">
          <div className="text-[10px] text-[var(--mist)] uppercase tracking-wider mb-1.5">
            Identity
          </div>
          <div className="text-[11px] text-[var(--fog)] leading-relaxed">
            {npc.identity.personality}
          </div>
          {npc.identity.motivations && (
            <div className="text-[10px] text-[var(--mist)] mt-1.5 italic">
              &ldquo;{npc.identity.motivations}&rdquo;
            </div>
          )}
        </div>

        {/* Abilities */}
        {npc.abilities.length > 0 && (
          <div>
            <div className="text-[10px] text-[var(--mist)] uppercase tracking-wider mb-1.5">
              Abilities
            </div>
            <div className="flex flex-wrap gap-1">
              {npc.abilities.map((ability) => (
                <span
                  key={ability}
                  className="text-[10px] px-1.5 py-0.5 bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--fog)]"
                >
                  {ability}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Behavior Mode */}
        <div>
          <div className="text-[10px] text-[var(--mist)] uppercase tracking-wider mb-1.5">
            Behavior Mode
          </div>
          <div className="flex gap-1">
            {(["ai_controlled", "player_orders", "defensive"] as BehaviorMode[]).map(
              (mode) => {
                const labels = {
                  ai_controlled: "Auto",
                  player_orders: "Orders",
                  defensive: "Defensive",
                };
                const isActive = npc.standing_orders && mode === "player_orders";
                return (
                  <button
                    key={mode}
                    onClick={() => handleBehaviorChange(mode)}
                    disabled={changingBehavior}
                    className={`flex-1 px-2 py-1.5 text-[10px] border rounded transition-colors disabled:opacity-50 ${
                      isActive
                        ? "bg-[var(--arcane)] bg-opacity-20 border-[var(--arcane)] text-[var(--arcane)]"
                        : "bg-[var(--stone)] border-[var(--slate)] text-[var(--mist)] hover:text-[var(--fog)] hover:border-[var(--fog)]"
                    }`}
                  >
                    {labels[mode]}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Recent Loyalty Events */}
        {npc.recent_loyalty_events.length > 0 && (
          <div>
            <div className="text-[10px] text-[var(--mist)] uppercase tracking-wider mb-1.5">
              Recent Events
            </div>
            <div className="space-y-1">
              {npc.recent_loyalty_events.slice(0, 3).map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[10px] text-[var(--fog)]"
                >
                  <span
                    className={`${
                      event.delta > 0 ? "text-green-500" : "text-[var(--crimson)]"
                    }`}
                  >
                    {event.delta > 0 ? "+" : ""}
                    {Math.round(event.delta * 100)}%
                  </span>
                  <span className="flex-1 truncate">{event.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Hint */}
        {npc.has_unshared_knowledge && (
          <div className="knowledge-hint flex items-center gap-2 p-2 border border-[var(--amber-dim)] bg-[var(--amber-dim)] bg-opacity-10 rounded">
            <span className="text-[var(--amber)]">*</span>
            <span className="text-[10px] text-[var(--fog)]">
              {npc.name} has knowledge to share.
              <span className="text-[var(--mist)]">
                {" "}
                (Rest at campfire to unlock)
              </span>
            </span>
          </div>
        )}

        {/* Time in Party */}
        <div className="text-[10px] text-[var(--mist)] text-center">
          In party for {Math.round(npc.time_in_party_hours)} hours
        </div>
      </div>

      {/* Footer - Dismiss */}
      <div className="p-2 border-t border-[var(--slate)]">
        {confirmDismiss ? (
          <div className="flex gap-1">
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="flex-1 px-2 py-1.5 text-[10px] bg-[var(--crimson)] bg-opacity-20 border border-[var(--crimson)] rounded text-[var(--crimson)] hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
              {dismissing ? "..." : "Confirm Dismiss"}
            </button>
            <button
              onClick={() => setConfirmDismiss(false)}
              className="px-3 py-1.5 text-[10px] bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--fog)] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDismiss(true)}
            className="w-full px-2 py-1.5 text-[10px] bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--crimson)] hover:border-[var(--crimson)] transition-colors"
          >
            Dismiss from Party
          </button>
        )}
      </div>
    </div>
  );
}
