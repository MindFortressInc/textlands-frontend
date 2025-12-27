"use client";

import { useState, useCallback, useEffect } from "react";
import { GameLog, CommandInput, CharacterPanel, QuickActions, MobileStats, SceneNegotiation, ActiveScene, SettingsPanel, CombatPanel } from "@/components/game";
import { ThemePicker } from "@/components/ThemePicker";
import type { Character, GameLogEntry, Genre, World, WorldsByGenre, CampfireResponse, CharacterOption, ActiveScene as ActiveSceneType, NegotiationRequest, CombatSession, ReasoningInfo, InfiniteWorld, InfiniteCampfireResponse, InfiniteCampfireCharacter } from "@/types/game";
import * as api from "@/lib/api";

// ========== HELPERS ==========

let logId = 0;
const log = (
  type: GameLogEntry["type"],
  content: string,
  actor?: string,
  reasoning?: ReasoningInfo,
  action_id?: string
): GameLogEntry => ({
  id: `${++logId}`,
  type,
  content,
  timestamp: new Date(),
  actor,
  reasoning,
  action_id,
});

// Genre/tone icons for visual flair
const TONE_ICONS: Record<string, string> = {
  fantasy: "⚔",
  scifi: "◈",
  horror: "☠",
  mystery: "◎",
  western: "☆",
  romance: "♡",
  historical: "⚜",
  urban: "◇",
  contemporary: "▣",
  thriller: "◆",
  heroic: "⚔",
  grimdark: "☠",
  noir: "◆",
  comedic: "☆",
  slice_of_life: "♡",
  satirical: "◎",
  romantic: "♡",
};

// ========== DEMO DATA ==========

// Demo infinite worlds for offline mode
const DEMO_INFINITE_WORLDS: InfiniteWorld[] = [
  {
    id: "demo-thornwood",
    slug: "thornwood-vale",
    name: "Thornwood Vale",
    tagline: "Dark secrets lurk beneath ancient boughs",
    description: "A dark medieval fantasy realm where magic has a terrible cost and the old gods still hunger.",
    creator_id: "system",
    is_public: true,
    governance: { type: "autocracy" },
    physics_rules: { magic_exists: true, magic_system: "hard", tech_level: "medieval" },
    society_rules: { class_system: "rigid", economy_type: "feudal" },
    content_rules: { violence_level: "graphic", romance_level: "fade_to_black", nsfw_allowed: false },
    tone_rules: { primary_tone: "grimdark", stakes_level: "personal", moral_complexity: "grey" },
    player_count: 42,
  },
  {
    id: "demo-neon",
    slug: "neon-sprawl",
    name: "Neon Sprawl",
    tagline: "Jack in. Fight back. Survive.",
    description: "Cyberpunk megacity where megacorps rule and hackers fight for freedom in the digital shadows.",
    creator_id: "system",
    is_public: true,
    governance: { type: "council" },
    physics_rules: { magic_exists: false, tech_level: "futuristic" },
    society_rules: { class_system: "fluid", economy_type: "capitalist" },
    content_rules: { violence_level: "graphic", romance_level: "suggestive", nsfw_allowed: false },
    tone_rules: { primary_tone: "noir", stakes_level: "personal", moral_complexity: "grey" },
    player_count: 28,
  },
  {
    id: "demo-willowmere",
    slug: "willowmere",
    name: "Willowmere",
    tagline: "A cozy corner of the realm",
    description: "Low-stakes wholesome fantasy focused on community, crafting, and found family.",
    creator_id: "system",
    is_public: true,
    governance: { type: "democracy" },
    physics_rules: { magic_exists: true, magic_system: "soft", tech_level: "medieval" },
    society_rules: { class_system: "fluid", economy_type: "mercantile" },
    content_rules: { violence_level: "mild", romance_level: "fade_to_black", nsfw_allowed: false },
    tone_rules: { primary_tone: "slice_of_life", stakes_level: "personal", moral_complexity: "grey" },
    player_count: 15,
  },
];

// Legacy demo data (for backwards compatibility)
const DEMO_GENRES: Genre[] = [
  { genre: "fantasy", count: 18 },
  { genre: "scifi", count: 19 },
  { genre: "horror", count: 13 },
  { genre: "mystery", count: 8 },
  { genre: "western", count: 6 },
  { genre: "romance", count: 13 },
  { genre: "historical", count: 8 },
  { genre: "contemporary", count: 5 },
];

