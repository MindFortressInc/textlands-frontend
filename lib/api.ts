// World Forge API client

import type {
  Character,
  LookResponse,
  MoveResponse,
  TalkResponse,
  ActionResponse,
  CombatSession,
  CombatActionResponse,
} from "@/types/game";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
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

// Character endpoints
export async function createCharacter(data: {
  name: string;
  race: string;
  class: string;
}): Promise<Character> {
  return fetchAPI<Character>("/game/characters", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listCharacters(): Promise<Character[]> {
  return fetchAPI<Character[]>("/game/characters");
}

export async function getCharacter(characterId: string): Promise<Character> {
  return fetchAPI<Character>(`/game/characters/${characterId}`);
}

// Action endpoints
export async function look(characterId: string): Promise<LookResponse> {
  return fetchAPI<LookResponse>("/game/look", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId }),
  });
}

export async function move(
  characterId: string,
  destination: string
): Promise<MoveResponse> {
  return fetchAPI<MoveResponse>("/game/move", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, destination }),
  });
}

export async function talk(
  characterId: string,
  npcId: string,
  message?: string
): Promise<TalkResponse> {
  return fetchAPI<TalkResponse>(`/game/talk/${npcId}`, {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, message }),
  });
}

export async function performAction(
  characterId: string,
  action: string
): Promise<ActionResponse> {
  return fetchAPI<ActionResponse>("/game/action", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, action }),
  });
}

// Combat endpoints
export async function startCombat(
  characterId: string,
  enemyIds: string[]
): Promise<CombatSession> {
  return fetchAPI<CombatSession>("/game/combat/start", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, enemy_ids: enemyIds }),
  });
}

export async function getCombatState(sessionId: string): Promise<CombatSession> {
  return fetchAPI<CombatSession>(`/game/combat/${sessionId}`);
}

export async function combatAction(
  sessionId: string,
  characterId: string,
  action: "attack" | "defend" | "skill" | "item" | "flee",
  targetId?: string,
  skillName?: string
): Promise<CombatActionResponse> {
  return fetchAPI<CombatActionResponse>(`/game/combat/${sessionId}/action`, {
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
  return fetchAPI<CombatSession | null>(`/game/combat/active/${characterId}`);
}
