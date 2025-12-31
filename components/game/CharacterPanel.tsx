"use client";

import { useState, useEffect } from "react";
import type { Character, CharacterProfile } from "@/types/game";
import type { PlayerInfluence, LocationFootprint } from "@/lib/api";
import { InfluenceBadge } from "./InfluenceBadge";
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
}

type TabType = "stats" | "profile";

function StatBar({ current, max, type }: { current: number; max: number; type: "hp" | "mana" | "xp" }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className={`stat-bar ${type}-bar`}>
      <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ProfileTab({ profile, loading }: { profile: CharacterProfile | null; loading: boolean }) {
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
        <div className="p-3 flex-1 overflow-y-auto">
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
}: CharacterPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [footprintsExpanded, setFootprintsExpanded] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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
          className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
            activeTab === "stats"
              ? "text-[var(--amber)] border-b-2 border-[var(--amber)] bg-[var(--stone)]"
              : "text-[var(--mist)] hover:text-[var(--fog)] hover:bg-[var(--stone)]"
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
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
              <div className="text-[var(--mist)] text-xs">Location</div>
              <div className="text-[var(--fog)]">{zoneName}</div>
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
      ) : (
        <div className="flex-1 overflow-y-auto">
          {profileError ? (
            <div className="p-3 text-[var(--crimson)] text-xs">
              {profileError}
            </div>
          ) : (
            <ProfileTab profile={profile} loading={profileLoading} />
          )}
        </div>
      )}
    </div>
  );
}