const DEMO_WORLDS_BY_GENRE: WorldsByGenre[] = [
  {
    genre: "fantasy",
    worlds: [
      { id: "demo-crossroads", name: "The Crossroads", genre: "fantasy", subgenre: "adventure", description: "Where all paths converge in mystery" },
      { id: "demo-elderwood", name: "Elderwood", genre: "fantasy", subgenre: "dark", description: "Ancient forest of whispers and secrets" },
      { id: "demo-ironhold", name: "Ironhold", genre: "fantasy", subgenre: "siege", description: "A fortress city besieged by darkness" },
    ],
  },
];

const DEMO_CAMPFIRE: CampfireResponse = {
  world: {
    id: "demo-crossroads",
    name: "The Crossroads",
    genre: "fantasy",
    subgenre: "adventure",
    description: "A mystical nexus where travelers from all realms meet.",
  },
  intro_text: "The fire crackles warmly as shadows dance across weathered faces. Three figures sit around the flames, each carrying stories untold. The innkeeper watches from the doorway, knowing that tonight, one of these souls will embark on a journey that will change everything.\n\nWho will you become?",
  characters: [
    { id: "demo-1", name: "Wanderer", race: "Human", character_class: "Adventurer", backstory: "A mysterious traveler with no past and uncertain future. They carry only a worn blade and fragments of memories." },
    { id: "demo-2", name: "Kira Shadowleaf", race: "Elf", character_class: "Ranger", backstory: "An outcast from the forest kingdom, hunting something—or someone—across the realms." },
    { id: "demo-3", name: "Throk the Bold", race: "Orc", character_class: "Warrior", backstory: "A reformed raider seeking redemption through honorable deeds." },
  ],
};

const DEMO_CHARACTER: Character = {
  id: "demo-1",
  name: "Wanderer",
  race: "Human",
  character_class: "Adventurer",
  stats: { hp: 85, max_hp: 100, mana: 45, max_mana: 50, gold: 127, xp: 35, level: 3 },
  current_zone_id: "starting_zone",
  inventory: [],
  equipped: { weapon: "iron_sword" },
};

// ========== STATE TYPE ==========

type AppPhase = "loading" | "landing" | "genres" | "worlds" | "campfire" | "infinite-campfire" | "game";

// ========== INLINE VIEW COMPONENTS ==========

function LoadingView() {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)]">
      <div className="text-[var(--amber)] font-bold tracking-[0.3em] text-lg mb-4 title-glow">TEXTLANDS</div>
      <div className="text-[var(--mist)] text-sm animate-pulse">Connecting...</div>
    </main>
  );
}

function LandingView({ onEnter, isDemo }: { onEnter: () => void; isDemo: boolean }) {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-atmospheric p-4 pt-[max(1rem,env(safe-area-inset-top))] animate-fade-in">
      {/* Decorative top line */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />

      <div className="text-center space-y-8 max-w-md corner-brackets p-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="text-[var(--mist)] text-[10px] tracking-[0.5em] uppercase">Welcome to</div>
          <h1 className="text-[var(--amber)] text-3xl md:text-5xl font-bold tracking-[0.2em] title-glow">
            TEXTLANDS
          </h1>
          <div className="text-[var(--mist)] text-[10px] tracking-[0.3em] uppercase">Est. MMXXV</div>
        </div>

        {/* Tagline */}
        <p className="text-[var(--text-dim)] text-sm md:text-base italic">
          Choose your world. Become your character.
        </p>

        {isDemo && (
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--crimson)] animate-pulse" />
            <span className="text-[var(--crimson)] text-xs uppercase tracking-widest">Offline Mode</span>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onEnter}
          className="group relative px-10 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[52px] bg-[var(--shadow)] border border-[var(--slate)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
        >
          <span className="relative z-10">Begin Your Journey</span>
          <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>

        {/* Decorative text */}
        <div className="text-[var(--slate)] text-[10px] tracking-widest">
          ═══ ENTER THE REALM ═══
        </div>
      </div>

      {/* Theme picker */}
      <div className="absolute bottom-4 right-4 pb-[env(safe-area-inset-bottom)]">
        <ThemePicker />
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--amber-dim)] to-transparent opacity-50" />
    </main>
  );
}

