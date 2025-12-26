// Game types matching the World Forge backend API

// World selection types
export interface Genre {
  genre: string;
  count: number;
}

export interface World {
  id: string;
  name: string;
  genre: string;
  subgenre?: string;
  description: string;
}

export interface WorldsByGenre {
  genre: string;
  worlds: World[];
}

export interface WorldDetail {
  id: string;
  name: string;
  genre: string;
  subgenre?: string;
  description: string;
}

export interface CharacterOption {
  id: string;
  name: string;
  race: string;
  character_class: string;
  backstory: string;
}

export interface CampfireResponse {
  world: WorldDetail;
  intro_text: string;
  characters: CharacterOption[];
}

export interface DoActionResponse {
  narrative: string;
  state_changes: Record<string, unknown>;
  suggested_actions: string[];
  mood?: string;
  character?: Character;
  error?: string;
  action_id?: string;
  reasoning?: ReasoningInfo;
}

// Character types
export interface CharacterStats {
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  gold: number;
  xp: number;
  level: number;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  character_class: string;
  stats: CharacterStats;
  current_zone_id: string | null;
  inventory: string[];
  equipped: Record<string, string>;
}

export interface NPC {
  id: string;
  name: string;
  summary: string;
}

export interface Item {
  id: string;
  name: string;
  summary: string;
}

export interface LookResponse {
  description: string;
  zone_name: string;
  zone_id: string;
  npcs: NPC[];
  items: Item[];
  exits: string[];
  other_players: { id: string; name: string }[];
}

export interface MoveResponse {
  success: boolean;
  narrative: string;
  new_zone_id: string | null;
  new_zone_name: string | null;
}

export interface TalkResponse {
  npc_name: string;
  dialogue: string;
  options: string[];
  quest_offered: { hook: string; npc_id: string } | null;
}

// Invisible mechanics - shown optionally based on user preferences
export interface ReasoningInfo {
  action_type: string;
  outcome: "success" | "exceptional success" | "failure" | "significant setback";
  your_strengths: string[];
  challenges: string[];
  success_chance: string;
  consequence: string;
}

// Explain endpoint response (for querying past actions)
export interface ExplainResponse {
  outcome: string;
  factors: {
    in_your_favor: string[];
    against_you: string[];
  };
  consequence: string;
}

export interface ActionResponse {
  narrative: string;
  success: boolean;
  state_changes: Record<string, unknown>;
  options: string[];
  reasoning?: ReasoningInfo; // Present based on user preferences
}

// User preferences for mechanics display
export interface UserPreferences {
  show_reasoning: boolean;
  show_on_failure: boolean;
}

export type CombatState = "active" | "victory" | "defeat" | "fled";

export interface CombatParticipant {
  id: string;
  name: string;
  is_player: boolean;
  hp: number;
  max_hp: number;
  initiative: number;
}

export interface CombatSession {
  id: string;
  state: CombatState;
  round: number;
  current_turn_index: number;
  participants: CombatParticipant[];
  combat_log: CombatLogEntry[];
}

export interface CombatLogEntry {
  round: number;
  actor: string;
  action: string;
  target: string | null;
  damage: number;
  message: string;
  timestamp: string;
}

export interface CombatActionResponse {
  narrative: string;
  damage_dealt: number;
  damage_taken: number;
  combat_state: CombatState;
  is_player_turn: boolean;
  next_actor: string | null;
  combat_log_entry: CombatLogEntry;
}

// Game log entry for the scrolling text interface
export interface GameLogEntry {
  id: string;
  type: "narrative" | "action" | "combat" | "system" | "dialogue" | "intimate";
  content: string;
  timestamp: Date;
  actor?: string;
  action_id?: string;
  reasoning?: ReasoningInfo;
}

// Relationship dynamics / Intimacy system types

export type RelationshipLevel =
  | "stranger"
  | "acquaintance"
  | "friendly"
  | "close"
  | "intimate"
  | "bonded";

export type ScenePhase =
  | "initiating"
  | "negotiating"
  | "active"
  | "aftercare"
  | "complete";

export type IntensityLevel = "gentle" | "moderate" | "passionate" | "intense";

export type PlayerRole = "dominant" | "submissive" | "switch" | "equal";

export interface RelationshipStatus {
  npc_id: string;
  npc_name: string;
  level: RelationshipLevel;
  trust: number; // 0-100
  attraction: number; // 0-100
  history_summary?: string;
  last_interaction?: string;
  can_initiate_scene: boolean;
}

export interface IntimacyPreferences {
  inferred_preferences: string[];
  comfort_level: IntensityLevel;
  preferred_roles: PlayerRole[];
  boundaries: string[];
}

export interface SceneNegotiation {
  player_role: PlayerRole;
  intensity: IntensityLevel;
  boundaries: string[];
  safeword: string;
}

export interface ActiveScene {
  id: string;
  npc_id: string;
  npc_name: string;
  phase: ScenePhase;
  intensity: IntensityLevel;
  player_role: PlayerRole;
  safeword: string;
  narrative: string;
  suggested_actions: string[];
  mood?: string;
}

export interface IntimacyResponse {
  success: boolean;
  narrative?: string;
  relationship?: RelationshipStatus;
  scene?: ActiveScene;
  preferences?: IntimacyPreferences;
  suggested_actions?: string[];
  error?: string;
}

export interface StartSceneRequest {
  npc_id: string;
}

export interface NegotiationRequest {
  scene_id: string;
  player_role: PlayerRole;
  intensity: IntensityLevel;
  boundaries: string[];
  safeword: string;
}

export interface SceneActionRequest {
  action: string;
  scene_id?: string;
}
