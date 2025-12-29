"use client";

import { useState, useCallback, useEffect } from "react";
import { GameLog, CommandInput, CharacterPanel, QuickActions, SuggestedActions, MobileStats, SceneNegotiation, ActiveScene, SettingsPanel, CombatPanel, AgeGateModal, AuthModal, BillingPanel, InfluenceBadge, LeaderboardModal, CharacterCreationModal, PlayerStatsModal, EntityTimelineModal, WorldTemplatesModal, EntityGenerationModal, WorldCreationModal, SocialPanel, ChatPanel } from "@/components/game";
import { ThemePicker } from "@/components/ThemePicker";
import type { Character, GameLogEntry, CharacterOption, ActiveScene as ActiveSceneType, NegotiationRequest, CombatSession, ReasoningInfo, InfiniteWorld, InfiniteCampfireResponse, InfiniteCampfireCharacter, AccountPromptReason, WorldTemplate } from "@/types/game";
import * as api from "@/lib/api";
import type { LandGroup, PlayerInfluence, LocationFootprint, LandKey } from "@/lib/api";
import type { PlayerWorldStats } from "@/types/game";
import { safeStorage } from "@/lib/errors";
import { useWebSocket } from "@/lib/useWebSocket";
import Link from "next/link";
import type {
  ChatMessageEvent,
  LandChatMessageEvent,
  GlobalChatMessageEvent,
  FriendOnlineEvent,
  FriendOfflineEvent,
  FriendRequestReceivedEvent,
  DMReceivedEvent,
} from "@/lib/useWebSocket";

// ========== HELPERS ==========

let logId = 0;
const log = (
  type: GameLogEntry["type"],
  content: string,
  actor?: string,
  reasoning?: ReasoningInfo,
  action_id?: string
): GameLogEntry => ({
  id: `${++logId}`,
  type,
  content,
  timestamp: new Date(),
  actor,
  reasoning,
  action_id,
});

// Genre/tone icons for visual flair
const TONE_ICONS: Record<string, string> = {
  fantasy: "⚔",
  scifi: "◈",
  horror: "☠",
  mystery: "◎",
  western: "☆",
  romance: "♡",
  historical: "⚜",
  urban: "◇",
  contemporary: "▣",
  thriller: "◆",
  heroic: "⚔",
  grimdark: "☠",
  noir: "◆",
  comedic: "☆",
  slice_of_life: "♡",
  satirical: "◎",
  romantic: "♡",
};


// ========== STATE TYPE ==========

type AppPhase = "loading" | "landing" | "genres" | "worlds" | "campfire" | "infinite-campfire" | "game";

// ========== INLINE VIEW COMPONENTS ==========

function LoadingView() {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)]">
      <div className="text-[var(--amber)] font-bold tracking-[0.3em] text-lg mb-4 title-glow">TEXTLANDS</div>
      <div className="text-[var(--mist)] text-sm animate-pulse">Connecting...</div>
    </main>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-[var(--crimson)] text-4xl">⚠</div>
        <div className="text-[var(--amber)] font-bold tracking-[0.3em] text-lg">CONNECTION ERROR</div>
        <p className="text-[var(--text-dim)] text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}

