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
  content_settings?: ContentSettings;
  character_count?: number; // Number of active characters (for multi-char select flow)
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
  return fetchAPI<ChatHistoryResponse>(`/chat/land/${landKey}?limit=${limit}`);
}

// Get global chat history
export async function getGlobalChat(limit = 50): Promise<ChatHistoryResponse> {
  return fetchAPI<ChatHistoryResponse>(`/chat/global?limit=${limit}`);
}

// Get player's chat subscriptions
export async function getChatSubscriptions(playerId: string): Promise<ChatSubscriptions> {
  return fetchAPI<ChatSubscriptions>(`/chat/subscriptions/${playerId}`);
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

export interface InventoryResponse {
  items: InventoryItem[];
  equipped: Record<string, InventoryItem>;
  total_items: number;
  total_value: number;
}

// Get player's inventory
export async function getInventory(): Promise<InventoryResponse> {
  return fetchAPI<InventoryResponse>("/characters/inventory");
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

export type SkillCategory = "combat" | "gathering" | "crafting" | "social" | "exploration" | "knowledge" | "companion";

export interface SkillAbility {
  name: string;
  description: string;
  unlocked_at: number;
}

export interface PlayerSkill {
  skill_name: string;
  display_name: string;
  category: SkillCategory;
  level: number;
  xp: number;
  xp_to_next: number;
  unlocked_abilities: SkillAbility[];
}

export interface SkillsResponse {
  skills: PlayerSkill[];
  total_level: number;
  highest_skill: string | null;
}

// Get player's skills
export async function getSkills(worldId: string, playerId: string): Promise<SkillsResponse> {
  return fetchAPI<SkillsResponse>(`/infinite/worlds/${worldId}/player/${playerId}/skills`);
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
