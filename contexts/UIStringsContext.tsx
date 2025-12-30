"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import * as api from "@/lib/api";

// Default fallback strings (used while loading or if fetch fails)
const DEFAULT_STRINGS: Record<string, string> = {
  // Landing & navigation
  welcome_to: "Welcome to",
  tagline: "Choose your land. Become your character.",
  begin_adventure: "Begin Your Journey",
  new_character: "New Character",
  continue_as: "Continue as",
  enter_the_lands: "Enter the Lands",
  back: "Back",
  log_in: "Log In",
  log_out: "Log Out",
  hiscores: "HiScores",
  lost_journey: "Lost Journey?",

  // Character selection
  choose_your_land: "Choose Your Land",
  lands_available: "LANDS AVAILABLE",
  character_select: "Choose Your Character",
  choose_your_character: "Choose your character",
  select_character: "Select a character...",
  loading_characters: "Loading characters...",
  n_characters: "Characters",
  enter: "Enter",
  create_new_character: "Create New Character",
  manage_characters: "Manage Characters",
  no_characters_available: "No characters available.",
  create_your_own: "Create Your Own",
  describe_character_concept: "Describe a character concept",

  // Game state
  what_do_you_do: "What do you do?",
  connecting: "Connecting...",
  connection_error: "CONNECTION ERROR",
  try_again: "Try Again",
  loading: "Loading...",

  // Game commands
  help_commands: "Commands: look, go <dir>, talk <npc>, stats, inventory, settings, leave message \"text\", or describe what you want to do naturally",
  carve_message: "You carve your message into the surroundings...",
  message_seen: "Your words will be seen by future travelers.",
  leave_message_usage: "Usage: leave message \"your message here\"",
  opening_inventory: "Opening inventory...",
  opening_wallet: "Opening wallet...",
  opening_skills: "Opening skills...",
  opening_settings: "Opening settings...",
  nsfw_enable_required: "This action requires adult content to be enabled. Type 'settings' to change this.",

  // Header & tooltips
  leave_world: "Leave World",
  scene: "Scene",
  combat: "Combat",
  chat: "Chat",
  friends: "Friends",
  characters: "Characters",
  skills: "Skills",
  account_tokens: "Account & Tokens",
  settings: "Settings",

  // NSFW / Age gate
  adults_only: "Adults Only",
  blocked_enable_settings: "Blocked (enable in Settings)",
  lands_blocked: "lands · Blocked (enable in Settings)",
  tap_verify_age: "Tap to verify age",
  lands_verify_age: "lands · Tap to verify age",
  nsfw_blocked: "This content requires 18+ mode",

  // Auth
  check_email: "Check your email for a login link",
  save_prompt_text: "You've been adventuring for a while...",
  save_your_progress: "SAVE YOUR PROGRESS",
  check_your_email: "Check your email!",
  email_link_sent: "We sent a login link to",
  link_expires: "Link expires in 15 minutes",
  close: "Close",
  enter_email_to_save: "Enter your email to save your character and continue across sessions.",
  sending: "Sending...",
  send_login_link: "Send Login Link",
  no_password_magic_link: "No password needed - we'll email you a magic link",
  maybe_later: "Maybe Later",

  // Auth reasons
  unlock_intimate_content: "UNLOCK INTIMATE CONTENT",
  unlock_intimate_desc: "Sign in to access mature content and save your progress.",
  character_fallen: "YOUR CHARACTER HAS FALLEN",
  character_fallen_desc: "Sign in to recover your character and continue your adventure.",
  session_limit: "SESSION LIMIT REACHED",
  session_limit_desc: "Sign in to continue playing without limits.",

  // Settings
  mechanics_display: "Mechanics Display",
  mechanics_display_desc: "Control when you see the underlying mechanics that determine action outcomes.",
  show_mechanics: "Show Mechanics",
  show_mechanics_desc: "Display success chances, factors, and outcomes for all actions",
  show_on_failure_only: "Show on Failure Only",
  show_on_failure_desc: "Only reveal mechanics when actions fail",
  content: "Content",
  adult_content_18: "Adult Content (18+)",
  adult_content_desc: "Show mature realms and allow explicit content in all worlds",
  preferences_saved: "Preferences saved",

  // Combat
  attack: "Attack",
  attack_desc: "Strike your target",
  defend: "Defend",
  defend_desc: "Brace for impact",
  skill: "Skill",
  skill_desc: "Use an ability",
  you_are_victorious: "You are victorious!",
  you_have_fallen: "You have fallen...",
  you_fled: "You fled from battle.",

  // Chat
  sign_in_to_chat: "Sign in to use chat",
  no_messages_yet: "No messages yet.",
  be_first_to_say: "Be the first to say something!",

  // Timeline
  no_recorded_history: "No recorded history",
  no_timeline_events: "This entity has no timeline events yet",

  // Leaderboard
  no_rankings_yet: "No rankings yet",
  be_first_trailblazer: "Be the first trailblazer!",

  // World templates
  no_templates_available: "No templates available",
  check_back_later: "Check back later for new world templates",

  // Active scene
  scene_concluded: "The scene has concluded. Choose how you'd like to spend this moment together.",
  describe_your_action: "Describe your action...",
  aftercare_quick: "Quick",
  aftercare_quick_desc: "Brief acknowledgment",
  aftercare_standard: "Standard",
  aftercare_standard_desc: "Tender moment together",
  aftercare_extended: "Extended",
  aftercare_extended_desc: "Deep connection and care",

  // Character creation
  welcome_to_world: "Welcome to {world}. Tell me about the character you want to play...",
  describe_your_character: "Describe your character...",
  failed_to_create_character: "Failed to create character",
  character_suggestion_1: "A battle-hardened warrior",
  character_suggestion_2: "A cunning rogue with secrets",
  character_suggestion_3: "A scholar seeking forbidden knowledge",

  // Billing
  cancels_at_period_end: "Cancels at end of period",
  resets_daily: "Resets daily. Buy tokens for extra time.",
  token_uses: "Use for death recovery, fate rerolls, or extra playtime",

  // Account required modal
  requires_age_verification: "This action requires age verification and an account.",
  recover_character_desc: "Create an account to recover your character and continue your adventure.",
  continue_without_limits: "Create an account to continue playing without limits.",
  progress_saved_auto: "Your progress will be saved automatically",

  // World creation
  world_name_required: "World name is required",
  failed_to_create_world: "Failed to create world",
  describe_your_world: "Describe your world",
  world_description_placeholder: "A grimdark fantasy realm where fallen empires war over ancient magic...",
  enable_mature_themes: "Enable mature themes",

  // Player stats
  influence_decay_risk: "Influence decay at risk - play to maintain tier",
  from_entities_created: "From entities you created",
};

interface UIStringsContextType {
  strings: Record<string, string>;
  helpText: string;
  loading: boolean;
  // Helper function to get string with fallback
  t: (key: string, fallback?: string) => string;
}

const UIStringsContext = createContext<UIStringsContextType | null>(null);

export function UIStringsProvider({ children }: { children: ReactNode }) {
  const [strings, setStrings] = useState<Record<string, string>>(DEFAULT_STRINGS);
  const [helpText, setHelpText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrings() {
      try {
        const data = await api.getUIStrings();
        setStrings({ ...DEFAULT_STRINGS, ...data.strings });
        setHelpText(data.help_text);
      } catch (err) {
        console.warn("[UIStrings] Failed to fetch, using defaults:", err);
        // Keep default strings
      } finally {
        setLoading(false);
      }
    }
    fetchStrings();
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return strings[key] ?? fallback ?? key;
  }, [strings]);

  return (
    <UIStringsContext.Provider value={{ strings, helpText, loading, t }}>
      {children}
    </UIStringsContext.Provider>
  );
}

export const useUIStrings = () => {
  const ctx = useContext(UIStringsContext);
  if (!ctx) throw new Error("useUIStrings must be used within UIStringsProvider");
  return ctx;
};