function LandingView({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-atmospheric p-4 pt-[max(1rem,env(safe-area-inset-top))] animate-fade-in">
      {/* Decorative top line */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />

      <div className="text-center space-y-8 max-w-md corner-brackets p-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="text-[var(--mist)] text-[10px] tracking-[0.5em] uppercase">Welcome to</div>
          <h1 className="text-[var(--amber)] text-3xl md:text-5xl font-bold tracking-[0.2em] title-glow">
            TEXTLANDS
          </h1>
          <div className="text-[var(--mist)] text-[10px] tracking-[0.3em] uppercase">Est. MMXXV</div>
        </div>

        {/* Tagline */}
        <p className="text-[var(--text-dim)] text-sm md:text-base italic">
          Choose your world. Become your character.
        </p>

        {/* CTA Button */}
        <button
          onClick={onEnter}
          className="group relative px-10 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[52px] bg-[var(--shadow)] border border-[var(--slate)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
        >
          <span className="relative z-10">Begin Your Journey</span>
          <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>

        {/* Decorative text */}
        <div className="text-[var(--slate)] text-[10px] tracking-widest">
          ═══ ENTER THE LANDS ═══
        </div>
      </div>

      {/* Nav links */}
      <div className="absolute bottom-4 left-4 pb-[env(safe-area-inset-bottom)] flex gap-4">
        <Link
          href="/characters"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
        >
          Characters
        </Link>
        <Link
          href="/leaderboards"
          className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
        >
          Leaderboards
        </Link>
      </div>

      {/* Theme picker */}
      <div className="absolute bottom-4 right-4 pb-[env(safe-area-inset-bottom)]">
        <ThemePicker />
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />
    </main>
  );
}

// Infinite Worlds browser
function WorldBrowser({ landGroups, onSelect, onBack, nsfwEnabled, nsfwAutoBlocked, onRequestNsfw }: {
  landGroups: LandGroup[];
  onSelect: (world: InfiniteWorld) => void;
  onBack: () => void;
  nsfwEnabled: boolean;
  nsfwAutoBlocked?: boolean;
  onRequestNsfw: () => void;
}) {
  const [expandedLand, setExpandedLand] = useState<string | null>(null);

  // Separate SFW and locked/NSFW lands
  const sfwLands = landGroups.filter(g => !g.is_locked);
  const nsfwLands = landGroups.filter(g => g.is_locked);

  // Get all SFW realms flat (backend already filters based on content_settings)
  const allSfwWorlds = sfwLands.flatMap(g => g.realms);

  // Show flat list if < 10 SFW worlds, otherwise group by land
  const showFlat = allSfwWorlds.length < 10;

  const handleLandClick = (land: string, isLocked: boolean) => {
    if (isLocked && !nsfwEnabled) {
      onRequestNsfw();
      return;
    }
    setExpandedLand(expandedLand === land ? null : land);
  };

  // Backend returns already-filtered worlds based on content_settings
  const totalWorlds = landGroups.reduce((sum, g) => sum + g.realm_count, 0);

  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">CHOOSE YOUR LAND</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">{totalWorlds} WORLDS AVAILABLE</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto">
          {/* World grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-fade-in">
            {/* SFW Worlds - flat list if < 10, otherwise grouped by land */}
            {showFlat ? (
              // Flat list of all SFW worlds
              allSfwWorlds.map((world) => (
                <button
                  key={world.id}
                  onClick={() => onSelect(world)}
                  className="w-full p-4 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-left hover:border-[var(--amber-dim)] hover:bg-[var(--void)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[var(--amber)] font-bold">{world.name}</span>
                    {world.is_nsfw && (
                      <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                    )}
                  </div>
                  <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{world.tagline}</p>
                  {world.player_count > 0 && (
                    <div className="mt-2 text-[var(--mist)] text-[10px] tracking-wider">
                      {world.player_count} exploring
                    </div>
                  )}
                </button>
              ))
            ) : (
              // Grouped by land
              sfwLands.map((group) => {
                const isExpanded = expandedLand === group.land;

                return (
                  <div key={group.land} className={`land-group ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}`}>
                    {/* Land Header */}
                    <button
                      onClick={() => handleLandClick(group.land, false)}
                      className="w-full p-4 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg flex items-center justify-between hover:border-[var(--amber-dim)] transition-colors group"
                    >
                      <div className="text-left">
                        <span className="text-[var(--amber)] font-bold block">{group.display_name}</span>
                        <span className="text-[var(--mist)] text-xs">{group.realms.length} worlds</span>
                      </div>
                      <span className="text-[var(--mist)] text-lg">{isExpanded ? "−" : "+"}</span>
                    </button>

                    {/* Expanded World List */}
                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.realms.map((world) => (
                          <button
                            key={world.id}
                            onClick={() => onSelect(world)}
                            className="w-full p-4 bg-[var(--void)] border border-[var(--stone)] rounded-lg text-left hover:border-[var(--amber-dim)] hover:bg-[var(--shadow)] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-[var(--amber)] font-bold">{world.name}</span>
                              {world.is_nsfw && (
                                <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                              )}
                            </div>
                            <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{world.tagline}</p>
                            {world.player_count > 0 && (
                              <div className="mt-2 text-[var(--mist)] text-[10px] tracking-wider">
                                {world.player_count} exploring
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* NSFW/Locked Lands Section */}
            {nsfwLands.length > 0 && (
              <>
                {nsfwEnabled ? (
                  // Show NSFW realms as flat cards when unlocked (no extra click needed)
                  nsfwLands.flatMap((group) => group.realms).map((world) => (
                    <button
                      key={world.id}
                      onClick={() => onSelect(world)}
                      className="w-full p-4 bg-[var(--shadow)] border border-[var(--crimson)]/30 rounded-lg text-left hover:border-[var(--crimson)] hover:bg-[var(--void)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[var(--amber)] font-bold">{world.name}</span>
                        <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                      </div>
                      <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{world.tagline}</p>
                      {world.player_count > 0 && (
                        <div className="mt-2 text-[var(--mist)] text-[10px] tracking-wider">
                          {world.player_count} exploring
                        </div>
                      )}
                    </button>
                  ))
                ) : nsfwAutoBlocked ? (
                  // Auto-blocked after 3 rejections
                  <div className="w-full p-4 bg-[var(--shadow)] border border-[var(--stone)] rounded-lg flex items-start gap-3 opacity-40">
                    <span className="text-xl leading-none mt-0.5">🚫</span>
                    <div className="text-left">
                      <span className="text-[var(--mist)] font-bold block">Adults Only</span>
                      <span className="text-[var(--slate)] text-xs">{nsfwLands.reduce((sum, g) => sum + g.realm_count, 0)} worlds · Blocked (enable in Settings)</span>
                    </div>
                  </div>
                ) : (
                  // Locked NSFW section - tap to verify
                  <button
                    onClick={onRequestNsfw}
                    className="w-full p-4 bg-[var(--shadow)] border border-[var(--stone)] rounded-lg flex items-start gap-3 hover:border-[var(--mist)] transition-colors opacity-60"
                  >
                    <span className="text-xl leading-none mt-0.5">🔒</span>
                    <div className="text-left">
                      <span className="text-[var(--mist)] font-bold block">Adults Only</span>
                      <span className="text-[var(--slate)] text-xs">{nsfwLands.reduce((sum, g) => sum + g.realm_count, 0)} worlds · Tap to verify age</span>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Infinite Worlds character selection view
function InfiniteCampfireView({ campfire, onSelect, onBack, loading, onCreateOwn }: {
  campfire: InfiniteCampfireResponse;
  onSelect: (character: InfiniteCampfireCharacter) => void;
  onBack: () => void;
  loading: boolean;
  onCreateOwn?: () => void;
}) {
  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">{campfire.world_name}</span>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Intro narrative */}
        <div className="p-6 border-b border-[var(--slate)] bg-gradient-to-b from-[var(--shadow)] to-transparent">
          <div className="max-w-2xl mx-auto">
            <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap text-sm md:text-base text-center">
              {campfire.intro_text}
            </p>
          </div>
        </div>

        {/* Character selection */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-5xl mx-auto">
            {campfire.characters.length === 0 && !onCreateOwn ? (
              <div className="text-center py-8">
                <p className="text-[var(--mist)]">No characters available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-fade-in">
                {campfire.characters.filter(c => c.is_playable).map((char) => (
                  <button
                    key={char.id}
                    onClick={() => onSelect(char)}
                    disabled={loading}
                    className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Character portrait placeholder */}
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--slate)] to-[var(--stone)] flex items-center justify-center text-[var(--amber)] text-2xl shrink-0 group-hover:from-[var(--amber-dim)] group-hover:to-[var(--slate)] transition-all">
                        {char.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[var(--amber)] font-bold text-lg group-hover:text-[var(--text)] transition-colors">{char.name}</span>
                          {char.occupation && (
                            <span className="text-[var(--arcane)] text-[10px] tracking-wider uppercase shrink-0 mt-1">
                              {char.occupation}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-dim)] text-sm mb-2 line-clamp-2">
                          {char.physical_summary}
                        </p>
                        {char.backstory_hook && (
                          <p className="text-[var(--mist)] text-xs italic line-clamp-2">
                            {char.backstory_hook}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Personality tags */}
                    {char.personality_summary && (
                      <div className="mt-3 pt-3 border-t border-[var(--slate)] flex items-center justify-between">
                        <span className="text-[var(--mist)] text-[10px] tracking-wider uppercase">
                          {char.personality_summary}
                        </span>
                        <span className="text-[var(--amber)] text-sm group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    )}
                  </button>
                ))}

                {/* Create Your Own - at bottom for advanced users */}
                {onCreateOwn && (
                  <button
                    onClick={onCreateOwn}
                    disabled={loading}
                    className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed group border-dashed md:col-span-2"
                  >
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed border-[var(--slate)] flex items-center justify-center text-[var(--mist)] text-2xl group-hover:border-[var(--amber-dim)] group-hover:text-[var(--amber)] transition-colors">
                        +
                      </div>
                      <div>
                        <span className="text-[var(--mist)] font-bold group-hover:text-[var(--amber)] transition-colors">Create Your Own</span>
                        <p className="text-[var(--text-dim)] text-sm">Describe a character concept</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ========== MAIN PAGE COMPONENT ==========

export default function GamePage() {
  // Phase state machine
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Infinite Worlds state (new system)
  const [landGroups, setLandGroups] = useState<LandGroup[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<InfiniteWorld | null>(null);
  const [infiniteCampfire, setInfiniteCampfire] = useState<InfiniteCampfireResponse | null>(null);

  // Game state
  const [character, setCharacter] = useState<Character | null>(null);
  const [entries, setEntries] = useState<GameLogEntry[]>([]);
  const [zoneName, setZoneName] = useState("...");
  const [processing, setProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Scene/Intimacy state
  const [activeScene, setActiveScene] = useState<ActiveSceneType | null>(null);
  const [negotiating, setNegotiating] = useState<{ npc_id: string; scene_id: string; npc_name: string } | null>(null);

  // Combat state
  const [activeCombat, setActiveCombat] = useState<CombatSession | null>(null);
  const [combatNarrative, setCombatNarrative] = useState<string>("");

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // NSFW / Age gate state
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [nsfwVerified, setNsfwVerified] = useState(false);
  const [nsfwRejections, setNsfwRejections] = useState(0);
  const [nsfwAutoBlocked, setNsfwAutoBlocked] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageGateCallback, setAgeGateCallback] = useState<(() => void) | null>(null);
  const [pendingNsfwCommand, setPendingNsfwCommand] = useState<string | null>(null);

  // Session state
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Influence & Leaderboard state
  const [influence, setInfluence] = useState<PlayerInfluence | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Character creation state
  const [charCreatorOpen, setCharCreatorOpen] = useState(false);
  const [charCreatorLoading, setCharCreatorLoading] = useState(false);

  // Location footprints state
  const [footprints, setFootprints] = useState<LocationFootprint[]>([]);
  const [loadingFootprints, setLoadingFootprints] = useState(false);
  const [currentLocationEntityId, setCurrentLocationEntityId] = useState<string | null>(null);

  // Player stats modal state
  const [playerStatsOpen, setPlayerStatsOpen] = useState(false);
  const [playerWorldStats, setPlayerWorldStats] = useState<PlayerWorldStats | null>(null);

  // Entity timeline modal state
  const [entityTimelineOpen, setEntityTimelineOpen] = useState(false);
  const [entityTimelineId, setEntityTimelineId] = useState<string | null>(null);
  const [entityTimelineName, setEntityTimelineName] = useState<string | null>(null);

  // World templates modal state
  const [worldTemplatesOpen, setWorldTemplatesOpen] = useState(false);

  // Entity generation modal state
  const [entityGenerationOpen, setEntityGenerationOpen] = useState(false);

  // World creation modal state
  const [worldCreationOpen, setWorldCreationOpen] = useState(false);
  const [selectedWorldTemplate, setSelectedWorldTemplate] = useState<WorldTemplate | null>(null);

  // Auth modal state (magic link login)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<AccountPromptReason | undefined>();
  const [authModalIncentive, setAuthModalIncentive] = useState<string | undefined>();
  const [savePromptDismissed, setSavePromptDismissed] = useState(false);

  // Social panel state (mobile)
  const [showSocialPanel, setShowSocialPanel] = useState(false);

  // Chat panel state
  const [showChatPanel, setShowChatPanel] = useState(false);

  // WebSocket real-time events
  const [lastZoneMessage, setLastZoneMessage] = useState<ChatMessageEvent | null>(null);
  const [lastLandMessage, setLastLandMessage] = useState<LandChatMessageEvent | null>(null);
  const [lastGlobalMessage, setLastGlobalMessage] = useState<GlobalChatMessageEvent | null>(null);
  const [lastFriendOnline, setLastFriendOnline] = useState<FriendOnlineEvent | null>(null);
  const [lastFriendOffline, setLastFriendOffline] = useState<FriendOfflineEvent | null>(null);
  const [lastFriendRequest, setLastFriendRequest] = useState<FriendRequestReceivedEvent | null>(null);
  const [lastDMReceived, setLastDMReceived] = useState<DMReceivedEvent | null>(null);

  // WebSocket connection
  const ws = useWebSocket({
    playerId: phase === "game" ? playerId : null,
    handlers: {
      onChatMessage: setLastZoneMessage,
      onLandChatMessage: setLastLandMessage,
      onGlobalChatMessage: setLastGlobalMessage,
      onFriendOnline: setLastFriendOnline,
      onFriendOffline: setLastFriendOffline,
      onFriendRequestReceived: setLastFriendRequest,
      onDMReceived: setLastDMReceived,
      onConnect: () => console.log("[WS] Connected"),
      onDisconnect: () => console.log("[WS] Disconnected"),
      onError: (e) => console.error("[WS] Error:", e.message),
    },
  });

  // ========== INITIALIZATION ==========

  // Load NSFW preferences from localStorage (fallback for demo mode)
  useEffect(() => {
    const stored = safeStorage.getJSON<{
      enabled?: boolean;
      verified?: boolean;
      rejections?: number;
      autoBlocked?: boolean;
    }>("textlands_nsfw", {});
    if (stored.enabled !== undefined) {
      setNsfwEnabled(!!stored.enabled);
      setNsfwVerified(!!stored.verified);
      setNsfwRejections(stored.rejections || 0);
      setNsfwAutoBlocked(!!stored.autoBlocked);
    }
  }, []);

  // Cache NSFW preferences to localStorage (for offline/demo fallback)
  useEffect(() => {
    safeStorage.setJSON("textlands_nsfw", {
      enabled: nsfwEnabled,
      verified: nsfwVerified,
      rejections: nsfwRejections,
      autoBlocked: nsfwAutoBlocked,
    });
  }, [nsfwEnabled, nsfwVerified, nsfwRejections, nsfwAutoBlocked]);

  // Resume existing session helper
  const resumeExistingSession = useCallback(async (session: api.SessionInfo) => {
    // Try to get world info for the session
    let worldData: InfiniteWorld | null = null;
    if (session.world_id) {
      try {
        worldData = await api.getInfiniteWorld(session.world_id);
        setSelectedWorld(worldData);
      } catch {
        // World may have been deleted, continue with session info only
      }
    }

    setCharacter({
      id: session.character_id || "",
      name: session.character_name || "Unknown",
      race: "Unknown",
      character_class: "Wanderer",
      stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
      current_zone_id: null,
      inventory: [],
      equipped: {},
    });

    setZoneName(session.world_name || worldData?.name || "Unknown");
    setEntries([
      log("system", `Welcome back, ${session.character_name || "traveler"}.`),
      log("system", `Resuming in ${session.world_name || "your world"}...`),
      log("system", "Type 'look' to see your surroundings"),
    ]);
    setPhase("game");
  }, []);

  useEffect(() => {
    async function init() {
      const healthy = await api.checkHealth();

      if (!healthy) {
        setConnectionError("Unable to connect to server. Please check your connection and try again.");
        return;
      }

      // Fetch session, worlds, and preferences in parallel
      try {
        const [session, groupedData, prefs] = await Promise.all([
          api.getSession().catch((err) => { console.warn("[Init] No session:", err.message); return null; }),
          api.getInfiniteWorldsGrouped(),
          api.getPreferences().catch((err) => { console.warn("[Init] Using default prefs:", err.message); return { show_reasoning: false, show_on_failure: true }; }),
        ]);

        setLandGroups(groupedData);
        setShowReasoning(prefs.show_reasoning);

        if (session) {
          setPlayerId(session.player_id);

          // Use content_settings from session (backend bundles this now)
          if (session.content_settings) {
            setNsfwEnabled(session.content_settings.nsfw_enabled);
            setNsfwAutoBlocked(session.content_settings.nsfw_auto_blocked);
            setNsfwVerified(session.content_settings.age_category === "adult");
          }

          // Resume existing session if player has active character in a world
          if (session.character_id && session.world_id) {
            setCurrentSession(session);
            await resumeExistingSession(session);
            return; // Skip landing, go straight to game
          }
        }

        setPhase("landing");
      } catch {
        setConnectionError("Failed to load game data. Please try again.");
      }
    }

    init();
  }, [resumeExistingSession]);

  // ========== AGE GATE HANDLERS ==========

  // Request age verification (for settings or realm access)
  const requestAgeVerification = useCallback((onSuccess?: () => void) => {
    if (nsfwAutoBlocked) {
      // User has rejected 3 times - only settings can re-enable
      return;
    }
    setAgeGateCallback(() => onSuccess || null);
    setShowAgeGate(true);
  }, [nsfwAutoBlocked]);

  // Called when backend detects NSFW content in a non-NSFW world
  const promptNsfwEncounter = useCallback(() => {
    if (nsfwEnabled || nsfwAutoBlocked) {
      // Already enabled or auto-blocked
      return nsfwEnabled;
    }
    // Show age gate for in-game NSFW encounter
    requestAgeVerification();
    return false;
  }, [nsfwEnabled, nsfwAutoBlocked, requestAgeVerification]);

  const handleAgeVerified = useCallback(async () => {
    setNsfwVerified(true);
    setNsfwEnabled(true);
    setNsfwRejections(0); // Reset rejections on acceptance
    setShowAgeGate(false);

    // Sync with server if we have a player ID
    if (playerId) {
      try {
        await api.handleNsfwPrompt(playerId, true);
      } catch {
        // Server sync failed, local state already updated
      }
    }

    // Retry pending NSFW command if any
    if (pendingNsfwCommand) {
      const commandToRetry = pendingNsfwCommand;
      setPendingNsfwCommand(null);
      // Retry after a brief delay to let state update
      setTimeout(() => {
        // Re-run the command - it will now succeed since nsfw is enabled
        api.doAction(commandToRetry).then((result) => {
          if (!result.nsfw_blocked) {
            setEntries((prev) => [
              ...prev,
              log("narrative", result.narrative, undefined, result.reasoning, result.action_id),
            ]);
            if (result.suggested_actions?.length) {
              setSuggestions(result.suggested_actions);
            }
          }
        }).catch(() => {
          // Ignore retry errors
        });
      }, 100);
    }

    if (ageGateCallback) {
      ageGateCallback();
      setAgeGateCallback(null);
    }
  }, [ageGateCallback, pendingNsfwCommand, playerId]);

  const handleAgeGateCancelled = useCallback(async () => {
    setShowAgeGate(false);
    setAgeGateCallback(null);

    // Track rejection (for in-game prompts, not settings)
    const newRejections = nsfwRejections + 1;
    setNsfwRejections(newRejections);

    if (newRejections >= 3) {
      // Auto-block after 3 rejections
      setNsfwAutoBlocked(true);
    }

    // Sync with server if we have a player ID
    if (playerId) {
      try {
        await api.handleNsfwPrompt(playerId, false);
      } catch {
        // Server sync failed, local state already updated
      }
    }
  }, [nsfwRejections, playerId]);

  const handleNsfwToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Re-enabling clears auto-block
      setNsfwAutoBlocked(false);
      setNsfwRejections(0);
    }
    setNsfwEnabled(enabled);

    // Sync with server if we have a player ID
    if (playerId) {
      try {
        await api.updatePlayerPreferences(playerId, {
          nsfw_enabled: enabled,
          auto_blocked: enabled ? false : undefined,
          rejection_count: enabled ? 0 : undefined,
        });
      } catch {
        // Server sync failed, local state already updated
      }
    }
  }, [playerId]);

  // ========== PHASE TRANSITIONS ==========

  // Track current session for world switching logic
  const [currentSession, setCurrentSession] = useState<api.SessionInfo | null>(null);

  const enterWorlds = () => setPhase("worlds");

  // Leave current world and return to world browser
  const leaveWorld = async () => {
    setProcessing(true);
    try {
      await api.endGuestSession();
      setCurrentSession(null);
      setCharacter(null);
      setSelectedWorld(null);
      setEntries([]);
      setPhase("worlds");
    } catch (err) {
      console.error("[LeaveWorld] Failed:", err);
      // Even if backend fails, reset local state
      setCurrentSession(null);
      setCharacter(null);
      setPhase("worlds");
    }
    setProcessing(false);
  };

  // Select an infinite world - check for existing character first
  const selectInfiniteWorld = async (world: InfiniteWorld) => {
    setSelectedWorld(world);
    setProcessing(true);

    try {
      // Check if user already has a session in this world
      const session = await api.getSession().catch((err) => { console.warn("[Session] Check failed:", err.message); return null; });

      if (session?.character_id && session?.world_id === world.id) {
        // User already has a character in this world - resume directly
        setCurrentSession(session);
        await resumeExistingSession(session);
        setProcessing(false);
        return;
      }

      // If user has a session in a different world, end it first
      if (session?.character_id && session?.world_id && session.world_id !== world.id) {
        await api.endGuestSession();
        setCurrentSession(null);
      }

      // No existing character in this world - show campfire
      const campfire = await api.getInfiniteCampfire(world.id);
      setInfiniteCampfire(campfire);
      setPhase("infinite-campfire");
    } catch (err) {
      setConnectionError(`Failed to load world: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    setProcessing(false);
  };

  // Select a character from infinite campfire and start game
  const selectInfiniteCharacter = async (char: InfiniteCampfireCharacter) => {
    if (!selectedWorld || !infiniteCampfire) return;

    setProcessing(true);

    try {
      const { session, opening_narrative } = await api.startSession({
        world_id: selectedWorld.id,
        entity_id: char.id,
      });

      setCurrentSession(session);
      setCharacter({
        id: session.character_id || char.id,
        name: session.character_name || char.name,
        race: "Unknown",
        character_class: char.occupation || "Wanderer",
        stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
        current_zone_id: null,
        inventory: [],
        equipped: {},
      });

      setZoneName(session.world_name || selectedWorld.name);
      setEntries([
        log("system", `Entering ${session.world_name || selectedWorld.name}`),
        log("narrative", opening_narrative || infiniteCampfire.intro_text),
        log("system", "Type 'help' for commands, or just describe what you want to do"),
      ]);
      setPhase("game");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";

      // Handle 409 Conflict - session already exists
      if (errorMsg.includes("409") || errorMsg.toLowerCase().includes("conflict") || errorMsg.toLowerCase().includes("active session")) {
        // Try to end existing session and retry
        try {
          await api.endGuestSession();
          // Retry once
          const { session, opening_narrative } = await api.startSession({
            world_id: selectedWorld.id,
            entity_id: char.id,
          });

          setCurrentSession(session);
          setCharacter({
            id: session.character_id || char.id,
            name: session.character_name || char.name,
            race: "Unknown",
            character_class: char.occupation || "Wanderer",
            stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
            current_zone_id: null,
            inventory: [],
            equipped: {},
          });

          setZoneName(session.world_name || selectedWorld.name);
          setEntries([
            log("system", `Entering ${session.world_name || selectedWorld.name}`),
            log("narrative", opening_narrative || infiniteCampfire.intro_text),
            log("system", "Type 'help' for commands, or just describe what you want to do"),
          ]);
          setPhase("game");
          setProcessing(false);
          return;
        } catch (retryErr) {
          setConnectionError(`Failed to start session: ${retryErr instanceof Error ? retryErr.message : "Unknown error"}`);
        }
      } else {
        setConnectionError(`Failed to start session: ${errorMsg}`);
      }
    }

    setProcessing(false);
  };

  // Create custom character from modal
  const handleCreateCharacter = async (request: api.CreateCharacterRequest) => {
    if (!selectedWorld) return;

    setCharCreatorLoading(true);
    try {
      const result = await api.createCampfireCharacter(selectedWorld.id, request);
      setCharCreatorOpen(false);
      // Select the newly created character
      await selectInfiniteCharacter(result.character);
    } catch (err) {
      throw err; // Let modal handle error display
    } finally {
      setCharCreatorLoading(false);
    }
  };

  // Fetch location footprints
  const fetchFootprints = async (locationEntityId: string) => {
    setLoadingFootprints(true);
    setCurrentLocationEntityId(locationEntityId);
    try {
      const data = await api.getLocationFootprints(locationEntityId);
      setFootprints(data);
    } catch {
      setFootprints([]);
    }
    setLoadingFootprints(false);
  };

  // Leave message at current location
  const handleLeaveMessage = async (message: string) => {
    if (!currentLocationEntityId) return;
    await api.leaveLocationMessage(currentLocationEntityId, message);
    // Refresh footprints to show new message
    await fetchFootprints(currentLocationEntityId);
  };

  // Open player stats modal
  const handleOpenPlayerStats = async () => {
    if (!selectedWorld || !playerId) return;
    setPlayerStatsOpen(true);
    try {
      const stats = await api.getPlayerWorldStats(selectedWorld.id, playerId);
      setPlayerWorldStats(stats);
    } catch {
      setPlayerWorldStats(null);
    }
  };

  // Open entity timeline modal
  const handleOpenEntityTimeline = (entityId: string, entityName?: string) => {
    setEntityTimelineId(entityId);
    setEntityTimelineName(entityName || null);
    setEntityTimelineOpen(true);
  };

  // ========== GAME LOGIC ==========

  const addLog = useCallback((type: GameLogEntry["type"], content: string, actor?: string) => {
    setEntries((prev) => [...prev, log(type, content, actor)]);
  }, []);

  const handleCommand = useCallback(async (command: string) => {
    if (!character) return;
    addLog("action", command);
    setSuggestions([]); // Clear previous suggestions

    const cmd = command.toLowerCase().trim();
    const [action, ...rest] = cmd.split(/\s+/);
    const args = rest.join(" ");

    setProcessing(true);

    try {
      // Local commands that don't need API
      if (action === "help") {
        addLog("system", "Commands: look, go <dir>, talk <npc>, leave message \"text\", or describe what you want to do naturally");
      } else if (action === "leave" && rest[0] === "message") {
        // Leave a message at current location
        const messageMatch = command.match(/leave\s+message\s+["'](.+)["']/i);
        if (messageMatch) {
          // TODO: When backend provides location_entity_id, call api.leaveLocationMessage
          addLog("system", "You carve your message into the surroundings...");
          addLog("narrative", `"${messageMatch[1]}" - Your words will be seen by future travelers.`);
        } else {
          addLog("system", "Usage: leave message \"your message here\"");
        }
      } else if (action === "stats") {
        const { stats: s } = character;
        addLog("system", `${character.name} - Lv.${s.level} ${character.race} ${character.character_class}\nHP: ${s.hp}/${s.max_hp} | MP: ${s.mana}/${s.max_mana} | Gold: ${s.gold} | XP: ${s.xp}`);
      } else if (["inventory", "inv", "i"].includes(action)) {
        addLog("system", character.inventory.length ? `Inventory: ${character.inventory.join(", ")}` : "Your pack is empty.");
      } else {
        // API - use natural language endpoint
        const result = await api.doAction(command);

        // Check for NSFW block
        if (result.nsfw_blocked) {
          // Action was blocked due to NSFW content
          if (nsfwAutoBlocked) {
            // User has permanently blocked NSFW - show message
            addLog("system", "This action requires adult content to be enabled. You can change this in Settings.");
          } else {
            // Prompt for age verification, retry if accepted
            setPendingNsfwCommand(command);
            addLog("narrative", result.narrative);
            requestAgeVerification(() => {
              // Will retry command after verification
            });
          }
        } else if (result.requires_account) {
          // Blocking prompt - must create account to continue
          addLog("narrative", result.narrative);
          setAuthModalReason(result.account_prompt_reason);
          setAuthModalIncentive(result.account_prompt_incentive);
          setShowAuthModal(true);
        } else {
          // Normal response - add narrative with reasoning if available
          setEntries((prev) => [
            ...prev,
            log("narrative", result.narrative, undefined, result.reasoning, result.action_id),
          ]);

          // Store suggestions for clickable chips
          if (result.suggested_actions?.length) {
            setSuggestions(result.suggested_actions);
          }

          if (result.character) {
            // Ensure stats exist (backend may omit in some responses)
            const char = result.character;
            if (!char.stats) {
              char.stats = { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 };
            }
            setCharacter(char);
          }

          // Update location and fetch footprints if location changed
          if (result.location_entity_id) {
            fetchFootprints(result.location_entity_id);
            if (result.location_name) {
              setZoneName(result.location_name);
            }
          }

          // Track examined entity for timeline access
          if (result.examined_entity_id) {
            setEntityTimelineId(result.examined_entity_id);
            setEntityTimelineName(result.examined_entity_name || null);
          }

          // Handle NPC kill consequences
          if (result.state_changes?.npc_killed) {
            const kill = result.state_changes.npc_killed;
            if (kill.bounty_created) {
              addLog("system", `⚠ BOUNTY PLACED: ${kill.bounty_created.amount}g for ${kill.bounty_created.reason}`);
            }
            if (kill.reputation_change && kill.reputation_change < 0) {
              addLog("system", `Your reputation has suffered...`);
            }
          }

          if (result.error) {
            addLog("system", result.error);
          }

          // Soft prompt - dismissible save nudge (after 5 actions)
          if (result.show_save_prompt && !savePromptDismissed) {
            setAuthModalReason(undefined);
            setAuthModalIncentive(undefined);
            setShowAuthModal(true);
          }
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    setProcessing(false);
  }, [character, addLog, nsfwAutoBlocked, requestAgeVerification, savePromptDismissed]);

  // ========== SCENE HANDLERS ==========

  const handleStartScene = useCallback(async (npcId: string, npcName: string) => {
    setProcessing(true);
    try {
      const result = await api.doAction(`initiate intimate moment with ${npcName}`);
      addLog("intimate", result.narrative);

      // Poll for scene state after action
      if (character) {
        const sceneResult = await api.getActiveScene(character.id);
        if (sceneResult.scene) {
          setNegotiating({
            npc_id: npcId,
            scene_id: sceneResult.scene.id,
            npc_name: npcName,
          });
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [character, addLog]);

  const handleNegotiationComplete = useCallback(async (negotiation: NegotiationRequest) => {
    setProcessing(true);
    try {
      // Express negotiation as natural language
      const prefs = `proceed with ${negotiation.intensity} intensity as ${negotiation.player_role}`;
      const result = await api.doAction(prefs);
      setNegotiating(null);
      addLog("intimate", result.narrative);

      // Poll for updated scene state
      if (character) {
        const sceneResult = await api.getActiveScene(character.id);
        if (sceneResult.scene) {
          setActiveScene(sceneResult.scene);
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [character, addLog]);

  const handleNegotiationCancel = useCallback(() => {
    setNegotiating(null);
    addLog("system", "Scene cancelled.");
  }, [addLog]);

  const handleSceneAction = useCallback(async (action: string) => {
    if (!activeScene) return;

    setProcessing(true);
    try {
      const result = await api.doAction(action);
      addLog("intimate", result.narrative);

      // Poll for updated scene state
      if (character) {
        const sceneResult = await api.getActiveScene(character.id);
        if (sceneResult.scene) {
          setActiveScene(sceneResult.scene);
        } else {
          // Scene ended
          setActiveScene(null);
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [activeScene, character, addLog]);

  const handleSafeword = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await api.doAction("safeword - stop immediately");
      setActiveScene(null);
      addLog("system", result.narrative || "Scene ended safely.");
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
      setActiveScene(null);
    }
    setProcessing(false);
  }, [addLog]);

  const handleSceneComplete = useCallback(async (aftercareQuality: "minimal" | "standard" | "extended") => {
    setProcessing(true);
    try {
      const result = await api.doAction(`complete scene with ${aftercareQuality} aftercare`);
      setActiveScene(null);
      addLog("intimate", result.narrative);
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
      setActiveScene(null);
    }
    setProcessing(false);
  }, [addLog]);

  // ========== COMBAT HANDLERS (all actions flow through doAction) ==========

  const handleCombatAction = useCallback(async (
    action: "attack" | "defend" | "skill" | "item" | "flee",
    targetId?: string
  ) => {
    if (!activeCombat || !character) return;

    setProcessing(true);
    try {
      // Convert structured action to natural language
      const target = activeCombat.participants.find(p => p.id === targetId);
      const actionText = target ? `${action} ${target.name}` : action;
      const result = await api.doAction(actionText);

      setCombatNarrative(result.narrative);
      addLog("combat", result.narrative);

      // Check for death recovery prompt (guest died)
      if (result.requires_account) {
        setAuthModalReason(result.account_prompt_reason);
        setAuthModalIncentive(result.account_prompt_incentive);
        setShowAuthModal(true);
        setProcessing(false);
        return;
      }

      // Poll for updated combat state
      const updatedCombat = await api.getCombatState(activeCombat.id);
      setActiveCombat(updatedCombat);

      // Check if combat ended
      if (updatedCombat.state !== "active") {
        setTimeout(() => {
          setActiveCombat(null);
          setCombatNarrative("");
        }, 3000);
      }
    } catch (error) {
      addLog("system", `Combat error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [activeCombat, character, addLog]);

  // Check for active scene/combat on game start
  useEffect(() => {
    if (phase === "game") {
      // Check for active scene
      if (!activeScene && character) {
        api.getActiveScene(character.id).then((result) => {
          if (result.scene) {
            setActiveScene(result.scene);
          }
        }).catch((err) => {
          console.error("[Scene] Failed to check active scene:", err);
        });
      }

      // Check for active combat
      if (!activeCombat && character) {
        api.getActiveCombat(character.id).then((combat) => {
          if (combat) {
            setActiveCombat(combat);
          }
        }).catch((err) => {
          console.error("[Combat] Failed to check active combat:", err);
        });
      }
    }
  }, [phase, activeScene, activeCombat, character, playerId]);

  // Fetch player influence on game start
  useEffect(() => {
    if (phase === "game" && playerId && selectedWorld) {
      api.getPlayerInfluence(selectedWorld.id, playerId)
        .then(setInfluence)
        .catch(() => setInfluence(null));
    }
  }, [phase, playerId, selectedWorld]);

  // ========== RENDER BY PHASE ==========

  if (connectionError) {
    return (
      <ErrorView
        message={connectionError}
        onRetry={() => {
          setConnectionError(null);
          setPhase("loading");
          // Re-trigger initialization
          window.location.reload();
        }}
      />
    );
  }

  if (phase === "loading") {
    return <LoadingView />;
  }

  if (phase === "landing") {
    return <LandingView onEnter={enterWorlds} />;
  }

  // New: Infinite Worlds browser (replaces genre grid + world list)
  if (phase === "worlds") {
    return (
      <>
        <WorldBrowser
          landGroups={landGroups}
          onSelect={selectInfiniteWorld}
          onBack={() => setPhase("landing")}
          nsfwEnabled={nsfwEnabled}
          nsfwAutoBlocked={nsfwAutoBlocked}
          onRequestNsfw={() => requestAgeVerification()}
        />
        <AgeGateModal
          isOpen={showAgeGate}
          onConfirm={handleAgeVerified}
          onCancel={handleAgeGateCancelled}
        />
      </>
    );
  }

  /// New: Infinite Worlds campfire (character selection)
  if (phase === "infinite-campfire" && infiniteCampfire && selectedWorld) {
    return (
      <>
        <InfiniteCampfireView
          campfire={infiniteCampfire}
          onSelect={selectInfiniteCharacter}
          onBack={() => setPhase("worlds")}
          loading={processing}
          onCreateOwn={() => setCharCreatorOpen(true)}
        />
        <CharacterCreationModal
          isOpen={charCreatorOpen}
          onClose={() => setCharCreatorOpen(false)}
          onSubmit={handleCreateCharacter}
          worldName={selectedWorld.name}
          loading={charCreatorLoading}
        />
      </>
    );
  }

  // Game phase
  return (
    <main className="h-dvh flex flex-col bg-[var(--void)]">
      {/* Modals */}
      {negotiating && (
        <SceneNegotiation
          npcName={negotiating.npc_name}
          sceneId={negotiating.scene_id}
          onConfirm={handleNegotiationComplete}
          onCancel={handleNegotiationCancel}
        />
      )}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          // Refresh preferences when closing
          api.getPreferences()
            .then((prefs) => setShowReasoning(prefs.show_reasoning))
            .catch((err) => console.error("[Settings] Failed to refresh preferences:", err));
        }}
        nsfwEnabled={nsfwEnabled}
        onNsfwToggle={handleNsfwToggle}
        nsfwVerified={nsfwVerified}
        onRequestAgeVerification={() => requestAgeVerification()}
      />
      <AgeGateModal
        isOpen={showAgeGate}
        onConfirm={handleAgeVerified}
        onCancel={handleAgeGateCancelled}
      />
      <BillingPanel
        isOpen={billingOpen}
        onClose={() => setBillingOpen(false)}
      />
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        worldId={selectedWorld?.id || null}
        worldName={selectedWorld?.name}
        playerId={playerId}
      />
      <PlayerStatsModal
        isOpen={playerStatsOpen}
        onClose={() => setPlayerStatsOpen(false)}
        stats={playerWorldStats}
        influence={influence}
        worldName={selectedWorld?.name}
        onLeaderboardClick={() => {
          setPlayerStatsOpen(false);
          setLeaderboardOpen(true);
        }}
      />
      <EntityTimelineModal
        isOpen={entityTimelineOpen}
        onClose={() => {
          setEntityTimelineOpen(false);
          setEntityTimelineId(null);
          setEntityTimelineName(null);
        }}
        entityId={entityTimelineId}
        entityName={entityTimelineName || undefined}
      />
      <WorldTemplatesModal
        isOpen={worldTemplatesOpen}
        onClose={() => setWorldTemplatesOpen(false)}
        onSelectTemplate={(template) => {
          setSelectedWorldTemplate(template);
          setWorldTemplatesOpen(false);
          setWorldCreationOpen(true);
        }}
      />
      <WorldCreationModal
        isOpen={worldCreationOpen}
        onClose={() => {
          setWorldCreationOpen(false);
          setSelectedWorldTemplate(null);
        }}
        selectedTemplate={selectedWorldTemplate}
      />
      <EntityGenerationModal
        isOpen={entityGenerationOpen}
        onClose={() => setEntityGenerationOpen(false)}
        worldId={selectedWorld?.id || null}
        worldName={selectedWorld?.name}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // If it was a soft prompt (no reason), mark as dismissed
          if (!authModalReason) {
            setSavePromptDismissed(true);
          }
        }}
        reason={authModalReason}
        incentive={authModalIncentive}
      />

      {/* Header */}
      <header className="bg-[var(--shadow)] border-b border-[var(--slate)] px-3 py-2 md:px-4 flex items-center justify-between shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <button
            onClick={leaveWorld}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm"
            title="Leave World"
          >
            ‹
          </button>
          <span className="text-[var(--amber)] font-bold tracking-wider text-sm md:text-base">TEXTLANDS</span>
          {activeScene && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide animate-pulse">Scene</span>}
          {activeCombat && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide animate-pulse">Combat</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[var(--mist)] text-xs hidden sm:block">{zoneName}</span>
          {/* Influence badge - desktop only */}
          {influence && (
            <div className="hidden sm:block">
              <InfluenceBadge
                score={influence.trailblazer_score}
                rank={influence.rank}
                size="sm"
                onClick={() => setLeaderboardOpen(true)}
              />
            </div>
          )}
          {/* Chat button */}
          <button
            onClick={() => setShowChatPanel(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm"
            title="Chat"
          >
            #
          </button>
          {/* Social button - mobile only */}
          <button
            onClick={() => setShowSocialPanel(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm md:hidden"
            title="Friends"
          >
            @
          </button>
          <Link
            href="/characters"
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title="Characters"
          >
            ⚔
          </Link>
          <Link
            href="/leaderboards"
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title="Leaderboards"
          >
            ◆
          </Link>
          <button
            onClick={() => setEntityGenerationOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title="Forge - Create Entities"
          >
            +
          </button>
          <button
            onClick={() => setBillingOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title="Account & Tokens"
          >
            $
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm"
            title="Settings"
          >
            *
          </button>
          <ThemePicker />
        </div>
      </header>

      {/* Mobile stats bar - hidden during active scene or combat */}
      {!activeScene && !activeCombat && (
        <MobileStats
          character={character}
          zoneName={zoneName}
          influence={influence}
          onLeaderboardClick={() => setLeaderboardOpen(true)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {activeCombat ? (
          /* Combat Interface */
          <div className="flex-1 flex flex-col min-w-0">
            <CombatPanel
              combat={activeCombat}
              playerId={character?.id || ""}
              onAction={handleCombatAction}
              isProcessing={processing}
              lastNarrative={combatNarrative}
            />
          </div>
        ) : activeScene ? (
          /* Active Scene Interface */
          <div className="flex-1 flex flex-col min-w-0">
            <ActiveScene
              scene={activeScene}
              onAction={handleSceneAction}
              onSafeword={handleSafeword}
              onComplete={handleSceneComplete}
              isProcessing={processing}
            />
          </div>
        ) : (
          /* Normal Game Interface */
          <div className="flex-1 flex flex-col min-w-0">
            <GameLog entries={entries} showReasoning={showReasoning} />
            <SuggestedActions
              suggestions={suggestions}
              onSelect={handleCommand}
              disabled={processing}
            />
            <QuickActions
              onCommand={handleCommand}
              disabled={processing}
              onTimelineClick={() => setEntityTimelineOpen(true)}
              hasExaminedEntity={!!entityTimelineId}
              onForgeClick={() => setEntityGenerationOpen(true)}
            />
            <CommandInput
              onSubmit={handleCommand}
              disabled={processing}
              placeholder={processing ? "..." : "What do you do?"}
            />
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <CharacterPanel
            character={character}
            zoneName={zoneName}
            influence={influence}
            onLeaderboardClick={() => setLeaderboardOpen(true)}
            onStatsClick={handleOpenPlayerStats}
            footprints={footprints}
            onLeaveMessage={handleLeaveMessage}
            loadingFootprints={loadingFootprints}
          />
          <SocialPanel
            playerId={playerId || undefined}
            lastFriendOnline={lastFriendOnline}
            lastFriendOffline={lastFriendOffline}
            lastFriendRequest={lastFriendRequest}
            lastDMReceived={lastDMReceived}
            onSendDM={ws.sendDM}
          />
        </div>
      </div>

      {/* Mobile social panel slide-out */}
      {showSocialPanel && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSocialPanel(false)}
          />
          {/* Panel */}
          <div className="absolute top-0 right-0 h-full w-72 bg-[var(--shadow)] border-l border-[var(--slate)] animate-slide-in-right flex flex-col pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between p-3 border-b border-[var(--slate)]">
              <span className="text-[var(--amber)] font-bold text-sm">Friends</span>
              <button
                onClick={() => setShowSocialPanel(false)}
                className="text-[var(--mist)] hover:text-[var(--text)] text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-hidden [&>div]:w-full [&>div]:border-l-0">
              <SocialPanel
                playerId={playerId || undefined}
                lastFriendOnline={lastFriendOnline}
                lastFriendOffline={lastFriendOffline}
                lastFriendRequest={lastFriendRequest}
                lastDMReceived={lastDMReceived}
                onSendDM={ws.sendDM}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat panel slide-up */}
      {showChatPanel && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowChatPanel(false)}
          />
          {/* Panel - slide up from bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[60vh] md:h-[50vh] md:left-auto md:right-4 md:bottom-4 md:w-96 md:rounded-t-lg bg-[var(--shadow)] border-t md:border border-[var(--slate)] animate-slide-up flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between p-3 border-b border-[var(--slate)] shrink-0">
              <span className="text-[var(--amber)] font-bold text-sm">Chat</span>
              <button
                onClick={() => setShowChatPanel(false)}
                className="text-[var(--mist)] hover:text-[var(--text)] text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-hidden [&>div]:h-full [&>div]:border-l-0">
              <ChatPanel
                playerId={playerId || undefined}
                playerName={character?.name}
                zoneId={character?.current_zone_id || undefined}
                zoneName={zoneName}
                landKey={selectedWorld?.land as LandKey | undefined}
                worldName={selectedWorld?.name}
                isConnected={ws.isConnected}
                onSendChat={ws.sendChat}
                onSendLandChat={ws.sendLandChat}
                onSendGlobalChat={ws.sendGlobalChat}
                onSubscribeLand={ws.subscribeLandChat}
                onUnsubscribeLand={ws.unsubscribeLandChat}
                onSubscribeGlobal={ws.subscribeGlobalChat}
                onUnsubscribeGlobal={ws.unsubscribeGlobalChat}
                lastZoneMessage={lastZoneMessage}
                lastLandMessage={lastLandMessage}
                lastGlobalMessage={lastGlobalMessage}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
