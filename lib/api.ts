// TextLands API client

import type {
  Character,
  LookResponse,
  MoveResponse,
  TalkResponse,
  ActionResponse,
  CombatSession,
  CombatActionResponse,
  Genre,
  World,
  WorldsByGenre,
  CampfireResponse,
  DoActionResponse,
  IntimacyResponse,
  NegotiationRequest,
  SceneActionRequest,
  ExplainResponse,
  InfiniteWorld,
  WorldTemplate,
  GeneratedEntity,
  GenerateEntityRequest,
  PlayerWorldStats,
  LeaderboardEntry,
  InfiniteCampfireResponse,
  InfiniteCampfireCharacter,
} from "@/types/game";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// TODO: Integrate Clerk auth - for now uses cookie-based guest sessions
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Send cookies for guest session auth
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// Session types
export interface SessionInfo {
  player_id: string;
  is_guest: boolean;
  display_name: string;
  can_save: boolean;
  character_id: string | null;
  character_name: string | null;
  world_id: string | null;
  world_name: string | null;
}

export interface StartSessionRequest {
  world_id?: string;
  character_id?: string;
}

export interface StartSessionResponse {
  session: SessionInfo;
  message: string;
  opening_narrative?: string;
}

// Session endpoints
export async function getSession(): Promise<SessionInfo> {
  return fetchAPI<SessionInfo>("/session/current");
}

export async function startSession(params?: StartSessionRequest): Promise<StartSessionResponse> {
  return fetchAPI<StartSessionResponse>("/session/start", {
    method: "POST",
    body: params ? JSON.stringify(params) : undefined,
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      credentials: "include",
      cache: "no-store"
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Preferences endpoints
export interface UserPreferences {
  show_reasoning: boolean;
  show_on_failure: boolean;
  language_code?: string;
}

export async function getPreferences(): Promise<UserPreferences> {
  return fetchAPI<UserPreferences>("/session/preferences");
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  return fetchAPI<UserPreferences>("/session/preferences", {
    method: "POST",
    body: JSON.stringify(prefs),
  });
}

// Get explanation for a past action (on-demand)
export async function explainAction(actionId: string): Promise<ExplainResponse> {
  return fetchAPI<ExplainResponse>(`/actions/${actionId}/explain`);
}

// Character endpoints
export async function createCharacter(data: {
  name: string;
  race: string;
  class: string;
}): Promise<Character> {
  return fetchAPI<Character>("/characters", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listCharacters(): Promise<Character[]> {
  return fetchAPI<Character[]>("/characters");
}

export async function getCharacter(characterId: string): Promise<Character> {
  return fetchAPI<Character>(`/characters/${characterId}`);
}

// Action endpoints
export async function look(characterId: string): Promise<LookResponse> {
  return fetchAPI<LookResponse>("/actions/look", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId }),
  });
}

export async function move(
  characterId: string,
  destination: string
): Promise<MoveResponse> {
  return fetchAPI<MoveResponse>("/actions/move", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, destination }),
  });
}

export async function talk(
  characterId: string,
  npcId: string,
  message?: string
): Promise<TalkResponse> {
  return fetchAPI<TalkResponse>(`/actions/talk/${npcId}`, {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, message }),
  });
}

export async function performAction(
  characterId: string,
  action: string
): Promise<ActionResponse> {
  return fetchAPI<ActionResponse>("/actions/action", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, action }),
  });
}

// Combat endpoints
export async function startCombat(
  characterId: string,
  enemyIds: string[]
): Promise<CombatSession> {
  return fetchAPI<CombatSession>("/combat/start", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, enemy_ids: enemyIds }),
  });
}

export async function getCombatState(sessionId: string): Promise<CombatSession> {
  return fetchAPI<CombatSession>(`/combat/${sessionId}`);
}

export async function combatAction(
  sessionId: string,
  characterId: string,
  action: "attack" | "defend" | "skill" | "item" | "flee",
  targetId?: string,
  skillName?: string
): Promise<CombatActionResponse> {
  return fetchAPI<CombatActionResponse>(`/combat/${sessionId}/action`, {
    method: "POST",
    body: JSON.stringify({
      character_id: characterId,
      action,
      target_id: targetId,
      skill_name: skillName,
    }),
  });
}