function GenreGrid({ genres, onSelect, onBack }: {
  genres: Genre[];
  onSelect: (genre: Genre) => void;
  onBack: () => void;
}) {
  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">SELECT GENRE</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">{genres.length} REALMS AVAILABLE</div>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto stagger-fade-in">
          {genres.map((genre) => (
            <button
              key={genre.genre}
              onClick={() => onSelect(genre)}
              className="genre-card p-4 text-left flex flex-col gap-3 min-h-[120px] md:min-h-[140px]"
            >
              {/* Genre icon */}
              <div className="text-2xl md:text-3xl text-[var(--amber)] opacity-80">
                {TONE_ICONS[genre.genre] || "◇"}
              </div>

              {/* Genre name */}
              <div className="flex-1">
                <span className="text-[var(--amber)] font-bold text-sm md:text-base capitalize block">
                  {genre.genre}
                </span>
              </div>

              {/* World count */}
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--amber-dim)]" />
                <span className="text-[var(--mist)] text-[10px] tracking-wide">
                  {genre.count} WORLDS
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function WorldList({ genre, worldsByGenre, onSelect, onBack }: {
  genre: Genre;
  worldsByGenre: WorldsByGenre[];
  onSelect: (world: World) => void;
  onBack: () => void;
}) {
  // Find worlds for this genre
  const genreData = worldsByGenre.find(wg => wg.genre === genre.genre);
  const worlds = genreData?.worlds || [];

  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl text-[var(--amber)] opacity-70">{TONE_ICONS[genre.genre] || "◇"}</span>
            <span className="text-[var(--amber)] font-bold tracking-wider uppercase">{genre.genre}</span>
          </div>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">{worlds.length} WORLDS</div>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-3 max-w-2xl mx-auto stagger-fade-in">
          {worlds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[var(--mist)] text-2xl mb-2">◌</div>
              <p className="text-[var(--mist)]">No worlds available yet.</p>
              <p className="text-[var(--slate)] text-sm mt-1">Check back soon...</p>
            </div>
          ) : (
            worlds.map((world) => (
              <button
                key={world.id}
                onClick={() => onSelect(world)}
                className="world-card w-full p-4 text-left min-h-[80px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--amber)] font-bold block">{world.name}</span>
                    <span className="text-[var(--text-dim)] text-sm mt-1 block line-clamp-2">{world.description}</span>
                  </div>
                  {world.subgenre && (
                    <span className="text-[var(--mist)] text-[10px] tracking-wider uppercase shrink-0 mt-1">
                      {world.subgenre}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

// New Infinite Worlds browser
function WorldBrowser({ worlds, onSelect, onBack }: {
  worlds: InfiniteWorld[];
  onSelect: (world: InfiniteWorld) => void;
  onBack: () => void;
}) {
  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">CHOOSE YOUR WORLD</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">{worlds.length} REALMS AVAILABLE</div>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto stagger-fade-in">
          {worlds.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-[var(--mist)] text-2xl mb-2">◌</div>
              <p className="text-[var(--mist)]">No worlds available yet.</p>
              <p className="text-[var(--slate)] text-sm mt-1">Check back soon...</p>
            </div>
          ) : (
            worlds.map((world) => {
              const tone = world.tone_rules?.primary_tone || "heroic";
              const icon = TONE_ICONS[tone] || "◇";

              return (
                <button
                  key={world.id}
                  onClick={() => onSelect(world)}
                  className="world-card p-5 text-left flex flex-col gap-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-[var(--amber)] opacity-80">{icon}</span>
                      <span className="text-[var(--amber)] font-bold">{world.name}</span>
                    </div>
                    {world.player_count > 0 && (
                      <span className="text-[var(--mist)] text-[10px] tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--arcane)]" />
                        {world.player_count}
                      </span>
                    )}
                  </div>

                  {/* Tagline */}
                  <p className="text-[var(--amber-dim)] text-sm italic">
                    {world.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-[var(--text-dim)] text-sm line-clamp-3 flex-1">
                    {world.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-[var(--slate)]">
                    {world.physics_rules?.magic_exists && (
                      <span className="text-[var(--arcane)] text-[10px] tracking-wider uppercase">Magic</span>
                    )}
                    {world.physics_rules?.tech_level && (
                      <span className="text-[var(--mist)] text-[10px] tracking-wider uppercase">{world.physics_rules.tech_level}</span>
                    )}
                    {world.content_rules?.violence_level && (
                      <span className="text-[var(--crimson)] text-[10px] tracking-wider uppercase">{world.content_rules.violence_level}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

function CampfireView({ campfire, onSelect, onBack, loading }: {
  campfire: CampfireResponse;
  onSelect: (character: CharacterOption) => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">{campfire.world.name}</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">THE CAMPFIRE</div>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Campfire scene - intro narrative */}
        <div className="p-6 border-b border-[var(--slate)] bg-gradient-to-b from-[var(--shadow)] to-transparent">
          <div className="max-w-2xl mx-auto">
            {/* Fire decoration */}
            <div className="text-center mb-4 fire-flicker">
              <span className="text-2xl text-[var(--amber)]">🔥</span>
            </div>

            <p className="text-[var(--amber)] leading-relaxed whitespace-pre-wrap text-sm md:text-base campfire-text text-center italic">
              {campfire.intro_text}
            </p>
          </div>
        </div>

        {/* Character selection */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="text-center mb-6">
            <div className="text-[var(--mist)] text-[10px] tracking-[0.3em] uppercase mb-1">Choose Your</div>
            <div className="text-[var(--amber)] font-bold tracking-wider">CHARACTER</div>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto stagger-fade-in">
            {campfire.characters.map((char) => (
              <button
                key={char.id}
                onClick={() => onSelect(char)}
                disabled={loading}
                className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  {/* Character portrait placeholder */}
                  <div className="w-12 h-12 rounded bg-[var(--slate)] flex items-center justify-center text-[var(--amber)] text-xl shrink-0">
                    {char.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[var(--amber)] font-bold">{char.name}</span>
                      <span className="text-[var(--arcane)] text-[10px] tracking-wider uppercase">
                        {char.race} {char.character_class}
                      </span>
                    </div>
                    <p className="text-[var(--text-dim)] text-sm line-clamp-2">
                      {char.backstory}
                    </p>
                  </div>
                </div>

                {/* Selection indicator */}
                <div className="mt-3 pt-3 border-t border-[var(--slate)] flex items-center justify-between">
                  <span className="text-[var(--mist)] text-[10px] tracking-wider">SELECT TO PLAY</span>
                  <span className="text-[var(--amber)] text-sm">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// Infinite Worlds campfire view
function InfiniteCampfireView({ campfire, onSelect, onBack, loading }: {
  campfire: InfiniteCampfireResponse;
  onSelect: (character: InfiniteCampfireCharacter) => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">{campfire.world_name}</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">THE CAMPFIRE</div>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Campfire scene - intro narrative */}
        <div className="p-6 border-b border-[var(--slate)] bg-gradient-to-b from-[var(--shadow)] to-transparent">
          <div className="max-w-2xl mx-auto">
            {/* Fire decoration */}
            <div className="text-center mb-4 fire-flicker">
              <span className="text-2xl text-[var(--amber)]">🔥</span>
            </div>

            <p className="text-[var(--amber)] leading-relaxed whitespace-pre-wrap text-sm md:text-base campfire-text text-center italic">
              {campfire.intro_text}
            </p>

            {campfire.world_tagline && (
              <p className="text-[var(--mist)] text-xs text-center mt-4 tracking-wider">
                {campfire.world_tagline}
              </p>
            )}
          </div>
        </div>

        {/* Character selection */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="text-center mb-6">
            <div className="text-[var(--mist)] text-[10px] tracking-[0.3em] uppercase mb-1">Choose Your</div>
            <div className="text-[var(--amber)] font-bold tracking-wider">CHARACTER</div>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto stagger-fade-in">
            {campfire.characters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--mist)]">No characters available.</p>
              </div>
            ) : (
              campfire.characters.filter(c => c.is_playable).map((char) => (
                <button
                  key={char.id}
                  onClick={() => onSelect(char)}
                  disabled={loading}
                  className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    {/* Character portrait placeholder */}
                    <div className="w-12 h-12 rounded bg-[var(--slate)] flex items-center justify-center text-[var(--amber)] text-xl shrink-0">
                      {char.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[var(--amber)] font-bold">{char.name}</span>
                        {char.occupation && (
                          <span className="text-[var(--arcane)] text-[10px] tracking-wider uppercase">
                            {char.occupation}
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-dim)] text-sm mb-2">
                        {char.physical_summary}
                      </p>
                      <p className="text-[var(--mist)] text-xs italic line-clamp-2">
                        {char.backstory_hook}
                      </p>
                    </div>
                  </div>

                  {/* Personality tags */}
                  {char.personality_summary && (
                    <div className="mt-3 pt-3 border-t border-[var(--slate)] flex items-center justify-between">
                      <span className="text-[var(--mist)] text-[10px] tracking-wider">
                        {char.personality_summary}
                      </span>
                      <span className="text-[var(--amber)] text-sm">→</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ========== MAIN PAGE COMPONENT ==========

export default function GamePage() {
  // Phase state machine
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [isDemo, setIsDemo] = useState(false);

  // Infinite Worlds state (new system)
  const [infiniteWorlds, setInfiniteWorlds] = useState<InfiniteWorld[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<InfiniteWorld | null>(null);
  const [infiniteCampfire, setInfiniteCampfire] = useState<InfiniteCampfireResponse | null>(null);

  // Legacy world selection state (for backwards compatibility)
  const [genres, setGenres] = useState<Genre[]>([]);
  const [worldsByGenre, setWorldsByGenre] = useState<WorldsByGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [campfireData, setCampfireData] = useState<CampfireResponse | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  // Game state
  const [character, setCharacter] = useState<Character | null>(null);
  const [entries, setEntries] = useState<GameLogEntry[]>([]);
  const [zoneName, setZoneName] = useState("...");
  const [processing, setProcessing] = useState(false);

  // Scene/Intimacy state
  const [activeScene, setActiveScene] = useState<ActiveSceneType | null>(null);
  const [negotiating, setNegotiating] = useState<{ npc_id: string; scene_id: string; npc_name: string } | null>(null);

  // Combat state
  const [activeCombat, setActiveCombat] = useState<CombatSession | null>(null);
  const [combatNarrative, setCombatNarrative] = useState<string>("");

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // ========== INITIALIZATION ==========

  useEffect(() => {
    async function init() {
      const healthy = await api.checkHealth();

      if (!healthy) {
        // API unavailable - demo mode
        setIsDemo(true);
        setInfiniteWorlds(DEMO_INFINITE_WORLDS);
        setGenres(DEMO_GENRES);
        setWorldsByGenre(DEMO_WORLDS_BY_GENRE);
        setPhase("landing");
        return;
      }

      // Fetch infinite worlds and preferences in parallel
      try {
        const [worldsData, prefs] = await Promise.all([
          api.getInfiniteWorlds(),
          api.getPreferences().catch(() => ({ show_reasoning: false, show_on_failure: true })),
        ]);
        setInfiniteWorlds(worldsData);
        setShowReasoning(prefs.show_reasoning);
      } catch {
        // Fall back to demo mode on error
        setIsDemo(true);
        setInfiniteWorlds(DEMO_INFINITE_WORLDS);
        setGenres(DEMO_GENRES);
        setWorldsByGenre(DEMO_WORLDS_BY_GENRE);
      }

      setPhase("landing");
    }

    init();
  }, []);

  // ========== PHASE TRANSITIONS ==========

  const enterWorlds = () => setPhase("worlds");

  // New: Select an infinite world and go to campfire for character selection
  const selectInfiniteWorld = async (world: InfiniteWorld) => {
    setSelectedWorld(world);
    setProcessing(true);

    if (!isDemo) {
      try {
        const campfire = await api.getInfiniteCampfire(world.id);
        setInfiniteCampfire(campfire);
        setPhase("infinite-campfire");
      } catch {
        // Fallback to demo campfire
        setInfiniteCampfire({
          world_id: world.id,
          world_name: world.name,
          world_tagline: world.tagline,
          intro_text: world.description,
          tone: world.tone_rules?.primary_tone || "heroic",
          characters: [],
        });
        setPhase("infinite-campfire");
      }
    } else {
      // Demo mode - show demo campfire
      setInfiniteCampfire({
        world_id: world.id,
        world_name: world.name,
        world_tagline: world.tagline,
        intro_text: world.description,
        tone: world.tone_rules?.primary_tone || "heroic",
        characters: [],
      });
      setPhase("infinite-campfire");
    }

    setProcessing(false);
  };

  // Select a character from infinite campfire and start game
  const selectInfiniteCharacter = async (char: InfiniteCampfireCharacter) => {
    if (!selectedWorld || !infiniteCampfire) return;

    setProcessing(true);

    if (!isDemo) {
      try {
        const { session, opening_narrative } = await api.startSession({
          world_id: selectedWorld.id,
          character_id: char.id,
        });

        setCharacter({
          id: char.id,
          name: char.name,
          race: "Unknown",
          character_class: char.occupation || "Wanderer",
          stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
          current_zone_id: null,
          inventory: [],
          equipped: {},
        });

        setZoneName(selectedWorld.name);
        setEntries([
          log("system", `Entering ${selectedWorld.name}`),
          log("narrative", opening_narrative || infiniteCampfire.intro_text),
          log("system", "Type 'help' for commands, or just describe what you want to do"),
        ]);
        setPhase("game");
      } catch (err) {
        addLog("system", `Error: ${err instanceof Error ? err.message : "Failed to start session"}`);
      }
    } else {
      // Demo mode
      setCharacter({
        id: char.id,
        name: char.name,
        race: "Unknown",
        character_class: char.occupation || "Wanderer",
        stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
        current_zone_id: null,
        inventory: [],
        equipped: {},
      });
      setZoneName(selectedWorld.name);
      setEntries([
        log("system", "Demo Mode"),
        log("narrative", infiniteCampfire.intro_text),
        log("system", "Type 'help' for commands"),
      ]);
      setPhase("game");
    }

    setProcessing(false);
  };

  // Legacy: Select genre (for old flow)
  const enterGenres = () => setPhase("genres");

  const selectGenre = async (genre: Genre) => {
    setSelectedGenre(genre);

    // Fetch worlds if not cached
    if (!isDemo && worldsByGenre.length === 0) {
      try {
        const worldData = await api.getWorlds();
        setWorldsByGenre(worldData);
      } catch {
        setWorldsByGenre(DEMO_WORLDS_BY_GENRE);
      }
    }

    setPhase("worlds");
  };

  const selectWorld = async (world: World) => {
    setSelectedWorldId(world.id);

    if (isDemo) {
      setCampfireData(DEMO_CAMPFIRE);
    } else {
      try {
        const data = await api.getCampfire(world.id);
        setCampfireData(data);
      } catch {
        setCampfireData(DEMO_CAMPFIRE);
      }
    }

    setPhase("campfire");
  };

  const selectCharacter = async (charOption: CharacterOption) => {
    setProcessing(true);

    if (isDemo) {
      // Demo mode - use demo character
      setCharacter({
        ...DEMO_CHARACTER,
        id: charOption.id,
        name: charOption.name,
        race: charOption.race,
        character_class: charOption.character_class,
      });
      setZoneName(campfireData?.world.name || "The Crossroads");
      setEntries([
        log("system", "Demo Mode"),
        log("narrative", campfireData?.intro_text || "Your adventure begins..."),
        log("system", "Type 'help' for commands"),
      ]);
    } else {
      // Real API - start session
      try {
        const { session, message, opening_narrative } = await api.startSession({
          world_id: selectedWorldId || undefined,
          character_id: charOption.id,
        });

        setCharacter({
          id: charOption.id,
          name: charOption.name,
          race: charOption.race,
          character_class: charOption.character_class,
          stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
          current_zone_id: null,
          inventory: [],
          equipped: {},
        });

        setZoneName(campfireData?.world.name || "Unknown");
        setEntries([
          log("system", session.is_guest ? "Guest Session" : "Welcome!"),
          log("narrative", opening_narrative || message),
          log("system", "Type 'help' for commands, or just describe what you want to do"),
        ]);
      } catch {
        // Fallback to demo on error
        setCharacter(DEMO_CHARACTER);
        setZoneName("The Crossroads");
        setEntries([
          log("system", "Connection failed - Demo Mode"),
          log("narrative", "Your adventure begins at the crossroads..."),
        ]);
      }
    }

    setProcessing(false);
    setPhase("game");
  };

  // ========== GAME LOGIC ==========

  const addLog = useCallback((type: GameLogEntry["type"], content: string, actor?: string) => {
    setEntries((prev) => [...prev, log(type, content, actor)]);
  }, []);

  const handleCommand = useCallback(async (command: string) => {
    if (!character) return;
    addLog("action", command);

    const cmd = command.toLowerCase().trim();
    const [action, ...rest] = cmd.split(/\s+/);
    const args = rest.join(" ");

    setProcessing(true);

    try {
      // Local commands that don't need API
      if (action === "help") {
        addLog("system", "Commands: look, go <dir>, talk <npc>, or just describe what you want to do naturally");
      } else if (action === "stats") {
        const { stats: s } = character;
        addLog("system", `${character.name} - Lv.${s.level} ${character.race} ${character.character_class}\nHP: ${s.hp}/${s.max_hp} | MP: ${s.mana}/${s.max_mana} | Gold: ${s.gold} | XP: ${s.xp}`);
      } else if (["inventory", "inv", "i"].includes(action)) {
        addLog("system", character.inventory.length ? `Inventory: ${character.inventory.join(", ")}` : "Your pack is empty.");
      } else if (isDemo) {
        // Demo mode - canned responses
        handleDemoCommand(action, args);
      } else {
        // Real API - use natural language endpoint
        const result = await api.doAction(command);

        // Add narrative with reasoning if available
        setEntries((prev) => [
          ...prev,
          log("narrative", result.narrative, undefined, result.reasoning, result.action_id),
        ]);

        if (result.suggested_actions?.length) {
          addLog("system", `Try: ${result.suggested_actions.join(", ")}`);
        }

        if (result.character) {
          setCharacter(result.character);
        }

        if (result.error) {
          addLog("system", result.error);
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    setProcessing(false);
  }, [character, addLog, isDemo]);

  const handleDemoCommand = useCallback((action: string, args: string) => {
    if (["look", "l"].includes(action)) {
      addLog("narrative", "The ancient crossroads stretches in all directions, worn stones marking countless footsteps. A weathered signpost points to distant lands.");
      addLog("system", "Exits: north, south, east, west");
    } else if (["go", "move", "walk", "n", "s", "e", "w", "north", "south", "east", "west"].includes(action)) {
      let dir = args;
      if (["n", "north"].includes(action)) dir = "north";
      if (["s", "south"].includes(action)) dir = "south";
      if (["e", "east"].includes(action)) dir = "east";
      if (["w", "west"].includes(action)) dir = "west";

      if (!dir) {
        addLog("system", "Go where?");
      } else {
        addLog("narrative", `You head ${dir}. The path stretches before you, full of possibility...`);
      }
    } else if (["talk", "speak"].includes(action)) {
      if (!args) {
        addLog("system", "Talk to whom?");
      } else {
        addLog("dialogue", `"Greetings, traveler. What brings you to the crossroads?"`, args);
      }
    } else if (["attack", "fight"].includes(action)) {
      addLog("combat", "You ready your weapon...");
      addLog("system", "No enemies nearby.");
    } else {
      addLog("narrative", "Nothing happens. (Demo mode - try: look, go north, talk innkeeper)");
    }
  }, [addLog]);

  // ========== SCENE HANDLERS ==========

  const handleStartScene = useCallback(async (npcId: string, npcName: string) => {
    if (isDemo) {
      addLog("system", "Intimate scenes not available in demo mode.");
      return;
    }

    setProcessing(true);
    try {
      const result = await api.startScene(npcId);
      if (result.success && result.scene) {
        setNegotiating({
          npc_id: npcId,
          scene_id: result.scene.id,
          npc_name: npcName,
        });
        if (result.narrative) {
          addLog("intimate", result.narrative);
        }
      } else {
        addLog("system", result.error || "Cannot initiate scene with this character.");
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [isDemo, addLog]);

  const handleNegotiationComplete = useCallback(async (negotiation: NegotiationRequest) => {
    setProcessing(true);
    try {
      const result = await api.negotiateScene(negotiation);
      setNegotiating(null);

      if (result.success && result.scene) {
        setActiveScene(result.scene);
        if (result.narrative) {
          addLog("intimate", result.narrative);
        }
      } else {
        addLog("system", result.error || "Negotiation failed.");
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [addLog]);

  const handleNegotiationCancel = useCallback(() => {
    setNegotiating(null);
    addLog("system", "Scene cancelled.");
  }, [addLog]);

  const handleSceneAction = useCallback(async (action: string) => {
    if (!activeScene) return;

    setProcessing(true);
    try {
      const result = await api.sceneAction({ action, scene_id: activeScene.id });

      if (result.success && result.scene) {
        setActiveScene(result.scene);
        if (result.narrative) {
          addLog("intimate", result.narrative);
        }
      } else {
        addLog("system", result.error || "Action failed.");
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [activeScene, addLog]);

  const handleSafeword = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await api.invokeSafeword();
      setActiveScene(null);

      if (result.narrative) {
        addLog("system", result.narrative);
      } else {
        addLog("system", "Scene ended safely.");
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
      setActiveScene(null);
    }
    setProcessing(false);
  }, [addLog]);

  const handleSceneComplete = useCallback(async (aftercareQuality: "minimal" | "standard" | "extended") => {
    setProcessing(true);
    try {
      const result = await api.completeScene(aftercareQuality);
      setActiveScene(null);

      if (result.narrative) {
        addLog("intimate", result.narrative);
      }
      if (result.relationship) {
        addLog("system", `Your bond with ${result.relationship.npc_name} has ${result.relationship.level === "bonded" ? "deepened into something profound" : "grown stronger"}.`);
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
      setActiveScene(null);
    }
    setProcessing(false);
  }, [addLog]);

  // ========== COMBAT HANDLERS ==========

  const handleCombatAction = useCallback(async (
    action: "attack" | "defend" | "skill" | "item" | "flee",
    targetId?: string
  ) => {
    if (!activeCombat || !character) return;

    setProcessing(true);
    try {
      const result = await api.combatAction(
        activeCombat.id,
        character.id,
        action,
        targetId
      );

      setCombatNarrative(result.narrative);
      addLog("combat", result.narrative);

      // Update combat state
      const updatedCombat = await api.getCombatState(activeCombat.id);
      setActiveCombat(updatedCombat);

      // Check if combat ended
      if (updatedCombat.state !== "active") {
        setTimeout(() => {
          setActiveCombat(null);
          setCombatNarrative("");
        }, 3000);
      }
    } catch (error) {
      addLog("system", `Combat error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [activeCombat, character, addLog]);

  // Check for active scene/combat on game start
  useEffect(() => {
    if (phase === "game" && !isDemo) {
      // Check for active scene
      if (!activeScene) {
        api.getActiveScene().then((result) => {
          if (result.scene) {
            setActiveScene(result.scene);
          }
        }).catch(() => {});
      }

      // Check for active combat
      if (!activeCombat && character) {
        api.getActiveCombat(character.id).then((combat) => {
          if (combat) {
            setActiveCombat(combat);
          }
        }).catch(() => {});
      }
    }
  }, [phase, isDemo, activeScene, activeCombat, character]);

  // ========== RENDER BY PHASE ==========

  if (phase === "loading") {
    return <LoadingView />;
  }

  if (phase === "landing") {
    return <LandingView onEnter={enterWorlds} isDemo={isDemo} />;
  }

  // New: Infinite Worlds browser (replaces genre grid + world list)
  if (phase === "worlds") {
    return (
      <WorldBrowser
        worlds={infiniteWorlds}
        onSelect={selectInfiniteWorld}
        onBack={() => setPhase("landing")}
      />
    );
  }

  // New: Infinite Worlds campfire (character selection)
  if (phase === "infinite-campfire" && infiniteCampfire) {
    return (
      <InfiniteCampfireView
        campfire={infiniteCampfire}
        onSelect={selectInfiniteCharacter}
        onBack={() => setPhase("worlds")}
        loading={processing}
      />
    );
  }

  // Legacy: Genre grid (kept for backwards compatibility)
  if (phase === "genres") {
    return (
      <GenreGrid
        genres={genres}
        onSelect={selectGenre}
        onBack={() => setPhase("landing")}
      />
    );
  }

  // Legacy: Campfire character selection
  if (phase === "campfire" && campfireData) {
    return (
      <CampfireView
        campfire={campfireData}
        onSelect={selectCharacter}
        onBack={() => setPhase("worlds")}
        loading={processing}
      />
    );
  }

  // Game phase
  return (
    <main className="h-dvh flex flex-col bg-[var(--void)]">
      {/* Modals */}
      {negotiating && (
        <SceneNegotiation
          npcName={negotiating.npc_name}
          sceneId={negotiating.scene_id}
          onConfirm={handleNegotiationComplete}
          onCancel={handleNegotiationCancel}
        />
      )}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          // Refresh preferences when closing
          if (!isDemo) {
            api.getPreferences().then((prefs) => setShowReasoning(prefs.show_reasoning)).catch(() => {});
          }
        }}
        isDemo={isDemo}
      />

      {/* Header */}
      <header className="bg-[var(--shadow)] border-b border-[var(--slate)] px-3 py-2 md:px-4 flex items-center justify-between shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--amber)] font-bold tracking-wider text-sm md:text-base">TEXTLANDS</span>
          {isDemo && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide">Demo</span>}
          {activeScene && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide animate-pulse">Scene</span>}
          {activeCombat && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide animate-pulse">Combat</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[var(--mist)] text-xs hidden sm:block">{zoneName}</span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-sm"
            title="Settings"
          >
            *
          </button>
          <ThemePicker />
        </div>
      </header>

      {/* Mobile stats bar - hidden during active scene or combat */}
      {!activeScene && !activeCombat && <MobileStats character={character} zoneName={zoneName} />}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {activeCombat ? (
          /* Combat Interface */
          <div className="flex-1 flex flex-col min-w-0">
            <CombatPanel
              combat={activeCombat}
              playerId={character?.id || ""}
              onAction={handleCombatAction}
              isProcessing={processing}
              lastNarrative={combatNarrative}
            />
          </div>
        ) : activeScene ? (
          /* Active Scene Interface */
          <div className="flex-1 flex flex-col min-w-0">
            <ActiveScene
              scene={activeScene}
              onAction={handleSceneAction}
              onSafeword={handleSafeword}
              onComplete={handleSceneComplete}
              isProcessing={processing}
            />
          </div>
        ) : (
          /* Normal Game Interface */
          <div className="flex-1 flex flex-col min-w-0">
            <GameLog entries={entries} showReasoning={showReasoning} />
            <QuickActions onCommand={handleCommand} disabled={processing} />
            <CommandInput
              onSubmit={handleCommand}
              disabled={processing}
              placeholder={processing ? "..." : "What do you do?"}
            />
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <CharacterPanel character={character} zoneName={zoneName} />
        </div>
      </div>
    </main>
  );
}
