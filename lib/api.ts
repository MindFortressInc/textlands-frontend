// TextLands API client

import type {
  CombatSession,
  DoActionResponse,
  IntimacyResponse,
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