export async function getActiveCombat(
  characterId: string
): Promise<CombatSession | null> {
  return fetchAPI<CombatSession | null>(`/combat/active/${characterId}`);
}

// World selection endpoints
export async function getGenres(): Promise<Genre[]> {
  return fetchAPI<Genre[]>("/worlds/genres");
}

export async function getWorlds(): Promise<WorldsByGenre[]> {
  return fetchAPI<WorldsByGenre[]>("/worlds");
}

export async function getCampfire(worldId: string): Promise<CampfireResponse> {
  return fetchAPI<CampfireResponse>(`/worlds/${worldId}/campfire`);
}

// Natural language action endpoint
export async function doAction(action: string): Promise<DoActionResponse> {
  return fetchAPI<DoActionResponse>("/actions/do", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

// Intimacy / Relationship dynamics endpoints

export async function getRelationshipStatus(npcId: string): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>(`/intimacy/relationship/${npcId}`);
}

export async function getIntimacyPreferences(): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>("/intimacy/preferences");
}

export async function startScene(npcId: string): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>("/intimacy/scene/start", {
    method: "POST",
    body: JSON.stringify({ npc_id: npcId }),
  });
}

export async function negotiateScene(
  negotiation: NegotiationRequest
): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>("/intimacy/scene/negotiate", {
    method: "POST",
    body: JSON.stringify(negotiation),
  });
}

export async function sceneAction(
  request: SceneActionRequest
): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>("/intimacy/scene/action", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function invokeSafeword(): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>("/intimacy/scene/safeword", {
    method: "POST",
  });
}

export async function completeScene(
  aftercareQuality: "minimal" | "standard" | "extended" = "standard"
): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>(
    `/intimacy/scene/complete?aftercare_quality=${aftercareQuality}`,
    { method: "POST" }
  );
}

export async function getActiveScene(guestId?: string): Promise<IntimacyResponse> {
  const params = guestId ? `?guest_id=${guestId}` : "";
  return fetchAPI<IntimacyResponse>(`/intimacy/active${params}`);
}

// ============ INFINITE WORLDS API ============

// List public worlds
export async function getInfiniteWorlds(): Promise<InfiniteWorld[]> {
  return fetchAPI<InfiniteWorld[]>("/infinite/worlds");
}

// Realm group from grouped endpoint
export interface RealmGroup {
  realm: string;
  display_name: string;
  description: string;
  world_count: number;
  is_locked: boolean;
  worlds: InfiniteWorld[];
}

// List worlds grouped by realm (preferred over getInfiniteWorlds)
export async function getInfiniteWorldsGrouped(): Promise<RealmGroup[]> {
  return fetchAPI<RealmGroup[]>("/infinite/worlds/grouped");
}

// Get world details
export async function getInfiniteWorld(worldId: string): Promise<InfiniteWorld> {
  return fetchAPI<InfiniteWorld>(`/infinite/worlds/${worldId}`);
}

// List world templates
export async function getWorldTemplates(): Promise<WorldTemplate[]> {
  return fetchAPI<WorldTemplate[]>("/infinite/templates");
}

// Get template details
export async function getWorldTemplate(slug: string): Promise<WorldTemplate> {
  return fetchAPI<WorldTemplate>(`/infinite/templates/${slug}`);
}

