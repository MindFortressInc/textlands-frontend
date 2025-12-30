"use client";

import { useState, useCallback, useEffect } from "react";
import { GameLog, CommandInput, CharacterPanel, QuickActions, SuggestedActions, MobileStats, SceneNegotiation, ActiveScene, SettingsPanel, CombatPanel, AgeGateModal, AuthModal, BillingPanel, InfluenceBadge, LeaderboardModal, CharacterCreationModal, PlayerStatsModal, EntityTimelineModal, WorldTemplatesModal, WorldCreationModal, SocialPanel, ChatPanel, LoadingIndicator, InventoryPanel, CurrencyPanel, SkillsPanel } from "@/components/game";
import { LoadingView, ErrorView, LandingView, CharacterSelectView, WorldBrowser, InfiniteCampfireView } from "@/components/views";
import { ThemePicker } from "@/components/ThemePicker";
import type { Character, GameLogEntry, CharacterOption, ActiveScene as ActiveSceneType, NegotiationRequest, CombatSession, ReasoningInfo, InfiniteWorld, InfiniteCampfireResponse, InfiniteCampfireCharacter, AccountPromptReason, WorldTemplate } from "@/types/game";
import type { RosterCharacter } from "@/lib/api";
import * as api from "@/lib/api";
import type { LandGroup, PlayerInfluence, LocationFootprint, LandKey } from "@/lib/api";
import type { PlayerWorldStats } from "@/types/game";
import { safeStorage } from "@/lib/errors";
import { useWebSocket } from "@/lib/useWebSocket";
import { useUIStrings } from "@/contexts/UIStringsContext";
import { useGame } from "@/contexts/GameContext";
import { useSession } from "@/contexts/SessionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCombat } from "@/contexts/CombatContext";
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

type AppPhase = "loading" | "landing" | "character-select" | "genres" | "worlds" | "campfire" | "infinite-campfire" | "game";

// View components extracted to components/views/

// ========== MAIN PAGE COMPONENT ==========

