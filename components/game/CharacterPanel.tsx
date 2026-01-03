"use client";

import { useState, useEffect } from "react";
import type { Character, CharacterProfile, SkillXPGain } from "@/types/game";
import type { PlayerInfluence, LocationFootprint, Relationship, RelationshipListResponse } from "@/lib/api";
import { InfluenceBadge } from "./InfluenceBadge";
import { SkillsTab } from "./SkillsTab";
import { LoreTab } from "./LoreTab";
import { FrontierIndicator } from "./FrontierIndicator";
import { WorldTimeDisplay } from "./WorldTimeDisplay";
import { MapModal } from "./MapModal";
import * as api from "@/lib/api";

interface CharacterPanelProps {
  character: Character | null;
  zoneName?: string;
  influence?: PlayerInfluence | null;
  onLeaderboardClick?: () => void;
  onStatsClick?: () => void;
  footprints?: LocationFootprint[];
  onLeaveMessage?: (message: string) => Promise<void>;
  loadingFootprints?: boolean;
  worldId?: string | null;
  playerId?: string | null;
  recentXPGain?: SkillXPGain | null;
  landKey?: string | null;
}

type TabType = "stats" | "skills" | "lore" | "profile";

function StatBar({ current, max, type }: { current: number; max: number; type: "hp" | "mana" | "xp" }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className={`stat-bar ${type}-bar`}>
      <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Disposition colors and labels
const DISPOSITION_CONFIG: Record<string, { color: string; icon: string }> = {
  loyal: { color: "var(--amber)", icon: "♥" },
  friendly: { color: "#22c55e", icon: "☺" },
  neutral: { color: "var(--mist)", icon: "○" },
  wary: { color: "#f59e0b", icon: "◐" },
  hostile: { color: "var(--crimson)", icon: "☠" },
};

// Relationships Section Component
function RelationshipsSection({
  worldId,
}: {
  worldId: string | null;
}) {
  const [relationships, setRelationships] = useState<RelationshipListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState<Relationship | null>(null);

  useEffect(() => {
    if (!worldId || !expanded) return;
    if (relationships) return; // Already loaded

    setLoading(true);
    setError(null);

    api.getRelationships(worldId, { min_familiarity: 0, limit: 50 })
      .then(setRelationships)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [worldId, expanded, relationships]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  if (!worldId) return null;

  // Detail view for selected NPC
  if (selectedNpc) {
    const config = DISPOSITION_CONFIG[selectedNpc.disposition] || DISPOSITION_CONFIG.neutral;
    return (
      <div className="border-t border-[var(--slate)]">
        {/* Back button */}
        <button
          onClick={() => setSelectedNpc(null)}
          className="w-full p-2 flex items-center gap-2 hover:bg-[var(--stone)] transition-colors text-left border-b border-[var(--slate)]"
        >
          <span className="text-[var(--mist)]">&lt;</span>
          <span className="text-[var(--fog)]">{selectedNpc.npc_name || "Unknown"}</span>
        </button>

        {/* Disposition */}
        <div className="p-3 border-b border-[var(--slate)]">
          <div className="flex items-center gap-2">
            <span style={{ color: config.color }}>{config.icon}</span>
            <span className="text-[var(--fog)] capitalize">{selectedNpc.disposition}</span>
            <span className="text-[var(--mist)] text-[10px]">
              ({selectedNpc.relationship_type})
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="p-3 border-b border-[var(--slate)] space-y-2">
          <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[var(--mist)]">Trust</span>
              <span className="text-[var(--fog)]">{selectedNpc.metrics.trust}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mist)]">Respect</span>
              <span className="text-[var(--fog)]">{selectedNpc.metrics.respect}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mist)]">Familiarity</span>
              <span className="text-[var(--fog)]">{selectedNpc.metrics.familiarity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mist)]">Debt</span>
              <span className={selectedNpc.metrics.debt_balance > 0 ? "text-[#22c55e]" : selectedNpc.metrics.debt_balance < 0 ? "text-[var(--crimson)]" : "text-[var(--fog)]"}>
                {selectedNpc.metrics.debt_balance > 0 ? `+${selectedNpc.metrics.debt_balance}` : selectedNpc.metrics.debt_balance}
              </span>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="p-3 border-b border-[var(--slate)]">
          <div className="flex flex-wrap gap-1">
            {selectedNpc.flags.is_confidant && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[var(--amber)] text-[var(--void)]">Confidant</span>
            )}
            {selectedNpc.flags.npc_owes_favor && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[#22c55e] text-[var(--void)]">Owes You</span>
            )}
            {selectedNpc.flags.player_owes_favor && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[var(--crimson)] text-[var(--void)]">You Owe</span>
            )}
            {selectedNpc.flags.betrayal_risk && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[#f59e0b] text-[var(--void)]">Betrayal Risk</span>
            )}
            {selectedNpc.flags.will_share_secrets && (
              <span className="px-1.5 py-0.5 text-[10px] border border-[var(--slate)] text-[var(--fog)]">Shares Secrets</span>
            )}
          </div>
        </div>

        {/* Memorable Moments */}
        {selectedNpc.memorable_moments.length > 0 && (
          <div className="p-3">
            <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">Memorable Moments</div>
            <div className="space-y-2">
              {selectedNpc.memorable_moments.slice(0, 5).map((moment, i) => (
                <div key={i} className="pl-2 border-l-2 border-[var(--slate)]">
                  <div className="text-[var(--fog)] text-[10px]">{moment.event}</div>
                  {moment.description && (
                    <div className="text-[var(--mist)] text-[10px]">{moment.description}</div>
                  )}
                  <div className="text-[var(--mist)] text-[9px] mt-0.5">
                    {moment.trust_impact !== 0 && (
                      <span className={moment.trust_impact > 0 ? "text-[#22c55e]" : "text-[var(--crimson)]"}>
                        Trust {moment.trust_impact > 0 ? "+" : ""}{moment.trust_impact}
                      </span>
                    )}
                    {moment.trust_impact !== 0 && moment.respect_impact !== 0 && " · "}
                    {moment.respect_impact !== 0 && (
                      <span className={moment.respect_impact > 0 ? "text-[#22c55e]" : "text-[var(--crimson)]"}>
                        Respect {moment.respect_impact > 0 ? "+" : ""}{moment.respect_impact}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="p-3 border-t border-[var(--slate)] bg-[var(--stone)]">
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--mist)]">Interactions</span>
            <span className="text-[var(--fog)]">{selectedNpc.interaction_count}</span>
          </div>
          {selectedNpc.last_interaction && (
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-[var(--mist)]">Last Seen</span>
              <span className="text-[var(--fog)]">{formatTimeAgo(selectedNpc.last_interaction)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="border-t border-[var(--slate)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-[var(--stone)] transition-colors"
      >
        <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider">
          Relationships
        </div>
        <div className="flex items-center gap-2">
          {relationships?.summary && (
            <span className="text-[var(--mist)] text-[10px]">
              {relationships.summary.total}
            </span>
          )}
          <span className="text-[var(--mist)]">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="pb-2">
          {loading ? (
            <div className="px-3 py-2 text-[var(--mist)] text-xs animate-pulse">Loading...</div>
          ) : error ? (
            <div className="px-3 py-2 text-[var(--crimson)] text-xs">{error}</div>
          ) : !relationships || relationships.relationships.length === 0 ? (
            <div className="px-3 py-2 text-[var(--mist)] text-xs">No relationships yet</div>
          ) : (
            <>
              {/* Summary badges */}
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {relationships.summary.confidants > 0 && (
                  <span className="text-[10px] text-[var(--amber)]">
                    {relationships.summary.confidants} confidant{relationships.summary.confidants > 1 ? "s" : ""}
                  </span>
                )}
                {relationships.summary.friends > 0 && (
                  <span className="text-[10px] text-[#22c55e]">
                    {relationships.summary.friends} friend{relationships.summary.friends > 1 ? "s" : ""}
                  </span>
                )}
                {relationships.summary.rivals > 0 && (
                  <span className="text-[10px] text-[#f59e0b]">
                    {relationships.summary.rivals} rival{relationships.summary.rivals > 1 ? "s" : ""}
                  </span>
                )}
                {relationships.summary.enemies > 0 && (
                  <span className="text-[10px] text-[var(--crimson)]">
                    {relationships.summary.enemies} enem{relationships.summary.enemies > 1 ? "ies" : "y"}
                  </span>
                )}
              </div>

              {/* NPC list */}
              <div className="space-y-0.5">
                {relationships.relationships.slice(0, 10).map((rel) => {
                  const config = DISPOSITION_CONFIG[rel.disposition] || DISPOSITION_CONFIG.neutral;
                  return (
                    <button
                      key={rel.id}
                      onClick={() => setSelectedNpc(rel)}
                      className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[var(--stone)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: config.color }}>{config.icon}</span>
                        <span className="text-[var(--fog)] text-xs truncate">
                          {rel.npc_name || "Unknown"}
                        </span>
                        {rel.npc_occupation && (
                          <span className="text-[var(--mist)] text-[10px]">
                            {rel.npc_occupation}
                          </span>
                        )}
                      </div>
                      <span className="text-[var(--mist)]">&gt;</span>
                    </button>
                  );
                })}
              </div>

              {relationships.relationships.length > 10 && (
                <div className="px-3 pt-2 text-[var(--mist)] text-[10px]">
                  +{relationships.relationships.length - 10} more
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ profile, loading, worldId }: { profile: CharacterProfile | null; loading: boolean; worldId: string | null }) {
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs animate-pulse">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs">
        No profile data
      </div>
    );
  }

  const { identity, state, recent_events } = profile;

  return (
    <div className="flex flex-col text-xs overflow-hidden">
      {/* One-liner */}
      {profile.one_liner && (
        <div className="p-3 border-b border-[var(--slate)] bg-[var(--stone)]">
          <div className="text-[var(--fog)] italic leading-relaxed">
            {profile.one_liner}
          </div>
        </div>
      )}

      {/* Identity */}
      <div className="p-3 space-y-2 border-b border-[var(--slate)]">
        <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">Identity</div>

        <div className="grid grid-cols-2 gap-1 text-[var(--mist)]">
          <span>Species</span>
          <span className="text-[var(--fog)]">{identity.species}</span>
          <span>Gender</span>
          <span className="text-[var(--fog)]">{identity.gender}</span>
          {identity.age_apparent && (
            <>
              <span>Age</span>
              <span className="text-[var(--fog)]">{identity.age_apparent}</span>
            </>
          )}
        </div>

        {identity.physical && (
          <div className="pt-2 mt-2 border-t border-[var(--slate)] space-y-1">
            {identity.physical.build && (
              <div className="text-[var(--fog)]">{identity.physical.build} build</div>
            )}
            {identity.physical.hair && (
              <div className="text-[var(--mist)]">Hair: <span className="text-[var(--fog)]">{identity.physical.hair}</span></div>
            )}
            {identity.physical.eyes && (
              <div className="text-[var(--mist)]">Eyes: <span className="text-[var(--fog)]">{identity.physical.eyes}</span></div>
            )}
            {identity.physical.distinguishing_features && identity.physical.distinguishing_features.length > 0 && (
              <div className="text-[var(--mist)]">
                {identity.physical.distinguishing_features.map((f, i) => (
                  <div key={i} className="text-[var(--fog)]">• {f}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {identity.personality_core && identity.personality_core.length > 0 && (
          <div className="pt-2 mt-2 border-t border-[var(--slate)]">
            <div className="flex flex-wrap gap-1">
              {identity.personality_core.map((trait, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-[var(--stone)] border border-[var(--slate)] text-[var(--fog)] text-[10px]"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {identity.voice && (
          <div className="pt-2 mt-2 border-t border-[var(--slate)] text-[var(--mist)]">
            Voice: <span className="text-[var(--fog)] italic">{identity.voice}</span>
          </div>
        )}
      </div>

      {/* Current State */}
      <div className="p-3 space-y-2 border-b border-[var(--slate)]">
        <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">Current State</div>

        {state.current_mood && (
          <div className="text-[var(--mist)]">
            Mood: <span className="text-[var(--fog)]">{state.current_mood}</span>
          </div>
        )}

        {state.current_location && (
          <div className="text-[var(--mist)]">
            At: <span className="text-[var(--fog)]">{state.current_location}</span>
          </div>
        )}

        {state.current_goals && state.current_goals.length > 0 && (
          <div className="pt-2 mt-2 border-t border-[var(--slate)]">
            <div className="text-[var(--mist)] mb-1">Goals:</div>
            {state.current_goals.map((goal, i) => (
              <div key={i} className="text-[var(--fog)] pl-2">• {goal}</div>
            ))}
          </div>
        )}

        {state.current_problems && state.current_problems.length > 0 && (
          <div className="pt-2 mt-2 border-t border-[var(--slate)]">
            <div className="text-[var(--crimson)] mb-1">Problems:</div>
            {state.current_problems.map((problem, i) => (
              <div key={i} className="text-[var(--fog)] pl-2">• {problem}</div>
            ))}
          </div>
        )}
      </div>

      {/* Backstory */}
      {identity.backstory_summary && (
        <div className="p-3 border-b border-[var(--slate)]">
          <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">Backstory</div>
          <div className="text-[var(--fog)] leading-relaxed">
            {identity.backstory_summary}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {recent_events && recent_events.length > 0 && (
        <div className="p-3 border-b border-[var(--slate)]">
          <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">Recent Events</div>
          <div className="space-y-2">
            {recent_events.slice(0, 5).map((event, i) => (
              <div
                key={i}
                className="pl-2 border-l-2 border-[var(--slate)] hover:border-[var(--amber-dim)] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[var(--mist)] text-[10px] uppercase">{event.event_type}</span>
                  <span className="text-[var(--mist)] text-[10px]">{formatTimeAgo(event.occurred_at)}</span>
                </div>
                <div className="text-[var(--fog)]">{event.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationships */}
      <RelationshipsSection worldId={worldId} />
    </div>
  );
}

export function CharacterPanel({
  character,
  zoneName,
  influence,
  onLeaderboardClick,
  onStatsClick,
  footprints,
  onLeaveMessage,
  loadingFootprints,
  worldId,
  playerId,
  recentXPGain,
  landKey,
}: CharacterPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [footprintsExpanded, setFootprintsExpanded] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // Fetch profile when tab switches to profile
  useEffect(() => {
    if (activeTab === "profile" && !profile && !profileLoading && character) {
      setProfileLoading(true);
      setProfileError(null);
      api.getCharacterProfile()
        .then(setProfile)
        .catch((err) => setProfileError(err.message))
        .finally(() => setProfileLoading(false));
    }
  }, [activeTab, profile, profileLoading, character]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !onLeaveMessage) return;
    setSendingMessage(true);
    try {
      await onLeaveMessage(messageInput.trim());
      setMessageInput("");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!character) {
    return (
      <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] p-4 text-[var(--mist)] text-sm">
        No character
      </div>
    );
  }

  const stats = character.stats || { hp: 0, max_hp: 100, mana: 0, max_mana: 50, gold: 0, xp: 0, level: 1 };

  return (
    <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] flex flex-col text-sm h-full">
      {/* Tabs */}
      <div className="flex border-b border-[var(--slate)]">
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider transition-colors ${
            activeTab === "stats"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] bg-[var(--stone)]"
              : "text-[var(--mist)] hover:text-[var(--fog)] hover:bg-[var(--stone)]"
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider transition-colors ${
            activeTab === "skills"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] bg-[var(--stone)]"
              : "text-[var(--mist)] hover:text-[var(--fog)] hover:bg-[var(--stone)]"
          }`}
        >
          Skills
        </button>
        <button
          onClick={() => setActiveTab("lore")}
          className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider transition-colors ${
            activeTab === "lore"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] bg-[var(--stone)]"
              : "text-[var(--mist)] hover:text-[var(--fog)] hover:bg-[var(--stone)]"
          }`}
        >
          Lore
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider transition-colors ${
            activeTab === "profile"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] bg-[var(--stone)]"
              : "text-[var(--mist)] hover:text-[var(--fog)] hover:bg-[var(--stone)]"
          }`}
        >
          Profile
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "stats" ? (
        <>
          {/* Header */}
          <div className="p-3 border-b border-[var(--slate)]">
            <div className="text-[var(--amber)] font-bold">{character.name}</div>
            <div className="text-[var(--mist)] text-xs">
              Lv.{stats.level} {character.race} {character.character_class}
            </div>
          </div>

          {/* Stats */}
          <div className="p-3 space-y-3 flex-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--crimson)]">HP</span>
                <span className="text-[var(--mist)]">{stats.hp}/{stats.max_hp}</span>
              </div>
              <StatBar current={stats.hp} max={stats.max_hp} type="hp" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--arcane)]">MP</span>
                <span className="text-[var(--mist)]">{stats.mana}/{stats.max_mana}</span>
              </div>
              <StatBar current={stats.mana} max={stats.max_mana} type="mana" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--amber)]">XP</span>
                <span className="text-[var(--mist)]">{stats.xp % 100}/100</span>
              </div>
              <StatBar current={stats.xp % 100} max={100} type="xp" />
            </div>

            <div className="pt-2 border-t border-[var(--slate)]">
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Gold</span>
                <span className="text-[var(--amber)]">{stats.gold}</span>
              </div>
            </div>

            {/* Influence */}
            {influence && (
              <div className="pt-2 border-t border-[var(--slate)]">
                <div className="text-[var(--mist)] text-xs mb-2">Influence</div>
                <InfluenceBadge
                  score={influence.trailblazer_score}
                  rank={influence.rank}
                  showScore
                  showProgress
                  onClick={onLeaderboardClick}
                />
              </div>
            )}
          </div>

          {/* Location */}
          {zoneName && (
            <div className="p-3 border-t border-[var(--slate)] bg-[var(--stone)]">
              <div className="flex items-center justify-between">
                <div className="text-[var(--mist)] text-xs">Location</div>
                {worldId && (
                  <button
                    onClick={() => setMapOpen(true)}
                    className="text-[var(--mist)] hover:text-[var(--amber)] text-xs transition-colors"
                    title="View realm map"
                  >
                    ◎ Map
                  </button>
                )}
              </div>
              <div className="text-[var(--fog)]">{zoneName}</div>
              <FrontierIndicator
                worldId={worldId || null}
                playerId={playerId || null}
              />
              {worldId && <WorldTimeDisplay worldId={worldId} />}
            </div>
          )}

          {/* Footprints */}
          {footprints !== undefined && (
            <div className="border-t border-[var(--slate)]">
              <button
                onClick={() => setFootprintsExpanded(!footprintsExpanded)}
                className="w-full p-3 flex items-center justify-between text-xs hover:bg-[var(--stone)] transition-colors"
              >
                <span className="text-[var(--mist)]">
                  Travelers {footprints.length > 0 && `(${footprints.length})`}
                </span>
                <span className="text-[var(--mist)]">
                  {footprintsExpanded ? "−" : "+"}
                </span>
              </button>

              {footprintsExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {loadingFootprints ? (
                    <div className="text-[var(--mist)] text-xs animate-pulse">Loading...</div>
                  ) : footprints.length === 0 ? (
                    <div className="text-[var(--mist)] text-xs">No recent visitors</div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {footprints.slice(0, 10).map((fp, i) => (
                        <div key={`${fp.player_id}-${i}`} className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-[var(--fog)]">{fp.display_name}</span>
                            <span className="text-[var(--mist)]">{formatTimeAgo(fp.visited_at)}</span>
                          </div>
                          {fp.message && (
                            <div className="text-[var(--mist)] italic mt-0.5 truncate">
                              &quot;{fp.message}&quot;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leave message input */}
                  {onLeaveMessage && (
                    <div className="pt-2 border-t border-[var(--slate)]">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder="Leave a note..."
                          maxLength={100}
                          disabled={sendingMessage}
                          className="flex-1 px-2 py-1 text-xs bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || sendingMessage}
                          className="px-2 py-1 text-xs bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sendingMessage ? "..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : activeTab === "skills" ? (
        <div className="flex-1 overflow-y-auto">
          <SkillsTab
            worldId={worldId || null}
            playerId={playerId || null}
            recentXPGain={recentXPGain ? {
              skill_name: recentXPGain.skill_name,
              xp_gained: recentXPGain.xp_gained,
            } : null}
          />
        </div>
      ) : activeTab === "lore" ? (
        <div className="flex-1 overflow-y-auto">
          <LoreTab landKey={landKey || null} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {profileError ? (
            <div className="p-3 text-[var(--crimson)] text-xs">
              {profileError}
            </div>
          ) : (
            <ProfileTab profile={profile} loading={profileLoading} worldId={worldId || null} />
          )}
        </div>
      )}

      {/* Map Modal */}
      {worldId && (
        <MapModal
          worldId={worldId}
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
