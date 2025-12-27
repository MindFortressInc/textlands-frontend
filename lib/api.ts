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

export async function getActiveScene(): Promise<IntimacyResponse> {
  return fetchAPI<IntimacyResponse>("/intimacy/active");
}

// ============ INFINITE WORLDS API ============

// List public worlds
export async function getInfiniteWorlds(): Promise<InfiniteWorld[]> {
  return fetchAPI<InfiniteWorld[]>("/infinite/worlds");
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

// Get global leaderboard
export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchAPI<LeaderboardEntry[]>("/infinite/leaderboard/global");
}

// Get infinite world campfire (character selection)
export async function getInfiniteCampfire(worldId: string): Promise<InfiniteCampfireResponse> {
  return fetchAPI<InfiniteCampfireResponse>(`/infinite/worlds/${worldId}/campfire`);
}
