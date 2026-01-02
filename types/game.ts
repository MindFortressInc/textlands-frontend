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
  land: string;
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

// Timeline event for entity history
export interface TimelineEvent {
  id: string;
  event_type: string;
  event_summary: string;
  occurred_at: string;
  importance: number;
  event_details?: Record<string, unknown>;
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
  // UI text fields from backend
  page_title?: string;           // World-appropriate title ("Neural Pod Selection")
  page_subtitle?: string;        // Flavor text ("Initialize consciousness transfer...")
  create_custom_prompt?: string; // CTA for custom character
  content_warnings?: string[];   // ["violence", "adult_themes"]
  is_nsfw_world: boolean;
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

// Account prompt reason types
export type AccountPromptReason = 'nsfw_unlock' | 'death_recovery' | 'time_limit';

// Entity reference for hover tooltips in narrative
export type EntityType = "npc" | "location" | "item" | "player";

export interface EntityReference {
  entity_id: string | null;
  entity_type: EntityType;
  name: string;
  start: number;  // Character offset in narrative (0-indexed)
  end: number;    // Character offset end (exclusive)
  role?: string;
  met_at?: string;
  relationship?: string;
  memory?: string;
}

// Content segment types for rich rendering
export type ContentType =
  | "dialogue"       // NPC speech
  | "combat_hit"     // Attack that landed
  | "combat_miss"    // Attack that missed
  | "combat_effect"  // Status effects, buffs, debuffs
  | "item_gained"    // Loot, rewards
  | "item_lost"      // Dropped, stolen, consumed
  | "item_used"      // Potion, scroll, tool
  | "movement"       // Location change
  | "environment"    // Scene description
  | "narration";     // General prose

export interface ContentSegment {
  type: ContentType;
  text: string;
  importance: number;     // 1-10 (for SMS truncation)
  // Type-specific fields
  speaker?: string;       // dialogue: NPC name
  verb?: string;          // dialogue: "says", "whispers", "growls"
  attacker?: string;      // combat: who attacked
  target?: string;        // combat: who was hit
  damage?: number;        // combat_hit: damage amount
  weapon?: string;        // combat: weapon used
  item_name?: string;     // items: what item
  quantity?: number;      // items: how many
  to_location?: string;   // movement: destination
}

/**
 * State changes from actions.
 * IMPORTANT: All numeric values are DELTAS (add/subtract), not absolute values.
 * Apply as: character.hp += state_changes.hp
 */
export interface StateChanges {
  hp?: number;       // HP delta (positive = heal, negative = damage)
  mp?: number;       // MP delta
  xp?: number;       // XP gained
  gold?: number;     // Gold delta (legacy, use currency for infinite worlds)
  items?: string[];  // Items added to inventory
  currency?: {       // Regional currency (infinite worlds)
    amount: number;
    currency_name: string;
    currency_symbol: string;
    new_balance: number;
  };
  inventory?: string[];     // Full inventory list (when updated)
  location?: string;        // New location name
  npc_killed?: {            // When an NPC is killed
    entity_id: string;
    npc_name: string;
    tier: 'common' | 'named' | 'legendary';
    bounty_created?: {
      id: string;
      amount: number;
      reason: string;
    };
    reputation_change?: number;
    respawn_at?: string;
  };
}

// System message from backend (show as toast/banner)
export interface SystemMessage {
  message: string;
  message_type: "info" | "warning" | "error" | "success";
  dismissible: boolean;
  action_button?: { text: string; action: string };
}

// Skill XP gain from actions
export interface SkillXPGain {
  skill_name: string;
  display_name: string;
  xp_gained: number;
  new_level: number;
  leveled_up: boolean;
  ability_unlocked?: string;
}

// Attrition damage in wilderness zones
export interface AttritionDamage {
  hp_lost: number;
  new_hp: number;
  warning: boolean;
  force_retreat: boolean;
}

// Frontier zone status
export type FrontierZone = "safe" | "frontier" | "wilderness" | "deep_wild";
export type SettlementLevel = "wild" | "outpost" | "settlement" | "established";

export interface FrontierStatus {
  zone: FrontierZone;
  zone_display: string;
  distance_from_hub: number;
  settlement_level: SettlementLevel;
  settlement_activity: number;
  settlement_progress: {
    current: number;
    next_threshold: number | null;
    percent: number;
  };
  danger_info: {
    difficulty_modifier: number;
    attrition_range: [number, number] | null;
    survival_skill_helps: boolean;
  };
}

export interface DoActionResponse {
  narrative: string;
  content_segments?: ContentSegment[];  // Tagged content for rich rendering
  entity_references?: EntityReference[]; // Entity mentions for hover tooltips
  state_changes: StateChanges;
  suggested_actions: string[];
  mood?: string;
  character?: Character;
  error?: string;
  action_id?: string;
  reasoning?: ReasoningInfo;
  // Location info for footprints
  location_entity_id?: string;
  location_name?: string;
  // Entity context for timeline/examine
  examined_entity_id?: string;
  examined_entity_name?: string;
  // NSFW content blocking
  nsfw_blocked?: boolean;
  nsfw_trigger?: string;
  // Guest account prompts
  requires_account?: boolean;
  account_prompt_reason?: AccountPromptReason;
  account_prompt_incentive?: string;
  show_save_prompt?: boolean;
  // System message (show as toast)
  system_message?: SystemMessage;
  // Skill XP gained from this action
  skill_xp?: SkillXPGain;
  // Attrition damage in wilderness zones
  attrition?: AttritionDamage;
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
  // Guest account prompts (on death)
  requires_account?: boolean;
  account_prompt_reason?: AccountPromptReason;
  account_prompt_incentive?: string;
}

// Game log entry for the scrolling text interface
export interface GameLogEntry {
  id: string;
  type: "narrative" | "action" | "combat" | "system" | "dialogue" | "intimate";
  content: string;
  content_segments?: ContentSegment[];  // Tagged content for rich rendering
  entity_references?: EntityReference[]; // Entity mentions for hover tooltips
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

// ============ CHARACTER PROFILE ============

export interface CharacterPhysical {
  height?: string;
  build?: string;
  hair?: string;
  eyes?: string;
  distinguishing_features?: string[];
  typical_clothing?: string;
  first_impression?: string;
}

export interface CharacterIdentity {
  species: string;
  gender: string;
  age_apparent?: string;
  physical?: CharacterPhysical;
  personality_core?: string[];
  backstory_summary?: string;
  voice?: string;
}

export interface CharacterState {
  current_location?: string;
  current_mood?: string;
  current_goals?: string[];
  current_problems?: string[];
  wealth_level?: string;
  hp: number;
  max_hp: number;
  currency: number;
}

export interface ProfileEvent {
  event_type: string;
  summary: string;
  occurred_at: string;
  importance: number;
}

export interface CharacterProfile {
  entity_id: string;
  name: string;
  occupation?: string;
  world_id: string;
  world_name: string;
  one_liner?: string;
  identity: CharacterIdentity;
  state: CharacterState;
  recent_events: ProfileEvent[];
}

// ============ TIME & WEATHER SYSTEM ============

export type TimeOfDay = "dawn" | "morning" | "afternoon" | "evening" | "night" | "twilight" | "underground" | "artificial_day";
export type Season = "spring" | "summer" | "fall" | "winter" | "wet" | "dry" | "none" | "eternal";
export type DayCycle = "normal_24hr" | "long_nights" | "long_days" | "eternal_day" | "eternal_night" | "twilight" | "binary_suns";

export interface WorldTimeResponse {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  time_of_day: TimeOfDay;
  season: Season;
  weather: string;
  day_cycle: DayCycle;
  timezone_offset: number;
  timezone_name?: string;
  description: string;
  time_speed: number;
  next_turning_at?: string;
  seconds_until_turning?: number;
  last_turning_at?: string;
}

// ============ CONSEQUENCE SYSTEM ============

// Bounty on a player for crimes committed
export interface Bounty {
  id: string;
  world_id: string;
  target_player_id: string;
  target_display_name?: string;
  crime_type: string;
  crime_description: string;
  bounty_amount: number;
  status: "active" | "claimed" | "expired" | "paid_off";
  posted_at: string;
  expires_at?: string;
  claimed_by_player_id?: string;
  claimed_at?: string;
  victim_entity_id?: string;
  victim_name?: string;
}

// Infraction / criminal record entry
export interface Infraction {
  id: string;
  world_id: string;
  player_id: string;
  crime_type: string;
  description: string;
  severity: "minor" | "moderate" | "serious" | "heinous";
  occurred_at: string;
  location_name?: string;
  victim_entity_id?: string;
  victim_name?: string;
  bounty_id?: string;
  resolved: boolean;
  resolved_at?: string;
}

// NPC death record
export interface NpcDeath {
  id: string;
  world_id: string;
  entity_id: string;
  entity_name: string;
  killed_by_player_id?: string;
  killed_by_display_name?: string;
  cause_of_death: string;
  died_at: string;
  respawn_at?: string;
  respawned: boolean;
  location_name?: string;
}

// Claim bounty response
export interface ClaimBountyResponse {
  success: boolean;
  bounty: Bounty;
  reward_amount: number;
  message: string;
}

// Pay off bounty response
export interface PayOffBountyResponse {
  success: boolean;
  bounty: Bounty;
  amount_paid: number;
  message: string;
}

// Process respawns response
export interface ProcessRespawnsResponse {
  success: boolean;
  respawned_count: number;
  respawned_entities: string[];
  message: string;
}