// Generate entity in a world (earns trailblazer rewards!)
export async function generateEntity(
  worldId: string,
  request: GenerateEntityRequest
): Promise<GeneratedEntity> {
  return fetchAPI<GeneratedEntity>(`/infinite/worlds/${worldId}/generate`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// List entities in a world
export async function getWorldEntities(
  worldId: string,
  entityType?: string
): Promise<GeneratedEntity[]> {
  const params = entityType ? `?entity_type=${entityType}` : "";
  return fetchAPI<GeneratedEntity[]>(`/infinite/worlds/${worldId}/entities${params}`);
}

// Get entity details with timeline
export async function getEntity(entityId: string): Promise<GeneratedEntity> {
  return fetchAPI<GeneratedEntity>(`/infinite/entities/${entityId}`);
}

// Get player stats for a world
export async function getPlayerWorldStats(
  worldId: string,
  playerId: string
): Promise<PlayerWorldStats> {
  return fetchAPI<PlayerWorldStats>(`/infinite/worlds/${worldId}/player/${playerId}/stats`);
}

// Get world leaderboard
export async function getWorldLeaderboard(worldId: string): Promise<LeaderboardEntry[]> {
  return fetchAPI<LeaderboardEntry[]>(`/infinite/worlds/${worldId}/leaderboard`);
}

// Get global leaderboard (maps API fields to frontend format)
interface GlobalLeaderboardEntryRaw {
  rank: number;
  player_id: string;
  total_trailblazer_score: number;
  total_entities_created: number;
  worlds_explored: number;
  last_active: string | null;
}

export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await fetchAPI<GlobalLeaderboardEntryRaw[]>("/infinite/leaderboard/global");
  return raw.map((entry) => ({
    rank: entry.rank,
    player_id: entry.player_id,
    trailblazer_score: entry.total_trailblazer_score,
    governance_points: 0,
    currency: 0,
    entities_created: entry.total_entities_created,
    last_played_at: entry.last_active || "",
  }));
}

// Get infinite world campfire (character selection)
export async function getInfiniteCampfire(worldId: string): Promise<InfiniteCampfireResponse> {
  return fetchAPI<InfiniteCampfireResponse>(`/infinite/worlds/${worldId}/campfire`);
}

// Claim a character from the campfire (legacy - use startInfiniteSession instead)
export interface ClaimCharacterResponse {
  success: boolean;
  character_id: string;
  world_id: string;
  opening_narrative?: string;
  message?: string;
}

export async function claimCharacter(
  worldId: string,
  characterId: string,
  playerId: string
): Promise<ClaimCharacterResponse> {
  return fetchAPI<ClaimCharacterResponse>(
    `/infinite/worlds/${worldId}/campfire/claim/${characterId}?player_id=${playerId}`,
    { method: "POST" }
  );
}

// Start session in an infinite world with a selected entity
export interface InfiniteSessionRequest {
  world_id: string;
  entity_id: string;
}

export interface InfiniteSessionResponse {
  session: SessionInfo;
  message: string;
  opening_narrative: string;
}

export async function startInfiniteSession(
  request: InfiniteSessionRequest
): Promise<InfiniteSessionResponse> {
  return fetchAPI<InfiniteSessionResponse>("/infinite/session/start", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Create custom character at campfire
export interface CreateCharacterRequest {
  name: string;
  occupation?: string;
  physical_description?: string;
  personality_traits?: string[];
  backstory_hook?: string;
}

export interface CreateCharacterResponse {
  success: boolean;
  character: InfiniteCampfireCharacter;
  message?: string;
}

export async function createCampfireCharacter(
  worldId: string,
  request: CreateCharacterRequest
): Promise<CreateCharacterResponse> {
  return fetchAPI<CreateCharacterResponse>(
    `/infinite/worlds/${worldId}/campfire/create`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}

// ============ PLAYER PREFERENCES API ============

// API response format
interface PlayerNsfwPreferencesRaw {
  nsfw_enabled: boolean;
  nsfw_prompt_count: number;
  nsfw_auto_blocked: boolean;
  prompts_remaining: number;
}

// Frontend-friendly format (with mapped fields)
export interface PlayerNsfwPreferences {
  nsfw_enabled: boolean;
  age_verified: boolean;
  rejection_count: number;
  auto_blocked: boolean;
}

export async function getPlayerPreferences(playerId: string): Promise<PlayerNsfwPreferences> {
  const raw = await fetchAPI<PlayerNsfwPreferencesRaw>(`/infinite/player/${playerId}/preferences`);
  // Map API fields to frontend expectations
  return {
    nsfw_enabled: raw.nsfw_enabled,
    age_verified: raw.prompts_remaining < 3, // Verified if they haven't rejected 3 times
    rejection_count: raw.nsfw_prompt_count,
    auto_blocked: raw.nsfw_auto_blocked,
  };
}

export async function updatePlayerPreferences(
  playerId: string,
  prefs: Partial<PlayerNsfwPreferences>
): Promise<PlayerNsfwPreferences> {
  // Map frontend fields to API format
  const apiPrefs: Partial<PlayerNsfwPreferencesRaw> = {};
  if (prefs.nsfw_enabled !== undefined) apiPrefs.nsfw_enabled = prefs.nsfw_enabled;
  if (prefs.auto_blocked !== undefined) apiPrefs.nsfw_auto_blocked = prefs.auto_blocked;

  const raw = await fetchAPI<PlayerNsfwPreferencesRaw>(`/infinite/player/${playerId}/preferences`, {
    method: "POST",
    body: JSON.stringify(apiPrefs),
  });

  return {
    nsfw_enabled: raw.nsfw_enabled,
    age_verified: raw.prompts_remaining < 3,
    rejection_count: raw.nsfw_prompt_count,
    auto_blocked: raw.nsfw_auto_blocked,
  };
}

export interface NsfwPromptResponse {
  allowed: boolean;
  requires_verification: boolean;
  auto_blocked: boolean;
  message?: string;
}

export async function handleNsfwPrompt(
  playerId: string,
  accepted: boolean
): Promise<NsfwPromptResponse> {
  return fetchAPI<NsfwPromptResponse>(`/infinite/player/${playerId}/nsfw-prompt`, {
    method: "POST",
    body: JSON.stringify({ accepted }),
  });
}

// ============ LOCATION INTERACTION API ============

export interface LocationFootprint {
  player_id: string;
  display_name: string;
  visited_at: string;
  message?: string;
}

export async function getLocationFootprints(entityId: string): Promise<LocationFootprint[]> {
  return fetchAPI<LocationFootprint[]>(`/infinite/entities/${entityId}/footprints`);
}

export interface LeaveMessageRequest {
  message: string;
}

export interface LeaveMessageResponse {
  success: boolean;
  message_id: string;
}

export async function leaveLocationMessage(
  entityId: string,
  message: string
): Promise<LeaveMessageResponse> {
  return fetchAPI<LeaveMessageResponse>(`/infinite/entities/${entityId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function recordLocationVisit(entityId: string): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/infinite/entities/${entityId}/visit`, {
    method: "POST",
  });
}

// ============ ENTITY TIMELINE API ============

export interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  occurred_at: string;
  caused_by_player_id?: string;
}

export async function getEntityTimeline(entityId: string): Promise<TimelineEvent[]> {
  return fetchAPI<TimelineEvent[]>(`/infinite/entities/${entityId}/timeline`);
}

export interface AddTimelineEventRequest {
  event_type: string;
  description: string;
}

export async function addEntityTimelineEvent(
  entityId: string,
  event: AddTimelineEventRequest
): Promise<TimelineEvent> {
  return fetchAPI<TimelineEvent>(`/infinite/entities/${entityId}/timeline`, {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function updateEntityState(
  entityId: string,
  state: Record<string, unknown>
): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/infinite/entities/${entityId}/state`, {
    method: "PATCH",
    body: JSON.stringify(state),
  });
}

// ============ PLAYER INFLUENCE API ============

export interface TierProgress {
  current_tier: number;
  next_tier: number;
  points_needed: number;
  progress_percent: number;
}

export interface PlayerInfluence {
  player_id: string;
  world_id: string;
  trailblazer_score: number;
  tier: number;
  title: string;
  powers: string[];
  governance_points: number;
  currency: number;
  is_world_creator: boolean;
  entities_created_count: number;
  total_passive_income: number;
  decay_at_risk: boolean;
  tier_progress: TierProgress;
  rank?: number;
}

export async function getPlayerInfluence(
  worldId: string,
  playerId: string
): Promise<PlayerInfluence> {
  return fetchAPI<PlayerInfluence>(`/infinite/worlds/${worldId}/player/${playerId}/influence`);
}

// ============ SESSION MANAGEMENT API ============

export interface ClaimSessionRequest {
  email?: string;
  provider?: string;
  provider_id?: string;
}

export interface ClaimSessionResponse {
  success: boolean;
  player_id: string;
  message: string;
}

export async function claimGuestSession(request: ClaimSessionRequest): Promise<ClaimSessionResponse> {
  return fetchAPI<ClaimSessionResponse>("/session/claim", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function endGuestSession(): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>("/session/guest", {
    method: "DELETE",
  });
}

// ============ ADDITIONAL ACTIONS API ============

export async function restAction(): Promise<DoActionResponse> {
  return fetchAPI<DoActionResponse>("/actions/rest", {
    method: "POST",
  });
}

export async function inventoryAction(): Promise<DoActionResponse> {
  return fetchAPI<DoActionResponse>("/actions/inventory", {
    method: "POST",
  });
}

// ============ BILLING API ============

// Subscription types
export interface SubscriptionStatus {
  is_active: boolean;
  plan: "free" | "plus";
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface TokenBalance {
  balance: number;
  lifetime_purchased: number;
}

export interface PlaytimeStatus {
  remaining_seconds: number;
  daily_limit_seconds: number;
  is_subscriber: boolean;
  resets_at: string;
}

export interface FreeUsesStatus {
  fate_rerolls_remaining: number;
  death_recoveries_remaining: number;
  nsfw_unlocks_remaining: number;
}

export interface UsageStatus {
  death_recoveries_used: number;
  death_recoveries_limit: number;
  fate_rerolls_used: number;
  fate_rerolls_limit: number;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface UnlockResponse {
  success: boolean;
  used_free: boolean;
  tokens_spent: number;
  message: string;
}

// Get subscription status
export async function getSubscription(): Promise<SubscriptionStatus> {
  return fetchAPI<SubscriptionStatus>("/billing/subscription");
}

// Start subscription checkout
export async function createSubscription(): Promise<CheckoutResponse> {
  return fetchAPI<CheckoutResponse>("/billing/subscription/create", {
    method: "POST",
  });
}

// Cancel subscription
export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>("/billing/subscription/cancel", {
    method: "POST",
  });
}

// Get token balance
export async function getTokenBalance(): Promise<TokenBalance> {
  return fetchAPI<TokenBalance>("/billing/tokens");
}

// Purchase tokens
export type TokenPack = "starter" | "standard" | "value";

export async function purchaseTokens(pack: TokenPack): Promise<CheckoutResponse> {
  return fetchAPI<CheckoutResponse>(`/billing/tokens/purchase?pack=${pack}`, {
    method: "POST",
  });
}

// Get playtime remaining
export async function getPlaytime(): Promise<PlaytimeStatus> {
  return fetchAPI<PlaytimeStatus>("/billing/playtime");
}

// Get free uses remaining
export async function getFreeUses(): Promise<FreeUsesStatus> {
  return fetchAPI<FreeUsesStatus>("/billing/free-uses");
}

// Get monthly usage
export async function getUsage(): Promise<UsageStatus> {
  return fetchAPI<UsageStatus>("/billing/usage");
}

// Unlock features
export interface UnlockRequest {
  use_free?: boolean;
  action_id?: string;
}

export async function unlockNsfw(request?: UnlockRequest): Promise<UnlockResponse> {
  return fetchAPI<UnlockResponse>("/billing/unlock/nsfw", {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });
}

export async function unlockDeathRecovery(request?: UnlockRequest): Promise<UnlockResponse> {
  return fetchAPI<UnlockResponse>("/billing/unlock/death-recovery", {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });
}

export async function unlockFateReroll(request?: UnlockRequest): Promise<UnlockResponse> {
  return fetchAPI<UnlockResponse>("/billing/unlock/fate-reroll", {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });
}

export async function unlockPlaytime(): Promise<UnlockResponse> {
  return fetchAPI<UnlockResponse>("/billing/unlock/playtime", {
    method: "POST",
  });
}
