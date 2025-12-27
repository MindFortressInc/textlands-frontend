// Game types matching the TextLands backend API

// ============ INFINITE WORLDS SYSTEM ============

// World rule structures
export interface PhysicsRules {
  tech_level?: string;
  magic_exists?: boolean;
  magic_system?: string;
  resurrection_possible?: boolean;
  faster_than_light?: boolean;
  time_travel?: boolean;
}

export interface SocietyRules {
  class_system?: string;
  economy_type?: string;
  government_types?: string[];
}

export interface ContentRules {
  nsfw_allowed?: boolean;
  romance_level?: string;
  violence_level?: string;
}

export interface ToneRules {
  primary_tone?: string;
  stakes_level?: string;
  moral_complexity?: string;
}

export interface WorldGovernance {
  type: string;
  note?: string;
  owner_id?: string;
}

// Infinite World (from /infinite/worlds)
export interface InfiniteWorld {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  creator_id: string;
  is_public: boolean;
  realm: string;
  is_nsfw: boolean;
  governance: WorldGovernance;
  physics_rules: PhysicsRules;
  society_rules: SocietyRules;
  content_rules: ContentRules;
  tone_rules: ToneRules;
  player_count: number;
}

// World Template (from /infinite/templates)
export interface WorldTemplate {
  slug: string;
  name: string;
  description: string;
  genre: string;
  fork_count: number;
}

// Entity types
export type EntityType = "npc" | "location" | "item" | "faction" | "quest" | "secret";

export interface EntityIdentity {
  species?: string;
  gender?: string;
  age_apparent?: string;
  physical?: {
    height?: string;
    build?: string;
    hair?: string;
    eyes?: string;
    distinguishing_features?: string[];
    typical_clothing?: string;
  };
  personality_core?: string[];
  backstory_summary?: string;
  voice?: string;
}

export interface EntityState {
  current_location?: string;
  current_occupation?: string;
  current_mood?: string;
  current_goals?: string[];
  current_problems?: string[];
  wealth_level?: string;
}

export interface EntityRelationship {
  type: string;
  to_entity_id?: string;
  to_name?: string;
  to_type?: string;
  strength?: number;
  details?: string;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  event_summary: string;
  occurred_at: string;
  importance: number;
  event_details?: Record<string, unknown>;
}

// Trailblazer reward for generating content
export interface TrailblazerReward {
  governance_points: number;
  currency: number;
  trailblazer_points: number;
  was_first_of_type: boolean;
}

// Generated entity response
export interface GeneratedEntity {
  id: string;
  world_id: string;
  entity_type: EntityType;
  name: string;
  slug?: string;
  identity: EntityIdentity;
  state: EntityState;
  relationships: EntityRelationship[];
  is_new: boolean;
  reward?: TrailblazerReward;
  generated_by?: string;
  generation_context?: string;
  canonical_level?: string;
  content_rating?: string;
  content_warnings?: string[];
  timeline?: TimelineEvent[];
}

// Generate entity request
export interface GenerateEntityRequest {
  entity_type: EntityType;
  context: string;
  hints?: Record<string, string>;
  force_new?: boolean;
  player_id?: string;
}

// Player stats in a world
export interface PlayerWorldStats {
  player_id: string;
  world_id: string;
  governance_points: number;
  currency: number;
  trailblazer_score: number;
  entities_created_count: number;
  entities_created: string[];
  total_playtime_minutes: number;
  last_played_at: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  trailblazer_score: number;
  governance_points: number;
  currency: number;
  entities_created: number;
  last_played_at: string;
}

// Infinite world campfire character
export interface InfiniteCampfireCharacter {
  id: string;
  name: string;
  entity_type: string;
  occupation: string | null;
  physical_summary: string;
  personality_summary: string;
  backstory_hook: string;
  is_playable: boolean;
  canonical_level: string;
}

// Infinite world campfire response
export interface InfiniteCampfireResponse {
  world_id: string;
  world_name: string;
  world_tagline: string;
  intro_text: string;
  tone: string;
  characters: InfiniteCampfireCharacter[];
}

// ============ LEGACY TYPES (for backwards compatibility) ============

// World selection types (deprecated - use InfiniteWorld)
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
