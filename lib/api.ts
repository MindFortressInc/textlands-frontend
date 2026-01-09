// TextLands API client

import type {
  CombatSession,
  DoActionResponse,
  IntimacyResponse,
  ExplainResponse,
  InfiniteWorld,
  WorldTemplate,
  PlayerWorldStats,
  LeaderboardEntry,
  InfiniteCampfireResponse,
  InfiniteCampfireCharacter,
  CharacterProfile,
  FrontierStatus,
  WorldTimeResponse,
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
export interface ContentSettings {
  age_category: string;      // "adult", "teen", "rejected"
  content_mode: string;      // "safe", "standard", "mature"
  nsfw_enabled: boolean;
  nsfw_auto_blocked: boolean;
}

export interface SessionInfo {
  player_id: string;
  is_guest: boolean;
  display_name: string;
  can_save: boolean;
  character_id: string | null;
  character_name: string | null;
  world_id: string | null;
  world_name: string | null;
  land: string | null;
  content_settings?: ContentSettings;
  character_count?: number; // Number of active characters (for multi-char select flow)
  opening_narrative?: string; // Resume narrative from backend
  suggested_actions?: string[]; // Initial actions on resume
}

export interface StartSessionRequest {
  world_id?: string;
  entity_id?: string;  // Character/entity to embody (from campfire)
  character_id?: string;  // Deprecated alias for entity_id
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

// UI Strings - backend-provided localized text
export interface UIStringsResponse {
  language_code: string;
  strings: Record<string, string>;
  help_text: string;
}

export async function getUIStrings(languageCode = "en"): Promise<UIStringsResponse> {
  return fetchAPI<UIStringsResponse>(`/session/ui-strings?language_code=${languageCode}`);
}

// Get explanation for a past action (on-demand)
export async function explainAction(actionId: string): Promise<ExplainResponse> {
  return fetchAPI<ExplainResponse>(`/actions/${actionId}/explain`);
}

// Combat state polling (actions go through doAction)
export async function getCombatState(sessionId: string): Promise<CombatSession> {
  return fetchAPI<CombatSession>(`/combat/${sessionId}`);
}

export async function getActiveCombat(
  characterId: string
): Promise<CombatSession | null> {
  return fetchAPI<CombatSession | null>(`/combat/active/${characterId}`);
}

// Legacy curated world endpoints removed - use infinite worlds API

// Natural language action endpoint
export async function doAction(action: string): Promise<DoActionResponse> {
  return fetchAPI<DoActionResponse>("/actions/do", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

// Intimacy state polling (actions go through doAction)
export async function getActiveScene(guestId?: string): Promise<IntimacyResponse> {
  const params = guestId ? `?guest_id=${guestId}` : "";
  return fetchAPI<IntimacyResponse>(`/intimacy/active${params}`);
}

// ============ INFINITE WORLDS API ============

// Land group from grouped endpoint
export interface LandGroup {
  land: string;
  display_name: string;
  description: string;
  realm_count: number;
  is_locked: boolean;
  realms: InfiniteWorld[];
}

// List worlds grouped by land (preferred over getInfiniteWorlds)
export async function getInfiniteWorldsGrouped(): Promise<LandGroup[]> {
  return fetchAPI<LandGroup[]>("/infinite/worlds/grouped");
}

// Get world details
export async function getInfiniteWorld(worldId: string): Promise<InfiniteWorld> {
  return fetchAPI<InfiniteWorld>(`/infinite/worlds/${worldId}`);
}

// Create a new world
export interface CreateWorldRequest {
  name: string;
  description?: string;  // AI generates world rules from this
  template_slug?: string;
  is_nsfw?: boolean;
}

export interface CreateWorldResponse {
  success: boolean;
  world: InfiniteWorld;
  message?: string;
}

export async function createWorld(request: CreateWorldRequest): Promise<CreateWorldResponse> {
  return fetchAPI<CreateWorldResponse>("/infinite/worlds", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// List world templates
export async function getWorldTemplates(): Promise<WorldTemplate[]> {
  return fetchAPI<WorldTemplate[]>("/infinite/templates");
}

// Get template details
export async function getWorldTemplate(slug: string): Promise<WorldTemplate> {
  return fetchAPI<WorldTemplate>(`/infinite/templates/${slug}`);
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

// Influence leaderboard entry (more detailed than regular leaderboard)
export interface InfluenceLeaderboardEntry {
  rank: number;
  player_id: string;
  display_name?: string;
  trailblazer_score: number;
  tier: number;
  title: string;
  entities_created_count: number;
  governance_points: number;
  is_world_creator: boolean;
}

// Get influence leaderboard for a world
export async function getInfluenceLeaderboard(worldId: string): Promise<InfluenceLeaderboardEntry[]> {
  return fetchAPI<InfluenceLeaderboardEntry[]>(`/infinite/worlds/${worldId}/influence-leaderboard`);
}

// Get infinite world campfire (character selection)
export async function getInfiniteCampfire(worldId: string): Promise<InfiniteCampfireResponse> {
  return fetchAPI<InfiniteCampfireResponse>(`/infinite/worlds/${worldId}/campfire`);
}

// Create custom character at campfire
export interface CreateCharacterRequest {
  concept: string;  // e.g., "a scarred mercenary seeking redemption"
  hints?: {
    gender?: string;
    species?: string;
    occupation?: string;
  };
  player_id?: string;
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

// Get character creation options (allowed species, occupations, etc.)
export interface CharacterOptions {
  world_id: string;
  world_name: string;
  species: string[];
  occupations: string[];
  banned_concepts: string[];
}

export async function getCampfireOptions(worldId: string): Promise<CharacterOptions> {
  return fetchAPI<CharacterOptions>(`/infinite/worlds/${worldId}/campfire/options`);
}

// Iterative (conversational) character creation
export interface IterativeCreateRequest {
  message: string;
  session_id: string | null;
  player_id?: string;
}

export interface CharacterPreview {
  name: string | null;
  species: string | null;
  gender: string | null;
  occupation: string | null;
  backstory_summary: string | null;
  physical_description: string | null;
  personality_traits: string[];
  voice: string | null;
}

export interface IterativeCreateResponse {
  session_id: string;
  phase: "concept" | "appearance" | "personality" | "confirmation";
  ai_message: string;
  character_preview: CharacterPreview;
  done: boolean;
  entity_id: string | null;
  suggested_responses: string[];
}

export async function createCharacterIterative(
  worldId: string,
  request: IterativeCreateRequest
): Promise<IterativeCreateResponse> {
  return fetchAPI<IterativeCreateResponse>(
    `/infinite/worlds/${worldId}/campfire/create-iterative`,
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
    body: JSON.stringify({ action: accepted ? "accept" : "reject" }),
  });
}

// ============ CONTENT SETTINGS API ============

// Trigger types that can be blocked
export type ContentTrigger =
  | "sexual_violence"
  | "gore_torture"
  | "self_harm"
  | "child_harm"
  | "animal_harm"
  | "body_horror"
  | "addiction"
  | "infidelity"
  | "love_triangles";

export interface TriggerOption {
  id: ContentTrigger;
  label: string;
  description: string;
}

export interface PlayerContentSettings {
  spicy_level: number; // 1-5
  blocked_triggers: ContentTrigger[];
  sensitive_content_shield: boolean;
}

export interface DiscoveredDesire {
  dimension: string;
  label: string;
  confidence: number; // 0-1
}

export interface DiscoveredDesiresResponse {
  desires: DiscoveredDesire[];
  discovery_count: number;
}

// Get available trigger types
export async function getContentTriggers(): Promise<TriggerOption[]> {
  return fetchAPI<TriggerOption[]>("/infinite/content-triggers");
}

// Get player's content settings
export async function getPlayerContentSettings(playerId: string): Promise<PlayerContentSettings> {
  return fetchAPI<PlayerContentSettings>(`/infinite/player/${playerId}/content-settings`);
}

// Update player's content settings
export async function updatePlayerContentSettings(
  playerId: string,
  settings: Partial<PlayerContentSettings>
): Promise<PlayerContentSettings> {
  return fetchAPI<PlayerContentSettings>(`/infinite/player/${playerId}/content-settings`, {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

// Get player's discovered desires (read-only)
export async function getPlayerDesires(playerId: string): Promise<DiscoveredDesiresResponse> {
  return fetchAPI<DiscoveredDesiresResponse>(`/infinite/player/${playerId}/desires`);
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

// Consequence system (bounties, infractions, deaths) removed - backend handles via doAction

// ============ FRIENDS API ============

export interface Friend {
  friend_id: string;
  name: string;
  level?: number;
  is_online: boolean;
  last_seen_at?: string;
  friendship_since: string;
}

export interface FriendRequest {
  request_id: string;
  player_id: string;
  player_name: string;
  requested_at: string;
}

export interface FriendListResponse {
  friends: Friend[];
  count: number;
}

export interface PendingRequestsResponse {
  requests: FriendRequest[];
  count: number;
}

export interface FriendRequestResponse {
  success: boolean;
  message: string;
  request_id?: string;
  friendship_id?: string;
}

export interface BlockedPlayer {
  player_id: string;
  player_name?: string;
  blocked_at: string;
  reason?: string;
}

export interface BlockedListResponse {
  blocked: BlockedPlayer[];
  count: number;
}

// Get friend list with online status
export async function getFriends(): Promise<FriendListResponse> {
  return fetchAPI<FriendListResponse>("/friends");
}

// Get incoming friend requests
export async function getIncomingRequests(): Promise<PendingRequestsResponse> {
  return fetchAPI<PendingRequestsResponse>("/friends/requests/incoming");
}

// Get outgoing friend requests
export async function getOutgoingRequests(): Promise<PendingRequestsResponse> {
  return fetchAPI<PendingRequestsResponse>("/friends/requests/outgoing");
}

// Send friend request
export async function sendFriendRequest(targetPlayerId: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>(`/friends/request/${targetPlayerId}`, {
    method: "POST",
  });
}

// Accept friend request
export async function acceptFriendRequest(requestId: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>(`/friends/accept/${requestId}`, {
    method: "POST",
  });
}

// Decline friend request
export async function declineFriendRequest(requestId: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>(`/friends/decline/${requestId}`, {
    method: "POST",
  });
}

// Cancel outgoing friend request
export async function cancelFriendRequest(requestId: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>(`/friends/cancel/${requestId}`, {
    method: "DELETE",
  });
}

// Remove friend
export async function removeFriend(friendPlayerId: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>(`/friends/${friendPlayerId}`, {
    method: "DELETE",
  });
}

// Block player
export async function blockPlayer(playerId: string, reason?: string): Promise<FriendRequestResponse> {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return fetchAPI<FriendRequestResponse>(`/friends/block/${playerId}${params}`, {
    method: "POST",
  });
}

// Unblock player
export async function unblockPlayer(playerId: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>(`/friends/block/${playerId}`, {
    method: "DELETE",
  });
}

// Get blocked players
export async function getBlockedPlayers(): Promise<BlockedListResponse> {
  return fetchAPI<BlockedListResponse>("/friends/blocked");
}

// ============ DIRECT MESSAGING API ============

export interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  other_player_id: string;
  other_player_name: string;
  last_message_preview?: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  count: number;
}

export interface MessageHistoryResponse {
  messages: DirectMessage[];
  count: number;
  has_more: boolean;
}

export interface SendMessageResponse {
  success: boolean;
  message_id?: string;
  conversation_id?: string;
  error?: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Get conversation list
export async function getConversations(limit = 20, offset = 0): Promise<ConversationListResponse> {
  return fetchAPI<ConversationListResponse>(`/dm/conversations?limit=${limit}&offset=${offset}`);
}

// Get messages in a conversation
export async function getMessages(
  conversationId: string,
  limit = 50,
  beforeId?: string
): Promise<MessageHistoryResponse> {
  const params = beforeId ? `?limit=${limit}&before_id=${beforeId}` : `?limit=${limit}`;
  return fetchAPI<MessageHistoryResponse>(`/dm/messages/${conversationId}${params}`);
}

// Send direct message
export async function sendDirectMessage(
  targetPlayerId: string,
  content: string
): Promise<SendMessageResponse> {
  return fetchAPI<SendMessageResponse>(`/dm/send/${targetPlayerId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// Mark conversation as read
export async function markConversationRead(conversationId: string): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/dm/messages/${conversationId}/read`, {
    method: "POST",
  });
}

// Get total unread count
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return fetchAPI<UnreadCountResponse>("/dm/unread");
}

// ============ ONLINE STATUS API ============

export interface OnlineStats {
  websocket_connections: number;
  total_players: number;
}

export async function getOnlineStats(): Promise<OnlineStats> {
  return fetchAPI<OnlineStats>("/realtime/stats/online");
}

// ============ CHAT API ============

export type LandKey = "fantasy" | "scifi" | "contemporary" | "historical" | "horror" | "adults_only";

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_realm?: string;
  sender_land?: string;
  message: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  count: number;
}

export interface ChatSubscriptions {
  subscriptions: string[];
  current_land?: string;
}

// Get zone chat history
export async function getZoneChat(zoneId: string, limit = 50): Promise<ChatHistoryResponse> {
  return fetchAPI<ChatHistoryResponse>(`/realtime/zones/${zoneId}/chat?limit=${limit}`);
}

// Get land chat history
export async function getLandChat(landKey: LandKey, limit = 50): Promise<ChatHistoryResponse> {
  return fetchAPI<ChatHistoryResponse>(`/realtime/chat/land/${landKey}?limit=${limit}`);
}

// Get global chat history
export async function getGlobalChat(limit = 50): Promise<ChatHistoryResponse> {
  return fetchAPI<ChatHistoryResponse>(`/realtime/chat/global?limit=${limit}`);
}

// Get player's chat subscriptions
export async function getChatSubscriptions(playerId: string): Promise<ChatSubscriptions> {
  return fetchAPI<ChatSubscriptions>(`/realtime/chat/subscriptions/${playerId}`);
}

// Get players in a zone
export interface ZonePlayer {
  player_id: string;
  name: string;
  level?: number;
}

export async function getZonePlayers(zoneId: string): Promise<ZonePlayer[]> {
  const res = await fetchAPI<{ players: ZonePlayer[]; count: number }>(`/realtime/zones/${zoneId}/players`);
  return res.players;
}

// ============ MESSAGE UPVOTE API ============

export interface UpvoteResponse {
  success: boolean;
  upvotes: number;
}

export async function upvoteLocationMessage(
  entityId: string,
  messageId: string
): Promise<UpvoteResponse> {
  return fetchAPI<UpvoteResponse>(`/infinite/entities/${entityId}/messages/${messageId}/upvote`, {
    method: "POST",
  });
}

// ============ INVENTORY API ============

export interface ItemStats {
  damage?: number;
  defense?: number;
  magic?: number;
  speed?: number;
}

export interface Item {
  id: string;
  name: string;
  slug: string;
  description: string;
  item_type: "weapon" | "armor" | "accessory" | "consumable" | "quest" | "material" | "misc";
  tier: "common" | "uncommon" | "rare" | "epic" | "legendary";
  slot?: "weapon" | "offhand" | "head" | "chest" | "legs" | "feet" | "hands" | "accessory";
  stats: ItemStats;
  effects: Record<string, unknown>;
  weight: number;
  level_required: number;
  base_value: number;
  can_sell: boolean;
  can_trade: boolean;
  max_stack: number;
  icon_url: string | null;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  item: Item;
  quantity: number;
  acquired_from: string | null;
  is_equipped: boolean;
  equipped_slot: string | null;
}

export interface Encumbrance {
  current_load: number;
  total_capacity: number;
  load_percentage: number;
  encumbrance_level: "normal" | "burdened" | "encumbered" | "overloaded";
  can_pickup: boolean;
  base_capacity: number;
  strength_bonus: number;
  equipment_bonus: number;
  party_pool_bonus: number;
}

export interface InventoryResponse {
  items: InventoryItem[];
  equipped: Record<string, InventoryItem>;
  total_items: number;
  total_value: number;
  encumbrance?: Encumbrance;
}

// Get player's inventory
export async function getInventory(): Promise<InventoryResponse> {
  return fetchAPI<InventoryResponse>("/characters/inventory");
}

// Get current character's profile
export async function getCharacterProfile(): Promise<CharacterProfile> {
  return fetchAPI<CharacterProfile>("/characters/me/profile");
}

// ============ CHARACTER ROSTER API ============

export interface RosterCharacter {
  id: string;
  entity_id: string;
  character_name: string;
  occupation: string | null;
  world_id: string;
  world_name: string;
  status: "active" | "dead" | "retired";
  current_hp: number | null;
  max_hp: number | null;
  died_at: string | null;
  death_cause: string | null;
  retired_at: string | null;
  final_stats: FinalStats | null;
  created_at: string;
}

export interface FinalStats {
  level: number;
  playtime_minutes: number;
  quests_completed: number;
  gold: number;
}

export interface CharacterSlots {
  used_slots: number;
  max_slots: number;
  available_slots: number;
  is_plus: boolean;
}

export interface GraveyardEntry {
  id: string;
  character_name: string;
  occupation: string | null;
  world_name: string;
  status: "dead" | "retired";
  died_at: string | null;
  death_cause: string | null;
  retired_at: string | null;
  final_stats: FinalStats | null;
}

// Get player's character roster
export async function getCharacterRoster(): Promise<RosterCharacter[]> {
  return fetchAPI<RosterCharacter[]>("/characters/roster");
}

// Get character slot usage
export async function getCharacterSlots(): Promise<CharacterSlots> {
  return fetchAPI<CharacterSlots>("/characters/roster/slots");
}

// Retire a character
export async function retireCharacter(characterId: string): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>(`/characters/roster/${characterId}/retire`, {
    method: "POST",
  });
}

// Get graveyard (dead/retired characters)
export async function getCharacterGraveyard(): Promise<GraveyardEntry[]> {
  return fetchAPI<GraveyardEntry[]>("/characters/roster/graveyard");
}

// ============ HISCORES API ============

export type HiScoreCategory = "trailblazers" | "warriors" | "outlaws" | "tycoons";
export type HiScoreTimeWindow = "all_time" | "weekly" | "monthly";

export interface HiScoreEntry {
  rank: number;
  player_id: string;
  display_name?: string;
  score: number;
  // Category-specific fields
  entities_created?: number;
  footprints?: number;
  passive_income?: number;
  total_kills?: number;
  kills_by_tier?: { common: number; named: number; legendary: number };
  bounties_claimed?: number;
  active_bounty?: number;
  lifetime_bounty?: number;
  infractions?: number;
  currency_wealth?: number;
  inventory_value?: number;
}

export interface HiScoreResponse {
  category: string;
  scope: string;
  world_id: string | null;
  time_window: string;
  entries: HiScoreEntry[];
  total_count: number;
}

export interface PlayerHiScoreRankings {
  player_id: string;
  world_id?: string;
  rankings: Record<string, { rank: number | null; score: number }>;
}

// Get global hiscores by category
export async function getGlobalHiScores(
  category: HiScoreCategory,
  timeWindow: HiScoreTimeWindow = "all_time",
  limit = 50
): Promise<HiScoreResponse> {
  return fetchAPI<HiScoreResponse>(
    `/infinite/hiscores/global/${category}?time_window=${timeWindow}&limit=${limit}`
  );
}

// Get realm hiscores by category
export async function getRealmHiScores(
  worldId: string,
  category: HiScoreCategory,
  timeWindow: HiScoreTimeWindow = "all_time",
  limit = 50
): Promise<HiScoreResponse> {
  return fetchAPI<HiScoreResponse>(
    `/infinite/worlds/${worldId}/hiscores/${category}?time_window=${timeWindow}&limit=${limit}`
  );
}

// Get player's global rankings
export async function getPlayerGlobalHiScores(playerId: string): Promise<PlayerHiScoreRankings> {
  return fetchAPI<PlayerHiScoreRankings>(`/infinite/hiscores/global/player/${playerId}`);
}

// Get player's realm rankings
export async function getPlayerRealmHiScores(
  worldId: string,
  playerId: string
): Promise<PlayerHiScoreRankings> {
  return fetchAPI<PlayerHiScoreRankings>(
    `/infinite/worlds/${worldId}/hiscores/player/${playerId}`
  );
}

// ============ REGIONAL ECONOMY API ============

export interface Region {
  id: string;
  name: string;
  description: string;
  currency_name: string;
  currency_symbol: string;
}

export interface RegionalWallet {
  region_id: string;
  region_name: string;
  currency_name: string;
  currency_symbol: string;
  balance: number;
}

export interface ExchangeQuote {
  from_region: string;
  to_region: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  fee_percent: number;
  expires_at: string;
}

export interface ExchangeResult {
  success: boolean;
  from_region: string;
  to_region: string;
  from_amount: number;
  to_amount: number;
  new_from_balance: number;
  new_to_balance: number;
}

export interface RegionalStanding {
  region_id: string;
  region_name: string;
  reputation: number;
  reputation_tier: string;
  title: string;
  standing?: string;
  citizenship?: boolean;
  exile?: boolean;
  bounty?: number;
}

export interface ExchangeRate {
  from_region: string;
  to_region: string;
  rate: number;
  fee_percent: number;
}

// Get regions in a world
export async function getWorldRegions(worldId: string): Promise<Region[]> {
  return fetchAPI<Region[]>(`/infinite/worlds/${worldId}/regions`);
}

// Get world time and weather
export async function getWorldTime(worldId: string, realmId?: string): Promise<WorldTimeResponse> {
  const params = realmId ? `?realm_id=${realmId}` : "";
  return fetchAPI<WorldTimeResponse>(`/infinite/worlds/${worldId}/time${params}`);
}

// ============ REALM MAP ============

export interface MapLocation {
  entity_id: string;
  name: string;
  x: number;
  y: number;
  is_current: boolean;
  is_discovered: boolean;
  is_safe_zone: boolean;
  is_hub: boolean;
  location_type?: string;
}

export interface MapConnection {
  from_id: string;
  to_id: string;
  relationship_type: string;
}

export interface RealmMapResponse {
  realm_id: string;
  realm_name: string;
  ascii_map: string;
  locations: MapLocation[];
  connections: MapConnection[];
  width: number;
  height: number;
}

// Get ASCII map of the realm
export async function getRealmMap(
  worldId: string,
  options?: {
    width?: number;
    height?: number;
    show_undiscovered?: boolean;
  }
): Promise<RealmMapResponse> {
  const params = new URLSearchParams();
  if (options?.width) params.set("width", String(options.width));
  if (options?.height) params.set("height", String(options.height));
  if (options?.show_undiscovered) params.set("show_undiscovered", "true");
  const query = params.toString();
  return fetchAPI<RealmMapResponse>(`/infinite/worlds/${worldId}/map${query ? `?${query}` : ""}`);
}

// Get player's regional wallets
export async function getPlayerCurrencies(
  worldId: string,
  playerId: string
): Promise<RegionalWallet[]> {
  return fetchAPI<RegionalWallet[]>(
    `/infinite/worlds/${worldId}/player/${playerId}/currencies`
  );
}

// Get exchange quote
export async function getExchangeQuote(
  worldId: string,
  playerId: string,
  fromRegion: string,
  toRegion: string,
  amount: number
): Promise<ExchangeQuote> {
  const params = new URLSearchParams({
    from_region: fromRegion,
    to_region: toRegion,
    amount: amount.toString(),
  });
  return fetchAPI<ExchangeQuote>(
    `/infinite/worlds/${worldId}/player/${playerId}/exchange-quote?${params}`
  );
}

// Execute currency exchange
export async function executeCurrencyExchange(
  worldId: string,
  playerId: string,
  fromRegion: string,
  toRegion: string,
  amount: number
): Promise<ExchangeResult> {
  return fetchAPI<ExchangeResult>(
    `/infinite/worlds/${worldId}/player/${playerId}/exchange`,
    {
      method: "POST",
      body: JSON.stringify({ from_region: fromRegion, to_region: toRegion, amount }),
    }
  );
}

// Get player's regional standings
export async function getRegionalStanding(
  worldId: string,
  playerId: string
): Promise<RegionalStanding[]> {
  return fetchAPI<RegionalStanding[]>(
    `/infinite/worlds/${worldId}/player/${playerId}/regional-standing`
  );
}

// Modify reputation in a region
export async function modifyRegionReputation(
  worldId: string,
  playerId: string,
  regionId: string,
  delta: number,
  reason?: string
): Promise<RegionalStanding> {
  return fetchAPI<RegionalStanding>(
    `/infinite/worlds/${worldId}/player/${playerId}/reputation/${regionId}`,
    {
      method: "POST",
      body: JSON.stringify({ delta, reason }),
    }
  );
}

// Get all exchange rates for a world
export async function getExchangeRates(worldId: string): Promise<ExchangeRate[]> {
  return fetchAPI<ExchangeRate[]>(`/infinite/worlds/${worldId}/exchange-rates`);
}

// ============ MAGIC LINK AUTH API ============

export interface MagicLinkRequest {
  email: string;
  redirect_url?: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
}

export interface AuthUser {
  logged_in: boolean;
  player_id?: string;
  email?: string;
  display_name?: string;
  is_guest: boolean;
}

// Session context to preserve across auth
export interface SessionContext {
  world_id?: string;
  entity_id?: string;
  character_name?: string;
}

// Request magic link email
export async function requestMagicLink(
  email: string,
  redirectUrl?: string,
  sessionContext?: SessionContext
): Promise<MagicLinkResponse> {
  return fetchAPI<MagicLinkResponse>("/auth/request", {
    method: "POST",
    body: JSON.stringify({
      email,
      redirect_url: redirectUrl,
      // Pass session context so backend can link guest session to new account
      ...(sessionContext?.world_id && {
        pending_world_id: sessionContext.world_id,
        pending_entity_id: sessionContext.entity_id,
        pending_character_name: sessionContext.character_name,
      }),
    }),
  });
}

// Verify magic link token (usually called via redirect, but available for SPA flow)
export async function verifyMagicLink(token: string): Promise<{ success: boolean; redirect_url?: string }> {
  return fetchAPI<{ success: boolean; redirect_url?: string }>(`/auth/verify?token=${token}`);
}

// Get current authenticated user
export async function getCurrentUser(): Promise<AuthUser> {
  return fetchAPI<AuthUser>("/auth/me");
}

// Logout
export async function logout(): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}

// ============ SMS AUTH API ============

export interface SmsOtpRequest {
  phone: string; // E.164 format: +15551234567
}

export interface SmsOtpResponse {
  success: boolean;
  message: string;
  expires_in_minutes: number;
}

export interface SmsVerifyRequest {
  phone: string;
  code: string;
}

export interface SmsVerifyResponse {
  success: boolean;
  phone_verified: boolean;
  account_linked: boolean;
  user_id?: string;
  email?: string;
  session_token?: string;
  message?: string;
}

export interface SmsLinkResponse {
  success: boolean;
  message: string;
}

// Request SMS OTP code
export async function requestSmsOtp(phone: string): Promise<SmsOtpResponse> {
  return fetchAPI<SmsOtpResponse>("/sms/auth/request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

// Verify SMS OTP code
export async function verifySmsOtp(phone: string, code: string): Promise<SmsVerifyResponse> {
  return fetchAPI<SmsVerifyResponse>("/sms/auth/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

// Link verified phone to current account (requires session cookie)
export async function linkPhone(phone: string, userId: string): Promise<SmsLinkResponse> {
  return fetchAPI<SmsLinkResponse>("/sms/auth/link", {
    method: "POST",
    body: JSON.stringify({ phone, user_id: userId }),
  });
}

// Phone number formatting helpers
export function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 1) return digits ? `+${digits}` : "";
  if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
  if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

export function toE164(value: string): string {
  const digits = value.replace(/\D/g, "");
  return `+${digits}`;
}

// ============ INFINITE SESSION API ============

export interface InfiniteSessionRequest {
  world_id: string;
  entity_id: string;
}

export interface InfiniteSessionResponse {
  session: SessionInfo;
  message: string;
  opening_narrative?: string;
}

// Start session with infinite world entity (preferred over /session/start for infinite worlds)
export async function startInfiniteSession(request: InfiniteSessionRequest): Promise<InfiniteSessionResponse> {
  return fetchAPI<InfiniteSessionResponse>("/infinite/session/start", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Claim an existing character at campfire
export interface ClaimCharacterResponse {
  status: "claimed";
  character_id: string;
  character_name: string;
  player_id: string;
  world_id: string;
}

export async function claimCampfireCharacter(
  worldId: string,
  characterId: string,
  playerId?: string
): Promise<ClaimCharacterResponse> {
  const params = playerId ? `?player_id=${playerId}` : "";
  return fetchAPI<ClaimCharacterResponse>(
    `/infinite/worlds/${worldId}/campfire/claim/${characterId}${params}`,
    { method: "POST" }
  );
}

// ============ SESSION RECOVERY API ============

export interface RecoverySearchRequest {
  description: string;
  limit?: number;
}

export interface RecoveryMatch {
  session_id: string;
  character_name: string;
  world_name: string;
  race?: string;
  occupation?: string;
  last_location?: string;
  created_at: string;
  last_active: string;
  action_count: number;
  match_score: number;
  match_reason: string;
}

export interface RecoverySearchResponse {
  matches: RecoveryMatch[];
  query: string;
}

export async function searchRecoverableSessions(request: RecoverySearchRequest): Promise<RecoverySearchResponse> {
  return fetchAPI<RecoverySearchResponse>("/recover/search", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export interface RecoveryClaimRequest {
  session_id: string;
  email: string;
}

export interface RecoveryClaimResponse {
  success: boolean;
  message: string;
}

export async function claimRecoveredSession(request: RecoveryClaimRequest): Promise<RecoveryClaimResponse> {
  return fetchAPI<RecoveryClaimResponse>("/recover/claim", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export interface EmailLookupResponse {
  found: boolean;
  session_id?: string;
  character_name?: string;
  world_name?: string;
}

export async function lookupSessionByEmail(email: string): Promise<EmailLookupResponse> {
  return fetchAPI<EmailLookupResponse>(`/recover/by-email/${encodeURIComponent(email)}`);
}

// ============ SKILLS API ============

export type SkillCategory = "combat" | "magical" | "gathering" | "crafting" | "social" | "exploration" | "knowledge" | "companion" | "locomotion" | "professional";

export interface PlayerSkill {
  skill_name: string;
  display_name: string;
  category: SkillCategory;
  level: number;
  xp: number;
  xp_to_next: number;
  progress_percent?: number;
  unlocked_abilities: string[];  // Ability names from backend
}

export interface SkillsResponse {
  player_id: string;
  world_id: string;
  total_level: number;
  skills_by_category: Record<SkillCategory, PlayerSkill[]>;
  top_skills: PlayerSkill[];
}

// Get player's skills
export async function getSkills(worldId: string, playerId: string): Promise<SkillsResponse> {
  return fetchAPI<SkillsResponse>(`/infinite/worlds/${worldId}/player/${playerId}/skills`);
}

// Get frontier status for current location
export async function getFrontierStatus(worldId: string, playerId: string): Promise<FrontierStatus> {
  return fetchAPI<FrontierStatus>(`/infinite/worlds/${worldId}/player/${playerId}/frontier`);
}

// ============ PLAYER PROFILE API ============

export interface PlayerProfile {
  player_id: string;
  username?: string;
  display_name?: string;
}

export interface UsernameResponse {
  username: string;
}

export interface PlayerSearchResult {
  player_id: string;
  username: string;
  display_name?: string;
}

// Get current player's profile
export async function getPlayerProfile(): Promise<PlayerProfile> {
  return fetchAPI<PlayerProfile>("/players/me");
}

// Set username for current player
export async function setUsername(username: string): Promise<UsernameResponse> {
  return fetchAPI<UsernameResponse>("/players/me/username", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

// Get current player's username
export async function getUsername(): Promise<UsernameResponse | null> {
  try {
    return await fetchAPI<UsernameResponse>("/players/me/username");
  } catch {
    return null;
  }
}

// Search players by username prefix
export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  const res = await fetchAPI<{ results: PlayerSearchResult[] }>(
    `/players/search?q=${encodeURIComponent(query)}`
  );
  return res.results;
}

// Get player profile by username
export async function getPlayerByUsername(username: string): Promise<PlayerProfile> {
  return fetchAPI<PlayerProfile>(`/players/by-username/${encodeURIComponent(username)}`);
}

// Send friend request by username
export async function sendFriendRequestByUsername(username: string): Promise<FriendRequestResponse> {
  return fetchAPI<FriendRequestResponse>("/friends/request", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

// ============ INVITE/REFERRAL API ============

export interface InviteLinkResponse {
  invite_code: string;
  invite_url: string;
  realm_name?: string;
  share_text: string;
  share_title: string;
  total_referrals: number;
}

export interface InviteStatsResponse {
  total_referrals: number;
  total_invite_codes: number;
}

export interface SendInviteResponse {
  success: boolean;
  message: string;
}

// Get/generate invite link
export async function getInviteLink(realmId?: string): Promise<InviteLinkResponse> {
  const params = realmId ? `?realm_id=${realmId}` : "";
  return fetchAPI<InviteLinkResponse>(`/invites/link${params}`);
}

// Send email invite
export async function sendEmailInvite(
  email: string,
  realmId?: string,
  customMessage?: string
): Promise<SendInviteResponse> {
  return fetchAPI<SendInviteResponse>("/invites/send/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      ...(realmId && { realm_id: realmId }),
      ...(customMessage && { custom_message: customMessage }),
    }),
  });
}

// Send SMS invite
export async function sendSmsInvite(phone: string, realmId?: string): Promise<SendInviteResponse> {
  return fetchAPI<SendInviteResponse>("/invites/send/sms", {
    method: "POST",
    body: JSON.stringify({
      phone,
      ...(realmId && { realm_id: realmId }),
    }),
  });
}

// Get referral stats
export async function getInviteStats(): Promise<InviteStatsResponse> {
  return fetchAPI<InviteStatsResponse>("/invites/stats");
}

// ============ LORETRACKER API ============

export type LoreCategory = "items" | "enemies" | "skills" | "npcs" | "locations" | "realms" | "shadows";

export interface LoreCategoryCounts {
  discovered: number;
  total: number;
}

export interface LoreSummary {
  land_key: string;
  land_display_name: string;
  loretracker_name: string;
  categories: Record<LoreCategory, LoreCategoryCounts>;
  total_kills: number;
  completion_percent: number;
  has_received_starter: boolean;
}

export interface LoreEntry {
  id: string;
  display_name: string;
  category_hint: string | null;
  tier: string | null;
  description: string | null;
  is_discovered: boolean;
  discovered_at: string | null;
  discovery_source: string | null;
  // Enemy-specific
  kill_count?: number;
  first_killed_at?: string;
  last_killed_at?: string;
}

export interface LoreHierarchySubcategory {
  name: string;
  discovered: number;
  total: number;
}

export interface LoreHierarchyCategory {
  name: string;
  discovered: number;
  total: number;
  subcategories: LoreHierarchySubcategory[];
}

export interface LoreItemsHierarchy {
  land_key: string;
  categories: LoreHierarchyCategory[];
}

export interface LoreEnemiesHierarchy {
  land_key: string;
  tiers: LoreHierarchyCategory[];
}

export interface LoreSkillsHierarchy {
  land_key: string;
  categories: LoreHierarchyCategory[];
}

export interface LoreNpcsHierarchy {
  land_key: string;
  realms: LoreHierarchyCategory[];
}

export interface LoreLocationsHierarchy {
  land_key: string;
  realms: LoreHierarchyCategory[];
}

export interface LoreEntriesResponse {
  entries: LoreEntry[];
  total: number;
  offset: number;
  limit: number;
}

export interface LoreEntriesOptions {
  tier?: string;
  subcategory?: string;
  occupation?: string;
  location_type?: string;
  realm?: string;
  sort_by?: "tier" | "level" | "name" | "discovered";
  show_undiscovered?: boolean;
  limit?: number;
  offset?: number;
}

// Get lore summary for a land
export async function getLoreSummary(landKey: string): Promise<LoreSummary> {
  return fetchAPI<LoreSummary>(`/lore/${landKey}`);
}

// Get lore entries for a category
export async function getLoreEntries(
  landKey: string,
  category: LoreCategory,
  options?: LoreEntriesOptions
): Promise<LoreEntriesResponse> {
  const params = new URLSearchParams();
  if (options?.tier) params.set("tier", options.tier);
  if (options?.subcategory) params.set("subcategory", options.subcategory);
  if (options?.occupation) params.set("occupation", options.occupation);
  if (options?.location_type) params.set("location_type", options.location_type);
  if (options?.realm) params.set("realm", options.realm);
  if (options?.sort_by) params.set("sort_by", options.sort_by);
  if (options?.show_undiscovered !== undefined) params.set("show_undiscovered", String(options.show_undiscovered));
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));

  const query = params.toString();
  return fetchAPI<LoreEntriesResponse>(`/lore/${landKey}/${category}${query ? `?${query}` : ""}`);
}

// Get hierarchy for items
export async function getLoreItemsHierarchy(landKey: string): Promise<LoreItemsHierarchy> {
  return fetchAPI<LoreItemsHierarchy>(`/lore/${landKey}/items/hierarchy`);
}

// Get hierarchy for enemies
export async function getLoreEnemiesHierarchy(landKey: string): Promise<LoreEnemiesHierarchy> {
  return fetchAPI<LoreEnemiesHierarchy>(`/lore/${landKey}/enemies/hierarchy`);
}

// Get hierarchy for skills
export async function getLoreSkillsHierarchy(landKey: string): Promise<LoreSkillsHierarchy> {
  return fetchAPI<LoreSkillsHierarchy>(`/lore/${landKey}/skills/hierarchy`);
}

// Get hierarchy for NPCs
export async function getLoreNpcsHierarchy(landKey: string): Promise<LoreNpcsHierarchy> {
  return fetchAPI<LoreNpcsHierarchy>(`/lore/${landKey}/npcs/hierarchy`);
}

// Get hierarchy for locations
export async function getLoreLocationsHierarchy(landKey: string): Promise<LoreLocationsHierarchy> {
  return fetchAPI<LoreLocationsHierarchy>(`/lore/${landKey}/locations/hierarchy`);
}

// Get single lore entry detail
export async function getLoreEntryDetail(
  landKey: string,
  category: LoreCategory,
  entryId: string
): Promise<LoreEntry> {
  return fetchAPI<LoreEntry>(`/lore/${landKey}/${category}/${entryId}`);
}

// ============ PARTY API ============

export type PartyRole = "tank" | "healer" | "dps" | "support";
export type BehaviorMode = "ai_controlled" | "player_orders" | "defensive";
export type LoyaltyLevel = "devoted" | "loyal" | "neutral" | "suspicious" | "leaving";

export interface PartyNpcMember {
  entity_id: string;
  name: string;
  role: PartyRole;
  hp: number;
  max_hp: number;
  hp_percent: number;
  loyalty: number;
  morale: number;
  behavior_mode: BehaviorMode;
  is_alive: boolean;
  core_values: string[];
  recruited_at: string;
}

export interface PartyPlayerMember {
  player_id: string;
  name: string;
  hp: number;
  max_hp: number;
  hp_percent: number;
  level?: number;
  is_online: boolean;
  is_leader: boolean;
}

export interface PartyNpcDetail {
  entity_id: string;
  name: string;
  loyalty: number;
  morale: number;
  identity: {
    backstory: string;
    personality: string;
    motivations: string;
    appearance: string;
    speaking_style: string;
  };
  standing_orders: StandingOrders;
  combat_role: PartyRole;
  abilities: string[];
  relationship_score: number;
  relationship_label: LoyaltyLevel;
  time_in_party_hours: number;
  knowledge_count: number;
  has_unshared_knowledge: boolean;
  recent_loyalty_events: LoyaltyEvent[];
}

export interface StandingOrders {
  protect_player_ids?: string[];
  focus_target_type?: string;
  avoid_target_type?: string;
  retreat_threshold?: number;
  use_abilities?: string[];
}

export interface LoyaltyEvent {
  event_type: "loyalty" | "morale";
  delta: number;
  reason: string;
  occurred_at?: string;
}

export interface Party {
  id: string;
  name: string;
  leader_id: string;
  member_count: number;
  max_size: number;
  players: PartyPlayerMember[];
  npcs: PartyNpcMember[];
  created_at: string;
}

export interface PartyListResponse {
  party: Party | null;
  has_party: boolean;
}

export interface PartyKnowledge {
  id: string;
  content: string;
  source_entity_id: string;
  source_name: string;
  shared_at: string;
  trust_level_required: number;
  accuracy: number;
}

// Get current player's party
export async function getParty(): Promise<PartyListResponse> {
  return fetchAPI<PartyListResponse>("/party");
}

// Get party NPC members (brief view)
export async function getPartyNpcs(): Promise<PartyNpcMember[]> {
  return fetchAPI<PartyNpcMember[]>("/party/npcs");
}

// Get NPC detail (rich view)
export async function getPartyNpcDetail(entityId: string): Promise<PartyNpcDetail> {
  return fetchAPI<PartyNpcDetail>(`/party/npcs/${entityId}/detail`);
}

// Set NPC behavior mode
export async function setNpcBehavior(
  entityId: string,
  behaviorMode: BehaviorMode
): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/party/npcs/${entityId}/behavior`, {
    method: "PATCH",
    body: JSON.stringify({ behavior_mode: behaviorMode }),
  });
}

// Set NPC standing orders
export async function setNpcOrders(
  entityId: string,
  orders: StandingOrders
): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/party/npcs/${entityId}/orders`, {
    method: "PATCH",
    body: JSON.stringify(orders),
  });
}

// Dismiss NPC from party
export async function dismissNpc(entityId: string): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>(`/party/npcs/${entityId}`, {
    method: "DELETE",
  });
}

// Get party's shared knowledge
export async function getPartyKnowledge(partyId: string): Promise<PartyKnowledge[]> {
  return fetchAPI<PartyKnowledge[]>(`/party/${partyId}/knowledge`);
}

// Trigger party rest (knowledge sharing + morale recovery)
export async function partyRest(partyId: string): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>(`/party/${partyId}/rest`, {
    method: "POST",
  });
}

// ============ RELATIONSHIPS API ============

export interface RelationshipMetrics {
  trust: number;
  respect: number;
  familiarity: number;
  debt_balance: number;
}

export interface RelationshipFlags {
  is_confidant: boolean;
  npc_owes_favor: boolean;
  player_owes_favor: boolean;
  betrayal_risk: boolean;
  will_share_secrets: boolean;
  price_modifier: number;
}

export interface MemorableMoment {
  event: string;
  description?: string;
  trust_impact: number;
  respect_impact: number;
  at?: string;
}

export interface Relationship {
  id: string;
  npc_id: string;
  npc_name?: string;
  npc_occupation?: string;
  relationship_type: string;
  disposition: "hostile" | "wary" | "neutral" | "friendly" | "loyal";
  metrics: RelationshipMetrics;
  flags: RelationshipFlags;
  memorable_moments: MemorableMoment[];
  interaction_count: number;
  last_interaction?: string;
}

export interface RelationshipSummary {
  total: number;
  friends: number;
  allies: number;
  confidants: number;
  rivals: number;
  enemies: number;
  mentors: number;
  npcs_owe_favors: number;
  player_owes_favors: number;
  betrayal_risks: number;
}

export interface RelationshipListResponse {
  relationships: Relationship[];
  summary: RelationshipSummary;
}

export interface RelationshipEvent {
  id: string;
  event_type: string;
  description?: string;
  trust_change: number;
  respect_change: number;
  familiarity_change: number;
  debt_change: number;
  occurred_at: string;
}

export interface RelationshipHistoryResponse {
  events: RelationshipEvent[];
}

export interface RelationshipMomentsResponse {
  moments: MemorableMoment[];
}

// Get all relationships in a world
export async function getRelationships(
  worldId: string,
  options?: {
    min_familiarity?: number;
    relationship_type?: string;
    limit?: number;
  }
): Promise<RelationshipListResponse> {
  const params = new URLSearchParams({ world_id: worldId });
  if (options?.min_familiarity !== undefined) params.set("min_familiarity", String(options.min_familiarity));
  if (options?.relationship_type) params.set("relationship_type", options.relationship_type);
  if (options?.limit) params.set("limit", String(options.limit));
  return fetchAPI<RelationshipListResponse>(`/relationships?${params}`);
}

// Get relationship with a specific NPC
export async function getRelationship(npcId: string): Promise<Relationship> {
  return fetchAPI<Relationship>(`/relationships/${npcId}`);
}

// Get relationship history with an NPC
export async function getRelationshipHistory(
  npcId: string,
  limit = 20
): Promise<RelationshipHistoryResponse> {
  return fetchAPI<RelationshipHistoryResponse>(`/relationships/${npcId}/history?limit=${limit}`);
}

// Get memorable moments with an NPC
export async function getRelationshipMoments(
  npcId: string,
  limit = 10
): Promise<RelationshipMomentsResponse> {
  return fetchAPI<RelationshipMomentsResponse>(`/relationships/${npcId}/moments?limit=${limit}`);
}

// Get NPCs by disposition
export type Disposition = "hostile" | "wary" | "neutral" | "friendly" | "loyal";

export async function getRelationshipsByDisposition(
  worldId: string,
  disposition: Disposition,
  limit = 20
): Promise<{ relationships: Relationship[] }> {
  return fetchAPI<{ relationships: Relationship[] }>(
    `/relationships/by-disposition/${disposition}?world_id=${worldId}&limit=${limit}`
  );
}

// ============ INTIMACY RELATIONSHIPS API ============

export type IntimacyStage =
  | "unaware"
  | "curious"
  | "flirting"
  | "tension"
  | "intimate"
  | "bonded"
  | "complicated";

export interface RelationshipIntimacy {
  guest_id: string;
  npc_id: string;
  npc_name: string;
  stage: IntimacyStage;
  attraction_level: number;
  chemistry_score: number;
  emotional_connection: number;
  physical_comfort: number;
  negotiated_dynamic?: string;
  scenes_completed: number;
  last_scene_at?: string;
  aftercare_debt: number;
  refractory_until?: string;
  emotional_cooldown_until?: string;
}

export type DynamicRole = "dominant" | "submissive" | "switch" | "undetermined";

export interface IntimacyPreferences {
  inferred_dynamic: DynamicRole;
  confidence_scores: Record<string, number>;
  total_intimate_actions: number;
  discovered_preferences: string[];
  hard_limits: string[];
}

export interface IntimacyStatusResponse {
  success: boolean;
  message: string;
  data?: RelationshipIntimacy | { stage: string; npc_id: string };
}

export interface IntimacyPreferencesResponse {
  success: boolean;
  message: string;
  data?: IntimacyPreferences;
}

// Get intimacy relationship status with an NPC
export async function getIntimacyRelationship(npcId: string): Promise<IntimacyStatusResponse> {
  return fetchAPI<IntimacyStatusResponse>(`/intimacy/relationship/${npcId}`);
}

// Get player's inferred intimacy preferences
export async function getIntimacyPreferences(): Promise<IntimacyPreferencesResponse> {
  return fetchAPI<IntimacyPreferencesResponse>("/intimacy/preferences");
}

// ============ PUBLIC WIKI API ============
// These endpoints return full definitions (no player auth required)

// Raw API response types
interface WikiLandRaw {
  key: string;
  display_name: string;
  gold_standard_name: string;
  gold_standard_symbol: string;
}

interface WikiLandsResponse {
  lands: WikiLandRaw[];
}

interface WikiLandSummaryRaw {
  land_key: string;
  land_display_name: string;
  items_count: number;
  enemies_count: number;
  skills_count: number;
  npcs_count: number;
  locations_count: number;
  realms_count: number;
  discovered_only: boolean;
}

// Frontend-friendly types
export interface WikiLand {
  key: string;
  display_name: string;
  description: string;
  loretracker_name: string;
  categories: Record<LoreCategory, { total: number }>;
}

export interface WikiEntry {
  entry_type: LoreCategory;
  entry_id: string;
  entry_key: string;
  display_name: string;
  tier: string | null;
  description: string | null;
  extra: Record<string, unknown>;
}

export interface WikiPagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface WikiEntriesResponse {
  land_key: string;
  category: LoreCategory;
  entries: WikiEntry[];
  pagination: WikiPagination;
}

export interface WikiLandSummary {
  land_key: string;
  land_display_name: string;
  loretracker_name: string;
  categories: Record<LoreCategory, { total: number }>;
}

// Land descriptions (not in API, so we provide them)
const LAND_DESCRIPTIONS: Record<string, string> = {
  fantasy: "Dragons, magic, and medieval kingdoms await. Forge your legend in a world of swords and sorcery.",
  scifi: "Traverse the stars, hack neural networks, and uncover the secrets of a cybernetic future.",
  contemporary: "Navigate the complexities of modern life, from urban mysteries to supernatural phenomena.",
  historical: "Relive pivotal moments in history, from ancient empires to revolutionary conflicts.",
  horror: "Face your deepest fears in a world where nightmares are real and survival is never guaranteed.",
  romance_historical: "Experience tales of passion in historical settings where hearts are won and destinies intertwine.",
  romance_modern: "Modern romance, drama, and relationships in contemporary settings.",
};

// Thematic loretracker names
const LORETRACKER_NAMES: Record<string, string> = {
  fantasy: "Tome of Lore",
  scifi: "DataBank",
  contemporary: "Field Journal",
  historical: "Chronicle",
  horror: "The Codex",
  romance_historical: "Social Register",
  romance_modern: "Little Black Book",
};

// Get all lands for wiki (with counts)
export async function getWikiLands(): Promise<WikiLand[]> {
  const response = await fetchAPI<WikiLandsResponse>("/wiki/lands");

  // Fetch summaries for each land to get counts
  const landsWithCounts = await Promise.all(
    response.lands.map(async (land) => {
      try {
        const summary = await fetchAPI<WikiLandSummaryRaw>(`/wiki/${land.key}`);
        return {
          key: land.key,
          display_name: land.display_name,
          description: LAND_DESCRIPTIONS[land.key] || "Explore this unique world.",
          loretracker_name: LORETRACKER_NAMES[land.key] || "Compendium",
          categories: {
            items: { total: summary.items_count },
            enemies: { total: summary.enemies_count },
            skills: { total: summary.skills_count },
            npcs: { total: summary.npcs_count },
            locations: { total: summary.locations_count },
            realms: { total: summary.realms_count },
            shadows: { total: 0 },
          },
        };
      } catch {
        // If summary fetch fails, return land with zero counts
        return {
          key: land.key,
          display_name: land.display_name,
          description: LAND_DESCRIPTIONS[land.key] || "Explore this unique world.",
          loretracker_name: LORETRACKER_NAMES[land.key] || "Compendium",
          categories: {
            items: { total: 0 },
            enemies: { total: 0 },
            skills: { total: 0 },
            npcs: { total: 0 },
            locations: { total: 0 },
            realms: { total: 0 },
            shadows: { total: 0 },
          },
        };
      }
    })
  );

  return landsWithCounts;
}

// Get land summary (content counts)
export async function getWikiLandSummary(landKey: string): Promise<WikiLandSummary> {
  const raw = await fetchAPI<WikiLandSummaryRaw>(`/wiki/${landKey}`);
  return {
    land_key: raw.land_key,
    land_display_name: raw.land_display_name,
    loretracker_name: LORETRACKER_NAMES[landKey] || "Compendium",
    categories: {
      items: { total: raw.items_count },
      enemies: { total: raw.enemies_count },
      skills: { total: raw.skills_count },
      npcs: { total: raw.npcs_count },
      locations: { total: raw.locations_count },
      realms: { total: raw.realms_count },
      shadows: { total: 0 },
    },
  };
}

// Get wiki entries for a category (public, full definitions)
export async function getWikiEntries(
  landKey: string,
  category: LoreCategory,
  options?: {
    tier?: string;
    category?: string;
    subcategory?: string;
    complexity?: string;
    realm?: string;
    occupation?: string;
    location_type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<WikiEntriesResponse> {
  const params = new URLSearchParams();
  if (options?.tier) params.set("tier", options.tier);
  if (options?.category) params.set("category", options.category);
  if (options?.subcategory) params.set("subcategory", options.subcategory);
  if (options?.complexity) params.set("complexity", options.complexity);
  if (options?.realm) params.set("realm", options.realm);
  if (options?.occupation) params.set("occupation", options.occupation);
  if (options?.location_type) params.set("location_type", options.location_type);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));

  const query = params.toString();
  return fetchAPI<WikiEntriesResponse>(`/wiki/${landKey}/${category}${query ? `?${query}` : ""}`);
}

// Get single wiki entry detail
export async function getWikiEntry(
  landKey: string,
  category: LoreCategory,
  entryId: string
): Promise<WikiEntry> {
  return fetchAPI<WikiEntry>(`/wiki/${landKey}/${category}/${entryId}`);
}

// Get all skills (global, not land-specific)
export async function getWikiSkills(options?: {
  category?: string;
  complexity?: string;
  limit?: number;
  offset?: number;
}): Promise<WikiEntriesResponse> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.complexity) params.set("complexity", options.complexity);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));

  const query = params.toString();
  return fetchAPI<WikiEntriesResponse>(`/wiki/skills${query ? `?${query}` : ""}`);
}

// Get single skill detail
export async function getWikiSkill(skillName: string): Promise<WikiEntry> {
  return fetchAPI<WikiEntry>(`/wiki/skills/${skillName}`);
}

// Get player's discovery status for merging with wiki (requires auth)
export async function getPlayerDiscoveries(
  landKey: string,
  category: LoreCategory
): Promise<{ discovered_ids: string[] }> {
  return fetchAPI<{ discovered_ids: string[] }>(`/lore/${landKey}/${category}/discovered`);
}

// ============ SHADOW SOLDIERS API ============

export type ShadowGrade = "normal" | "elite" | "knight" | "commander" | "marshal";

export interface ShadowSoldier {
  id: string;
  name: string;
  original_name: string;
  original_tier?: string;
  grade: ShadowGrade;
  level: number;
  xp: number;
  xp_to_next?: number;
  hp?: number;
  max_hp?: number;
  attack_power?: number;
  defense_power?: number;
  loyalty?: number;
  kills: number;
  deaths?: number;
  specialty_skill: string;
  is_in_squad: boolean;
  is_alive: boolean;
  is_working?: boolean;
  can_resurrect?: boolean;
  promotion_eligible?: boolean;
  next_grade?: ShadowGrade;
  minutes_worked?: number;
  hours_worked?: number;
  xp_pending?: number;
  resources_pending?: number;
  resource_type?: string;
  identity?: {
    original_species?: string;
    original_role?: string;
    appearance?: string;
    specialty_skill?: string;
    combat_style?: string;
  };
}

export interface ShadowSquadResponse {
  shadows: ShadowSoldier[];
  squad_size: number;
  max_size: number;
  total_power: number;
}

export interface ShadowRealmResponse {
  shadows: ShadowSoldier[];
  total_count: number;
  by_grade: Record<ShadowGrade, number>;
}

export interface ShadowOverviewResponse {
  squad: ShadowSoldier[];
  squad_size: number;
  max_squad_size: number;
  squad_total_power: number;
  working: ShadowSoldier[];
  working_count: number;
  total_xp_pending: number;
  total_resources_pending: Record<string, number>;
  idle_count: number;
  work_history_24h: Array<{
    shadow_id: string;
    shadow_name: string;
    skill: string;
    duration_minutes: number;
    xp_earned: number;
    resources_gathered: number;
    resource_type: string;
    ended_at: string;
  }>;
  xp_earned_24h: number;
  resources_earned_24h: Record<string, number>;
}

export interface ShadowExtractRequest {
  target_entity_id?: string;
  use_catalyst?: boolean;
}

export interface ShadowExtractResponse {
  success: boolean;
  shadow_id: string | null;
  shadow_name: string | null;
  grade: ShadowGrade | null;
  specialty_skill: string | null;
  chance_was: number;
  narrative: string;
}

export interface ShadowActionResponse {
  success: boolean;
  message: string;
}

export interface ShadowPromoteRequest {
  new_name?: string;
}

export interface ShadowPromoteResponse {
  success: boolean;
  from_grade: ShadowGrade;
  to_grade: ShadowGrade;
  new_name: string | null;
  narrative: string;
}

export interface ShadowArmyStats {
  total_shadows: number;
  squad_size: number;
  max_squad_size: number;
  total_levels: number;
  total_kills: number;
  highest_level: number;
  by_grade: Record<ShadowGrade, number>;
}

export interface ShadowWorkStatusResponse {
  working_shadows: ShadowSoldier[];
  total_working: number;
  total_xp_pending: number;
  total_resources_pending: Record<string, number>;
}

export interface ShadowWorkCollectResponse {
  shadows_collected: number;
  total_xp_earned: number;
  resources_gathered: Record<string, number>;
  narrative: string;
}

export interface LoreShadowsHierarchy {
  land_key: string;
  total_shadows: number;
  total_extractions: number;
  grades: LoreHierarchyCategory[];
}

// Shadow Soldiers endpoints - all require ?world_id= query param
export async function getShadowOverview(worldId: string): Promise<ShadowOverviewResponse> {
  return fetchAPI<ShadowOverviewResponse>(`/shadows/overview?world_id=${worldId}`);
}

export async function getShadowSquad(worldId: string): Promise<ShadowSquadResponse> {
  return fetchAPI<ShadowSquadResponse>(`/shadows/squad?world_id=${worldId}`);
}

export async function getShadowRealm(worldId: string): Promise<ShadowRealmResponse> {
  return fetchAPI<ShadowRealmResponse>(`/shadows/realm?world_id=${worldId}`);
}

export async function getShadowDetail(worldId: string, shadowId: string): Promise<ShadowSoldier> {
  return fetchAPI<ShadowSoldier>(`/shadows/${shadowId}?world_id=${worldId}`);
}

export async function extractShadow(worldId: string, request?: ShadowExtractRequest): Promise<ShadowExtractResponse> {
  return fetchAPI<ShadowExtractResponse>(`/shadows/extract?world_id=${worldId}`, {
    method: "POST",
    body: JSON.stringify(request || {}),
  });
}

export async function summonShadow(worldId: string, shadowId: string): Promise<ShadowActionResponse> {
  return fetchAPI<ShadowActionResponse>(`/shadows/${shadowId}/summon?world_id=${worldId}`, {
    method: "POST",
  });
}

export async function dismissShadow(worldId: string, shadowId: string): Promise<ShadowActionResponse> {
  return fetchAPI<ShadowActionResponse>(`/shadows/${shadowId}/dismiss?world_id=${worldId}`, {
    method: "POST",
  });
}

export async function promoteShadow(worldId: string, shadowId: string, request?: ShadowPromoteRequest): Promise<ShadowPromoteResponse> {
  return fetchAPI<ShadowPromoteResponse>(`/shadows/${shadowId}/promote?world_id=${worldId}`, {
    method: "POST",
    body: JSON.stringify(request || {}),
  });
}

export async function resurrectShadow(worldId: string, shadowId: string): Promise<ShadowActionResponse> {
  return fetchAPI<ShadowActionResponse>(`/shadows/${shadowId}/resurrect?world_id=${worldId}`, {
    method: "POST",
  });
}

export async function getShadowArmyStats(worldId: string): Promise<ShadowArmyStats> {
  return fetchAPI<ShadowArmyStats>(`/shadows/stats/army?world_id=${worldId}`);
}

export async function getShadowWorkStatus(worldId: string): Promise<ShadowWorkStatusResponse> {
  return fetchAPI<ShadowWorkStatusResponse>(`/shadows/work/status?world_id=${worldId}`);
}

export async function startShadowWork(worldId: string): Promise<{ success: boolean; shadows_working: number; message: string }> {
  return fetchAPI<{ success: boolean; shadows_working: number; message: string }>(`/shadows/work/start?world_id=${worldId}`, {
    method: "POST",
  });
}

export async function collectShadowWork(worldId: string): Promise<ShadowWorkCollectResponse> {
  return fetchAPI<ShadowWorkCollectResponse>(`/shadows/work/collect?world_id=${worldId}`, {
    method: "POST",
  });
}

// Lore hierarchy for shadows
export async function getLoreShadowsHierarchy(landKey: string): Promise<LoreShadowsHierarchy> {
  return fetchAPI<LoreShadowsHierarchy>(`/lore/${landKey}/shadows/hierarchy`);
}