export default function GamePage() {
  // ========== CONTEXT HOOKS ==========
  const {
    character, setCharacter,
    entries, setEntries, addLog, clearLog,
    zoneName, setZoneName,
    processing, setProcessing,
    suggestions, setSuggestions,
    footprints, setFootprints,
    loadingFootprints, setLoadingFootprints,
    currentLocationEntityId, setCurrentLocationEntityId,
  } = useGame();

  const {
    phase, setPhase,
    connectionError, setConnectionError,
    landGroups, setLandGroups,
    selectedWorld, setSelectedWorld,
    infiniteCampfire, setInfiniteCampfire,
    playerId, setPlayerId,
    isGuest, setIsGuest,
    roster, setRoster,
    loadingRoster, setLoadingRoster,
    influence, setInfluence,
  } = useSession();

  const {
    nsfwEnabled, setNsfwEnabled,
    nsfwVerified, setNsfwVerified,
    nsfwRejections, setNsfwRejections,
    nsfwAutoBlocked, setNsfwAutoBlocked,
    showAgeGate, setShowAgeGate,
    ageGateCallback, setAgeGateCallback,
    pendingNsfwCommand, setPendingNsfwCommand,
    requestAgeVerification,
    showReasoning, setShowReasoning,
    saveNsfwPreferences,
  } = useSettings();

  const {
    activeCombat, setActiveCombat,
    combatNarrative, setCombatNarrative,
    activeScene, setActiveScene,
    negotiating, setNegotiating,
    isInCombat,
    isInScene,
  } = useCombat();

  // ========== LOCAL UI STATE ==========
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Character creation state
  const [charCreatorOpen, setCharCreatorOpen] = useState(false);

  // Player stats modal state
  const [playerStatsOpen, setPlayerStatsOpen] = useState(false);
  const [playerWorldStats, setPlayerWorldStats] = useState<PlayerWorldStats | null>(null);

  // Entity timeline modal state
  const [entityTimelineOpen, setEntityTimelineOpen] = useState(false);
  const [entityTimelineId, setEntityTimelineId] = useState<string | null>(null);
  const [entityTimelineName, setEntityTimelineName] = useState<string | null>(null);

  // World templates modal state
  const [worldTemplatesOpen, setWorldTemplatesOpen] = useState(false);

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

  // Inventory panel state
  const [showInventory, setShowInventory] = useState(false);

  // Currency panel state
  const [showCurrency, setShowCurrency] = useState(false);

  // Skills panel state
  const [showSkills, setShowSkills] = useState(false);

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

  // UI Strings for localization
  const { t, helpText } = useUIStrings();

  // ========== INITIALIZATION ==========

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
          setIsGuest(session.is_guest ?? true);

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
            // Clear any pending session since we successfully restored
            safeStorage.removeItem("textlands_pending_session");
            return; // Skip landing, go straight to game
          }

          // Check for pending session from pre-auth (magic link flow)
          // This handles the case where a guest was playing, triggered auth,
          // and now returns as an authenticated user
          if (!session.is_guest) {
            const pending = safeStorage.getJSON<{
              world_id?: string;
              entity_id?: string;
              character_name?: string;
              world_name?: string;
              timestamp?: number;
            }>("textlands_pending_session", {});

            // Only restore if pending session exists and is less than 30 minutes old
            const isRecent = pending.timestamp && (Date.now() - pending.timestamp) < 30 * 60 * 1000;

            if (pending.world_id && pending.entity_id && isRecent) {
              console.log("[Auth] Found pending session, restoring:", pending);
              try {
                const { session: newSession, opening_narrative } = await api.startSession({
                  world_id: pending.world_id,
                  entity_id: pending.entity_id,
                });

                // Clear pending session
                safeStorage.removeItem("textlands_pending_session");

                setCurrentSession(newSession);
                setCharacter({
                  id: newSession.character_id || pending.entity_id,
                  name: newSession.character_name || pending.character_name || "Unknown",
                  race: "Unknown",
                  character_class: "Wanderer",
                  stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
                  current_zone_id: null,
                  inventory: [],
                  equipped: {},
                });

                setZoneName(newSession.world_name || pending.world_name || "Unknown");
                setEntries([
                  log("system", `Welcome back, ${newSession.character_name || pending.character_name || "traveler"}.`),
                  log("narrative", opening_narrative || `You return to ${pending.world_name}...`),
                  log("system", "Your progress has been saved to your account."),
                ]);
                setPhase("game");
                return; // Skip landing, restored session
              } catch (err) {
                console.warn("[Auth] Failed to restore pending session:", err);
                // Clear stale pending session
                safeStorage.removeItem("textlands_pending_session");
              }
            } else if (pending.world_id) {
              // Pending session exists but is stale, clear it
              safeStorage.removeItem("textlands_pending_session");
            }
          }

          // Fetch roster for logged-in users without active session
          if (!session.is_guest) {
            setLoadingRoster(true);
            try {
              const rosterData = await api.getCharacterRoster();
              setRoster(rosterData);
              setLoadingRoster(false);

              // If user has 2+ active characters, show character select screen
              const activeCount = session.character_count ?? rosterData.filter(c => c.status === "active").length;
              if (activeCount >= 2) {
                setPhase("character-select");
                return;
              }
            } catch (err) {
              console.warn("[Init] Failed to fetch roster:", err instanceof Error ? err.message : err);
              setLoadingRoster(false);
            }
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

    // Refetch land groups to include NSFW lands now that user is verified
    try {
      const updatedLandGroups = await api.getInfiniteWorldsGrouped();
      setLandGroups(updatedLandGroups);
    } catch {
      // Refetch failed, user may need to refresh
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

  // Save pending session before auth redirect (so we can restore after magic link)
  const savePendingSession = useCallback(() => {
    if (currentSession?.world_id && currentSession?.character_id) {
      safeStorage.setJSON("textlands_pending_session", {
        world_id: currentSession.world_id,
        entity_id: currentSession.character_id,
        character_name: currentSession.character_name,
        world_name: currentSession.world_name,
        timestamp: Date.now(),
      });
      console.log("[Auth] Saved pending session for restore after auth");
    }
  }, [currentSession]);

  const enterWorlds = () => setPhase("worlds");

  // Resume an existing character from roster
  const resumeCharacter = async (char: RosterCharacter) => {
    setProcessing(true);
    try {
      const { session, opening_narrative } = await api.startSession({
        world_id: char.world_id,
        entity_id: char.entity_id,
      });

      setCurrentSession(session);
      setCharacter({
        id: session.character_id || char.entity_id,
        name: session.character_name || char.character_name,
        race: "Unknown",
        character_class: char.occupation || "Wanderer",
        stats: {
          hp: char.current_hp ?? 100,
          max_hp: char.max_hp ?? 100,
          mana: 50,
          max_mana: 50,
          gold: 0,
          xp: 0,
          level: 1
        },
        current_zone_id: null,
        inventory: [],
        equipped: {},
      });

      // Try to get world info
      let worldName = char.world_name;
      try {
        const world = await api.getInfiniteWorld(char.world_id);
        setSelectedWorld(world);
        worldName = world.name;
      } catch {
        // World fetch failed, use roster info
      }

      setZoneName(worldName);
      setEntries([
        log("system", `Welcome back, ${char.character_name}.`),
        log("narrative", opening_narrative || `You return to ${worldName}...`),
        log("system", "Type 'look' to see your surroundings"),
      ]);
      setPhase("game");
    } catch (err) {
      console.error("[ResumeCharacter] Failed:", err);
      // Fall back to world browser
      setPhase("worlds");
    }
    setProcessing(false);
  };

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
    if (processing) return;
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
    if (!selectedWorld || !infiniteCampfire || processing) return;

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

  // Handle character created from conversational modal
  const handleCharacterCreated = async (entityId: string) => {
    if (!selectedWorld) return;

    setCharCreatorOpen(false);
    setProcessing(true);

    try {
      // Claim the character that was created during conversation
      const claimResult = await api.claimCampfireCharacter(selectedWorld.id, entityId, playerId || undefined);

      // Start session with the claimed character
      const { session, opening_narrative } = await api.startSession({
        world_id: selectedWorld.id,
        entity_id: entityId,
      });

      setCurrentSession(session);
      setCharacter({
        id: session.character_id || entityId,
        name: session.character_name || claimResult.character_name,
        race: "Unknown",
        character_class: "Adventurer",
        stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
        current_zone_id: null,
        inventory: [],
        equipped: {},
      });

      setZoneName(session.world_name || selectedWorld.name);
      setEntries([
        log("system", `Entering ${session.world_name || selectedWorld.name}`),
        log("narrative", opening_narrative || infiniteCampfire?.intro_text || "Your adventure begins..."),
        log("system", "Type 'help' for commands, or just describe what you want to do"),
      ]);
      setPhase("game");
    } catch (err) {
      console.error("[CharacterCreation] Failed to start session:", err);
      setEntries([log("system", `Error: ${err instanceof Error ? err.message : "Unknown error"}`)]);
    } finally {
      setProcessing(false);
    }
  };

  // Fetch location footprints
  const fetchFootprints = async (locationEntityId: string) => {
    setLoadingFootprints(true);
    setCurrentLocationEntityId(locationEntityId);
    try {
      const data = await api.getLocationFootprints(locationEntityId);
      setFootprints(data);
    } catch (err) {
      console.error("[Footprints] Failed to fetch:", err);
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
    } catch (err) {
      console.error("[PlayerStats] Failed to fetch:", err);
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
        addLog("system", helpText || t("help_commands"));
      } else if (action === "leave" && rest[0] === "message") {
        // Leave a message at current location
        const messageMatch = command.match(/leave\s+message\s+["'](.+)["']/i);
        if (messageMatch) {
          // TODO: When backend provides location_entity_id, call api.leaveLocationMessage
          addLog("system", t("carve_message"));
          addLog("narrative", `"${messageMatch[1]}" - ${t("message_seen")}`);
        } else {
          addLog("system", t("leave_message_usage"));
        }
      } else if (action === "stats") {
        const s = character.stats || { hp: 0, max_hp: 100, mana: 0, max_mana: 50, gold: 0, xp: 0, level: 1 };
        addLog("system", `${character.name} - Lv.${s.level} ${character.race} ${character.character_class}\nHP: ${s.hp}/${s.max_hp} | MP: ${s.mana}/${s.max_mana} | Gold: ${s.gold} | XP: ${s.xp}`);
      } else if (action === "inventory") {
        setShowInventory(true);
        addLog("system", t("opening_inventory"));
      } else if (action === "gold" || action === "wallet") {
        setShowCurrency(true);
        addLog("system", t("opening_wallet"));
      } else if (action === "skills") {
        setShowSkills(true);
        addLog("system", t("opening_skills"));
      } else if (action === "settings") {
        setSettingsOpen(true);
        addLog("system", t("opening_settings"));
      } else {
        // API - use natural language endpoint
        const result = await api.doAction(command);

        // Check for NSFW block
        if (result.nsfw_blocked) {
          // Action was blocked due to NSFW content
          if (nsfwAutoBlocked) {
            // User has permanently blocked NSFW - show message
            addLog("system", t("nsfw_enable_required"));
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
          savePendingSession(); // Save session before auth redirect
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

          // Handle system message from backend (show as system log entry)
          if (result.system_message) {
            addLog("system", result.system_message.message);
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
            savePendingSession(); // Save session before auth redirect
            setShowAuthModal(true);
          }
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    setProcessing(false);
  }, [character, addLog, nsfwAutoBlocked, requestAgeVerification, savePromptDismissed, savePendingSession]);

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
        savePendingSession(); // Save session before auth redirect
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
  }, [activeCombat, character, addLog, savePendingSession]);

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
    const isLoggedIn = !!playerId && !isGuest;
    return (
      <>
        <LandingView
          onEnter={enterWorlds}
          onLogin={() => setShowAuthModal(true)}
          onResumeCharacter={resumeCharacter}
          isLoggedIn={isLoggedIn}
          roster={roster}
          loadingRoster={loadingRoster}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Character select for users with 2+ characters
  if (phase === "character-select") {
    return (
      <CharacterSelectView
        roster={roster}
        onSelect={resumeCharacter}
        onNewCharacter={enterWorlds}
        loadingRoster={loadingRoster}
      />
    );
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
  if (phase === "infinite-campfire") {
    // Still loading campfire data - show loading screen
    if (!infiniteCampfire || !selectedWorld) {
      return (
        <main className="h-dvh flex items-center justify-center bg-[var(--void)]">
          <div className="text-[var(--mist)]">Loading campfire...</div>
        </main>
      );
    }
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
          onComplete={handleCharacterCreated}
          worldId={selectedWorld.id}
          worldName={selectedWorld.name}
          playerId={playerId || undefined}
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
        sessionContext={currentSession?.world_id ? {
          world_id: currentSession.world_id,
          entity_id: currentSession.character_id ?? undefined,
          character_name: currentSession.character_name ?? undefined,
        } : undefined}
      />
      <InventoryPanel
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
      />
      <CurrencyPanel
        isOpen={showCurrency}
        onClose={() => setShowCurrency(false)}
        worldId={currentSession?.world_id || null}
        playerId={playerId}
      />
      <SkillsPanel
        isOpen={showSkills}
        onClose={() => setShowSkills(false)}
      />

      {/* Header */}
      <header className="bg-[var(--shadow)] border-b border-[var(--slate)] px-3 py-2 md:px-4 flex items-center justify-between shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <button
            onClick={leaveWorld}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm"
            title={t("leave_world")}
          >
            ‹
          </button>
          <span className="text-[var(--amber)] font-bold tracking-wider text-sm md:text-base">TEXTLANDS</span>
          {activeScene && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide animate-pulse">{t("scene")}</span>}
          {activeCombat && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide animate-pulse">{t("combat")}</span>}
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
            title={t("chat")}
          >
            #
          </button>
          {/* Social button - mobile only */}
          <button
            onClick={() => setShowSocialPanel(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm md:hidden"
            title={t("friends")}
          >
            @
          </button>
          <Link
            href="/characters"
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title={t("characters")}
          >
            ⚔
          </Link>
          <button
            onClick={() => setShowSkills(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title={t("skills")}
          >
            ◈
          </button>
          <Link
            href="/hiscores"
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title={t("hiscores")}
          >
            ◆
          </Link>
          <button
            onClick={() => setBillingOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title={t("account_tokens")}
          >
            $
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
            title={t("settings")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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
            <LoadingIndicator show={processing} />
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
            />
            <CommandInput
              onSubmit={handleCommand}
              disabled={processing}
              placeholder={processing ? "..." : t("what_do_you_do")}
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
              <span className="text-[var(--amber)] font-bold text-sm">{t("friends")}</span>
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
              <span className="text-[var(--amber)] font-bold text-sm">{t("chat")}</span>
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
