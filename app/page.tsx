"use client";

import { useState, useCallback, useEffect } from "react";
import { GameLog, CommandInput, CharacterPanel, QuickActions, MobileStats, SceneNegotiation, ActiveScene, SettingsPanel, CombatPanel, AgeGateModal, AuthModal, BillingPanel, InfluenceBadge, LeaderboardModal, CharacterCreationModal, PlayerStatsModal, EntityTimelineModal, WorldTemplatesModal, EntityGenerationModal, WorldCreationModal, BountyBoard, WantedStatus, PlayerRecord } from "@/components/game";
import { ThemePicker } from "@/components/ThemePicker";
import type { Character, GameLogEntry, Genre, World, WorldsByGenre, CampfireResponse, CharacterOption, ActiveScene as ActiveSceneType, NegotiationRequest, CombatSession, ReasoningInfo, InfiniteWorld, InfiniteCampfireResponse, InfiniteCampfireCharacter, AccountPromptReason, WorldTemplate } from "@/types/game";
import * as api from "@/lib/api";
import type { RealmGroup, PlayerInfluence, LocationFootprint } from "@/lib/api";
import type { PlayerWorldStats } from "@/types/game";

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

// Demo realm groups for offline mode
const DEMO_REALM_GROUPS: RealmGroup[] = [
  {
    realm: "fantasy",
    display_name: "Fantasy Realms",
    description: "Magic, medieval kingdoms, and mythical creatures",
    world_count: 2,
    is_locked: false,
    worlds: [
      {
        id: "demo-thornwood",
        slug: "thornwood-vale",
        name: "Thornwood Vale",
        tagline: "Dark secrets lurk beneath ancient boughs",
        description: "A dark medieval fantasy realm where magic has a terrible cost and the old gods still hunger.",
        creator_id: "system",
        is_public: true,
        realm: "fantasy",
        is_nsfw: false,
        governance: { type: "autocracy" },
        physics_rules: { magic_exists: true, magic_system: "hard", tech_level: "medieval" },
        society_rules: { class_system: "rigid", economy_type: "feudal" },
        content_rules: { violence_level: "graphic", romance_level: "fade_to_black", nsfw_allowed: false },
        tone_rules: { primary_tone: "grimdark", stakes_level: "personal", moral_complexity: "grey" },
        player_count: 42,
      },
      {
        id: "demo-willowmere",
        slug: "willowmere",
        name: "Willowmere",
        tagline: "A cozy corner of the realm",
        description: "Low-stakes wholesome fantasy focused on community, crafting, and found family.",
        creator_id: "system",
        is_public: true,
        realm: "fantasy",
        is_nsfw: false,
        governance: { type: "democracy" },
        physics_rules: { magic_exists: true, magic_system: "soft", tech_level: "medieval" },
        society_rules: { class_system: "fluid", economy_type: "mercantile" },
        content_rules: { violence_level: "mild", romance_level: "fade_to_black", nsfw_allowed: false },
        tone_rules: { primary_tone: "slice_of_life", stakes_level: "personal", moral_complexity: "grey" },
        player_count: 15,
      },
    ],
  },
  {
    realm: "scifi",
    display_name: "Sci-Fi Worlds",
    description: "Future technology, space exploration, and cyberpunk",
    world_count: 1,
    is_locked: false,
    worlds: [
      {
        id: "demo-neon",
        slug: "neon-sprawl",
        name: "Neon Sprawl",
        tagline: "Jack in. Fight back. Survive.",
        description: "Cyberpunk megacity where megacorps rule and hackers fight for freedom in the digital shadows.",
        creator_id: "system",
        is_public: true,
        realm: "scifi",
        is_nsfw: false,
        governance: { type: "council" },
        physics_rules: { magic_exists: false, tech_level: "futuristic" },
        society_rules: { class_system: "fluid", economy_type: "capitalist" },
        content_rules: { violence_level: "graphic", romance_level: "suggestive", nsfw_allowed: false },
        tone_rules: { primary_tone: "noir", stakes_level: "personal", moral_complexity: "grey" },
        player_count: 28,
      },
    ],
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

// Realm display names and icons
const REALM_INFO: Record<string, { name: string; icon: string }> = {
  fantasy: { name: "Fantasy", icon: "⚔" },
  scifi: { name: "Sci-Fi", icon: "◈" },
  horror: { name: "Horror", icon: "☠" },
  romance: { name: "Romance", icon: "♡" },
  mystery: { name: "Mystery", icon: "◎" },
  historical: { name: "Historical", icon: "⚜" },
  contemporary: { name: "Contemporary", icon: "▣" },
  thriller: { name: "Thriller", icon: "◆" },
};

// New Infinite Worlds browser - grouped by realm
function WorldBrowser({ realmGroups, onSelect, onBack, nsfwEnabled, nsfwAutoBlocked, onRequestNsfw }: {
  realmGroups: RealmGroup[];
  onSelect: (world: InfiniteWorld) => void;
  onBack: () => void;
  nsfwEnabled: boolean;
  nsfwAutoBlocked?: boolean;
  onRequestNsfw: () => void;
}) {
  const [expandedRealm, setExpandedRealm] = useState<string | null>(null);

  // Separate SFW and locked/NSFW realms
  const sfwRealms = realmGroups.filter(g => !g.is_locked);
  const nsfwRealms = realmGroups.filter(g => g.is_locked);

  // Get all SFW worlds flat
  const allSfwWorlds = sfwRealms.flatMap(g => g.worlds).filter(w => !w.is_nsfw || nsfwEnabled);

  // Show flat list if < 10 SFW worlds, otherwise group by realm
  const showFlat = allSfwWorlds.length < 10;

  const handleRealmClick = (realm: string, isLocked: boolean) => {
    if (isLocked && !nsfwEnabled) {
      onRequestNsfw();
      return;
    }
    setExpandedRealm(expandedRealm === realm ? null : realm);
  };

  const totalWorlds = realmGroups.reduce((sum, g) => {
    if (nsfwEnabled) return sum + g.world_count;
    return sum + g.worlds.filter(w => !w.is_nsfw).length;
  }, 0);

  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">CHOOSE YOUR REALM</span>
          <div className="text-[var(--mist)] text-[10px] tracking-widest">{totalWorlds} WORLDS AVAILABLE</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto">
          {/* World grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-fade-in">
            {/* SFW Worlds - flat list if < 10, otherwise grouped by realm */}
            {showFlat ? (
              // Flat list of all SFW worlds
              allSfwWorlds.map((world) => (
                <button
                  key={world.id}
                  onClick={() => onSelect(world)}
                  className="w-full p-4 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-left hover:border-[var(--amber-dim)] hover:bg-[var(--void)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[var(--amber)] font-bold">{world.name}</span>
                    {world.is_nsfw && (
                      <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                    )}
                  </div>
                  <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{world.tagline}</p>
                  {world.player_count > 0 && (
                    <div className="mt-2 text-[var(--mist)] text-[10px] tracking-wider">
                      {world.player_count} exploring
                    </div>
                  )}
                </button>
              ))
            ) : (
              // Grouped by realm
              sfwRealms.map((group) => {
                const info = REALM_INFO[group.realm] || { name: group.display_name, icon: "◇" };
                const filteredWorlds = group.worlds.filter(w => !w.is_nsfw || nsfwEnabled);
                const isExpanded = expandedRealm === group.realm;

                return (
                  <div key={group.realm} className={`realm-group ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}`}>
                    {/* Realm Header */}
                    <button
                      onClick={() => handleRealmClick(group.realm, false)}
                      className="w-full p-4 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg flex items-center justify-between hover:border-[var(--amber-dim)] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-[var(--amber)] opacity-80 group-hover:opacity-100 transition-opacity">{info.icon}</span>
                        <div className="text-left">
                          <span className="text-[var(--amber)] font-bold block">{group.display_name}</span>
                          <span className="text-[var(--mist)] text-xs">{filteredWorlds.length} worlds</span>
                        </div>
                      </div>
                      <span className="text-[var(--mist)] text-lg">{isExpanded ? "−" : "+"}</span>
                    </button>

                    {/* Expanded World List */}
                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredWorlds.map((world) => (
                          <button
                            key={world.id}
                            onClick={() => onSelect(world)}
                            className="w-full p-4 bg-[var(--void)] border border-[var(--stone)] rounded-lg text-left hover:border-[var(--amber-dim)] hover:bg-[var(--shadow)] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-[var(--amber)] font-bold">{world.name}</span>
                              {world.is_nsfw && (
                                <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                              )}
                            </div>
                            <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{world.tagline}</p>
                            {world.player_count > 0 && (
                              <div className="mt-2 text-[var(--mist)] text-[10px] tracking-wider">
                                {world.player_count} exploring
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* NSFW/Locked Realms Section */}
            {nsfwRealms.length > 0 && (
              <>
                {nsfwEnabled ? (
                  // Show NSFW realms normally when unlocked
                  nsfwRealms.map((group) => {
                    const info = REALM_INFO[group.realm] || { name: group.display_name, icon: "◇" };
                    const isExpanded = expandedRealm === group.realm;

                    return (
                      <div key={group.realm} className={`realm-group ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}`}>
                        <button
                          onClick={() => handleRealmClick(group.realm, false)}
                          className="w-full p-4 bg-[var(--shadow)] border border-[var(--crimson)]/30 rounded-lg flex items-center justify-between hover:border-[var(--crimson)] transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl text-[var(--crimson)] opacity-80 group-hover:opacity-100 transition-opacity">{info.icon}</span>
                            <div className="text-left">
                              <span className="text-[var(--crimson)] font-bold block">{group.display_name}</span>
                              <span className="text-[var(--mist)] text-xs">{group.world_count} worlds · 18+</span>
                            </div>
                          </div>
                          <span className="text-[var(--mist)] text-lg">{isExpanded ? "−" : "+"}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.worlds.map((world) => (
                              <button
                                key={world.id}
                                onClick={() => onSelect(world)}
                                className="w-full p-4 bg-[var(--void)] border border-[var(--stone)] rounded-lg text-left hover:border-[var(--crimson)] hover:bg-[var(--shadow)] transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-[var(--amber)] font-bold">{world.name}</span>
                                  <span className="text-[var(--crimson)] text-[10px] tracking-wider">18+</span>
                                </div>
                                <p className="text-[var(--text-dim)] text-sm italic line-clamp-2">{world.tagline}</p>
                                {world.player_count > 0 && (
                                  <div className="mt-2 text-[var(--mist)] text-[10px] tracking-wider">
                                    {world.player_count} exploring
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : nsfwAutoBlocked ? (
                  // Auto-blocked after 3 rejections
                  <div className="w-full p-4 bg-[var(--shadow)] border border-[var(--stone)] rounded-lg flex items-start gap-3 opacity-40">
                    <span className="text-xl leading-none mt-0.5">🚫</span>
                    <div className="text-left">
                      <span className="text-[var(--mist)] font-bold block">Adults Only</span>
                      <span className="text-[var(--slate)] text-xs">{nsfwRealms.reduce((sum, g) => sum + g.world_count, 0)} worlds · Blocked (enable in Settings)</span>
                    </div>
                  </div>
                ) : (
                  // Locked NSFW section - tap to verify
                  <button
                    onClick={onRequestNsfw}
                    className="w-full p-4 bg-[var(--shadow)] border border-[var(--stone)] rounded-lg flex items-start gap-3 hover:border-[var(--mist)] transition-colors opacity-60"
                  >
                    <span className="text-xl leading-none mt-0.5">🔒</span>
                    <div className="text-left">
                      <span className="text-[var(--mist)] font-bold block">Adults Only</span>
                      <span className="text-[var(--slate)] text-xs">{nsfwRealms.reduce((sum, g) => sum + g.world_count, 0)} worlds · Tap to verify age</span>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
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

// Infinite Worlds character selection view
function InfiniteCampfireView({ campfire, onSelect, onBack, loading, onCreateOwn }: {
  campfire: InfiniteCampfireResponse;
  onSelect: (character: InfiniteCampfireCharacter) => void;
  onBack: () => void;
  loading: boolean;
  onCreateOwn?: () => void;
}) {
  return (
    <main className="h-dvh flex flex-col bg-atmospheric pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center gap-1 hover:text-[var(--text)] transition-colors">
          <span className="text-lg">‹</span> Back
        </button>
        <div className="text-center">
          <span className="text-[var(--amber)] font-bold tracking-wider">{campfire.world_name}</span>
        </div>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Intro narrative */}
        <div className="p-6 border-b border-[var(--slate)] bg-gradient-to-b from-[var(--shadow)] to-transparent">
          <div className="max-w-2xl mx-auto">
            <p className="text-[var(--text)] leading-relaxed whitespace-pre-wrap text-sm md:text-base text-center">
              {campfire.intro_text}
            </p>
          </div>
        </div>

        {/* Character selection */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-5xl mx-auto">
            {campfire.characters.length === 0 && !onCreateOwn ? (
              <div className="text-center py-8">
                <p className="text-[var(--mist)]">No characters available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-fade-in">
                {/* Create Your Own option */}
                {onCreateOwn && (
                  <button
                    onClick={onCreateOwn}
                    disabled={loading}
                    className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed group border-dashed"
                  >
                    <div className="flex items-center justify-center gap-4 py-4">
                      <div className="w-14 h-14 rounded-lg border-2 border-dashed border-[var(--slate)] flex items-center justify-center text-[var(--amber)] text-3xl group-hover:border-[var(--amber-dim)] transition-colors">
                        +
                      </div>
                      <div>
                        <span className="text-[var(--amber)] font-bold text-lg group-hover:text-[var(--text)] transition-colors">Create Your Own</span>
                        <p className="text-[var(--mist)] text-sm">Design a custom character</p>
                      </div>
                    </div>
                  </button>
                )}

                {campfire.characters.filter(c => c.is_playable).map((char) => (
                  <button
                    key={char.id}
                    onClick={() => onSelect(char)}
                    disabled={loading}
                    className="character-card w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Character portrait placeholder */}
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--slate)] to-[var(--stone)] flex items-center justify-center text-[var(--amber)] text-2xl shrink-0 group-hover:from-[var(--amber-dim)] group-hover:to-[var(--slate)] transition-all">
                        {char.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[var(--amber)] font-bold text-lg group-hover:text-[var(--text)] transition-colors">{char.name}</span>
                          {char.occupation && (
                            <span className="text-[var(--arcane)] text-[10px] tracking-wider uppercase shrink-0 mt-1">
                              {char.occupation}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-dim)] text-sm mb-2 line-clamp-2">
                          {char.physical_summary}
                        </p>
                        {char.backstory_hook && (
                          <p className="text-[var(--mist)] text-xs italic line-clamp-2">
                            {char.backstory_hook}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Personality tags */}
                    {char.personality_summary && (
                      <div className="mt-3 pt-3 border-t border-[var(--slate)] flex items-center justify-between">
                        <span className="text-[var(--mist)] text-[10px] tracking-wider uppercase">
                          {char.personality_summary}
                        </span>
                        <span className="text-[var(--amber)] text-sm group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
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
  const [realmGroups, setRealmGroups] = useState<RealmGroup[]>([]);
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
  const [billingOpen, setBillingOpen] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // NSFW / Age gate state
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [nsfwVerified, setNsfwVerified] = useState(false);
  const [nsfwRejections, setNsfwRejections] = useState(0);
  const [nsfwAutoBlocked, setNsfwAutoBlocked] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageGateCallback, setAgeGateCallback] = useState<(() => void) | null>(null);
  const [pendingNsfwCommand, setPendingNsfwCommand] = useState<string | null>(null);

  // Session state
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Influence & Leaderboard state
  const [influence, setInfluence] = useState<PlayerInfluence | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Character creation state
  const [charCreatorOpen, setCharCreatorOpen] = useState(false);
  const [charCreatorLoading, setCharCreatorLoading] = useState(false);

  // Location footprints state
  const [footprints, setFootprints] = useState<LocationFootprint[]>([]);
  const [loadingFootprints, setLoadingFootprints] = useState(false);
  const [currentLocationEntityId, setCurrentLocationEntityId] = useState<string | null>(null);

  // Player stats modal state
  const [playerStatsOpen, setPlayerStatsOpen] = useState(false);
  const [playerWorldStats, setPlayerWorldStats] = useState<PlayerWorldStats | null>(null);

  // Entity timeline modal state
  const [entityTimelineOpen, setEntityTimelineOpen] = useState(false);
  const [entityTimelineId, setEntityTimelineId] = useState<string | null>(null);
  const [entityTimelineName, setEntityTimelineName] = useState<string | null>(null);

  // World templates modal state
  const [worldTemplatesOpen, setWorldTemplatesOpen] = useState(false);

  // Entity generation modal state
  const [entityGenerationOpen, setEntityGenerationOpen] = useState(false);

  // World creation modal state
  const [worldCreationOpen, setWorldCreationOpen] = useState(false);
  const [selectedWorldTemplate, setSelectedWorldTemplate] = useState<WorldTemplate | null>(null);

  // Bounty system state
  const [bountyBoardOpen, setBountyBoardOpen] = useState(false);
  const [playerRecordOpen, setPlayerRecordOpen] = useState(false);

  // Auth modal state (magic link login)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<AccountPromptReason | undefined>();
  const [authModalIncentive, setAuthModalIncentive] = useState<string | undefined>();
  const [savePromptDismissed, setSavePromptDismissed] = useState(false);

  // ========== INITIALIZATION ==========

  // Load NSFW preferences from localStorage (fallback for demo mode)
  useEffect(() => {
    const stored = localStorage.getItem("textlands_nsfw");
    if (stored) {
      try {
        const { enabled, verified, rejections, autoBlocked } = JSON.parse(stored);
        setNsfwEnabled(!!enabled);
        setNsfwVerified(!!verified);
        setNsfwRejections(rejections || 0);
        setNsfwAutoBlocked(!!autoBlocked);
      } catch {
        // Invalid stored data, use defaults
      }
    }
  }, []);

  // Cache NSFW preferences to localStorage (for offline/demo fallback)
  useEffect(() => {
    localStorage.setItem("textlands_nsfw", JSON.stringify({
      enabled: nsfwEnabled,
      verified: nsfwVerified,
      rejections: nsfwRejections,
      autoBlocked: nsfwAutoBlocked,
    }));
  }, [nsfwEnabled, nsfwVerified, nsfwRejections, nsfwAutoBlocked]);

  useEffect(() => {
    async function init() {
      const healthy = await api.checkHealth();

      if (!healthy) {
        // API unavailable - demo mode
        setIsDemo(true);
        setRealmGroups(DEMO_REALM_GROUPS);
        setGenres(DEMO_GENRES);
        setWorldsByGenre(DEMO_WORLDS_BY_GENRE);
        setPhase("landing");
        return;
      }

      // Fetch session, worlds, and preferences in parallel
      try {
        const [session, groupedData, prefs] = await Promise.all([
          api.getSession().catch(() => null),
          api.getInfiniteWorldsGrouped(),
          api.getPreferences().catch(() => ({ show_reasoning: false, show_on_failure: true })),
        ]);

        if (session) {
          setPlayerId(session.player_id);

          // Fetch server-side NSFW preferences
          try {
            const nsfwPrefs = await api.getPlayerPreferences(session.player_id);
            setNsfwEnabled(nsfwPrefs.nsfw_enabled);
            setNsfwVerified(nsfwPrefs.age_verified);
            setNsfwRejections(nsfwPrefs.rejection_count);
            setNsfwAutoBlocked(nsfwPrefs.auto_blocked);
          } catch {
            // Keep localStorage values as fallback
          }
        }
        setRealmGroups(groupedData);
        setShowReasoning(prefs.show_reasoning);
      } catch {
        // Fall back to demo mode on error
        setIsDemo(true);
        setRealmGroups(DEMO_REALM_GROUPS);
        setGenres(DEMO_GENRES);
        setWorldsByGenre(DEMO_WORLDS_BY_GENRE);
      }

      setPhase("landing");
    }

    init();
  }, []);

  // ========== AGE GATE HANDLERS ==========

  // Request age verification (for settings or realm access)
  const requestAgeVerification = useCallback((onSuccess?: () => void) => {
    if (nsfwAutoBlocked) {
      // User has rejected 3 times - only settings can re-enable
      return;
    }
    setAgeGateCallback(() => onSuccess || null);
    setShowAgeGate(true);
  }, [nsfwAutoBlocked]);

  // Called when backend detects NSFW content in a non-NSFW world
  const promptNsfwEncounter = useCallback(() => {
    if (nsfwEnabled || nsfwAutoBlocked) {
      // Already enabled or auto-blocked
      return nsfwEnabled;
    }
    // Show age gate for in-game NSFW encounter
    requestAgeVerification();
    return false;
  }, [nsfwEnabled, nsfwAutoBlocked, requestAgeVerification]);

  const handleAgeVerified = useCallback(async () => {
    setNsfwVerified(true);
    setNsfwEnabled(true);
    setNsfwRejections(0); // Reset rejections on acceptance
    setShowAgeGate(false);

    // Sync with server if we have a player ID
    if (playerId && !isDemo) {
      try {
        await api.handleNsfwPrompt(playerId, true);
      } catch {
        // Server sync failed, local state already updated
      }
    }

    // Retry pending NSFW command if any
    if (pendingNsfwCommand) {
      const commandToRetry = pendingNsfwCommand;
      setPendingNsfwCommand(null);
      // Retry after a brief delay to let state update
      setTimeout(() => {
        // Re-run the command - it will now succeed since nsfw is enabled
        api.doAction(commandToRetry).then((result) => {
          if (!result.nsfw_blocked) {
            setEntries((prev) => [
              ...prev,
              log("narrative", result.narrative, undefined, result.reasoning, result.action_id),
            ]);
            if (result.suggested_actions?.length) {
              setEntries((prev) => [...prev, log("system", `Try: ${result.suggested_actions.join(", ")}`)]);
            }
          }
        }).catch(() => {
          // Ignore retry errors
        });
      }, 100);
    }

    if (ageGateCallback) {
      ageGateCallback();
      setAgeGateCallback(null);
    }
  }, [ageGateCallback, pendingNsfwCommand, playerId, isDemo]);

  const handleAgeGateCancelled = useCallback(async () => {
    setShowAgeGate(false);
    setAgeGateCallback(null);

    // Track rejection (for in-game prompts, not settings)
    const newRejections = nsfwRejections + 1;
    setNsfwRejections(newRejections);

    if (newRejections >= 3) {
      // Auto-block after 3 rejections
      setNsfwAutoBlocked(true);
    }

    // Sync with server if we have a player ID
    if (playerId && !isDemo) {
      try {
        await api.handleNsfwPrompt(playerId, false);
      } catch {
        // Server sync failed, local state already updated
      }
    }
  }, [nsfwRejections, playerId, isDemo]);

  const handleNsfwToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Re-enabling clears auto-block
      setNsfwAutoBlocked(false);
      setNsfwRejections(0);
    }
    setNsfwEnabled(enabled);

    // Sync with server if we have a player ID
    if (playerId && !isDemo) {
      try {
        await api.updatePlayerPreferences(playerId, {
          nsfw_enabled: enabled,
          auto_blocked: enabled ? false : undefined,
          rejection_count: enabled ? 0 : undefined,
        });
      } catch {
        // Server sync failed, local state already updated
      }
    }
  }, [playerId, isDemo]);

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

    // For non-demo mode, start session via the API
    if (!isDemo) {
      try {
        const { session, opening_narrative } = await api.startSession({
          world_id: selectedWorld.id,
          entity_id: char.id,
        });

        setCharacter({
          id: session.character_id || char.id,
          name: session.character_name || char.name,
          race: "Unknown",
          character_class: char.occupation || "Wanderer",
          stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
          current_zone_id: null,
          inventory: [],
          equipped: {},
        });

        setZoneName(session.world_name || selectedWorld.name);
        setEntries([
          log("system", `Entering ${session.world_name || selectedWorld.name}`),
          log("narrative", opening_narrative || infiniteCampfire.intro_text),
          log("system", "Type 'help' for commands, or just describe what you want to do"),
        ]);
        setPhase("game");
      } catch (err) {
        // If session start fails, fall back to intro text
        console.warn("Session start failed:", err);
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
          log("narrative", infiniteCampfire.intro_text),
          log("system", "Type 'help' for commands, or just describe what you want to do"),
        ]);
        setPhase("game");
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
        log("system", "Type 'help' for commands, or just describe what you want to do"),
      ]);
      setPhase("game");
    }

    setProcessing(false);
  };

  // Create custom character from modal
  const handleCreateCharacter = async (request: api.CreateCharacterRequest) => {
    if (!selectedWorld) return;

    setCharCreatorLoading(true);
    try {
      const result = await api.createCampfireCharacter(selectedWorld.id, request);
      setCharCreatorOpen(false);
      // Select the newly created character
      await selectInfiniteCharacter(result.character);
    } catch (err) {
      throw err; // Let modal handle error display
    } finally {
      setCharCreatorLoading(false);
    }
  };

  // Fetch location footprints
  const fetchFootprints = async (locationEntityId: string) => {
    if (isDemo) return;
    setLoadingFootprints(true);
    setCurrentLocationEntityId(locationEntityId);
    try {
      const data = await api.getLocationFootprints(locationEntityId);
      setFootprints(data);
    } catch {
      setFootprints([]);
    }
    setLoadingFootprints(false);
  };

  // Leave message at current location
  const handleLeaveMessage = async (message: string) => {
    if (!currentLocationEntityId || isDemo) return;
    await api.leaveLocationMessage(currentLocationEntityId, message);
    // Refresh footprints to show new message
    await fetchFootprints(currentLocationEntityId);
  };

  // Open player stats modal
  const handleOpenPlayerStats = async () => {
    if (!selectedWorld || !playerId || isDemo) return;
    setPlayerStatsOpen(true);
    try {
      const stats = await api.getPlayerWorldStats(selectedWorld.id, playerId);
      setPlayerWorldStats(stats);
    } catch {
      setPlayerWorldStats(null);
    }
  };

  // Open entity timeline modal
  const handleOpenEntityTimeline = (entityId: string, entityName?: string) => {
    setEntityTimelineId(entityId);
    setEntityTimelineName(entityName || null);
    setEntityTimelineOpen(true);
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
        addLog("system", "Commands: look, go <dir>, talk <npc>, leave message \"text\", or describe what you want to do naturally");
      } else if (action === "leave" && rest[0] === "message") {
        // Leave a message at current location
        const messageMatch = command.match(/leave\s+message\s+["'](.+)["']/i);
        if (messageMatch) {
          // TODO: When backend provides location_entity_id, call api.leaveLocationMessage
          addLog("system", "You carve your message into the surroundings...");
          addLog("narrative", `"${messageMatch[1]}" - Your words will be seen by future travelers.`);
        } else {
          addLog("system", "Usage: leave message \"your message here\"");
        }
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

        // Check for NSFW block
        if (result.nsfw_blocked) {
          // Action was blocked due to NSFW content
          if (nsfwAutoBlocked) {
            // User has permanently blocked NSFW - show message
            addLog("system", "This action requires adult content to be enabled. You can change this in Settings.");
          } else {
            // Prompt for age verification, retry if accepted
            setPendingNsfwCommand(command);
            addLog("narrative", result.narrative);
            requestAgeVerification(() => {
              // Will retry command after verification
            });
          }
        } else if (result.requires_account) {
          // Blocking prompt - must create account to continue
          addLog("narrative", result.narrative);
          setAuthModalReason(result.account_prompt_reason);
          setAuthModalIncentive(result.account_prompt_incentive);
          setShowAuthModal(true);
        } else {
          // Normal response - add narrative with reasoning if available
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

          // Update location and fetch footprints if location changed
          if (result.location_entity_id) {
            fetchFootprints(result.location_entity_id);
            if (result.location_name) {
              setZoneName(result.location_name);
            }
          }

          // Track examined entity for timeline access
          if (result.examined_entity_id) {
            setEntityTimelineId(result.examined_entity_id);
            setEntityTimelineName(result.examined_entity_name || null);
          }

          // Handle NPC kill consequences
          if (result.state_changes?.npc_killed) {
            const kill = result.state_changes.npc_killed;
            if (kill.bounty_created) {
              addLog("system", `⚠ BOUNTY PLACED: ${kill.bounty_created.amount}g for ${kill.bounty_created.reason}`);
            }
            if (kill.reputation_change && kill.reputation_change < 0) {
              addLog("system", `Your reputation has suffered...`);
            }
          }

          if (result.error) {
            addLog("system", result.error);
          }

          // Soft prompt - dismissible save nudge (after 5 actions)
          if (result.show_save_prompt && !savePromptDismissed) {
            setAuthModalReason(undefined);
            setAuthModalIncentive(undefined);
            setShowAuthModal(true);
          }
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    setProcessing(false);
  }, [character, addLog, isDemo, nsfwAutoBlocked, requestAgeVerification, savePromptDismissed]);

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
      const result = await api.doAction(`initiate intimate moment with ${npcName}`);
      addLog("intimate", result.narrative);

      // Poll for scene state after action
      if (character) {
        const sceneResult = await api.getActiveScene(character.id);
        if (sceneResult.scene) {
          setNegotiating({
            npc_id: npcId,
            scene_id: sceneResult.scene.id,
            npc_name: npcName,
          });
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [isDemo, character, addLog]);

  const handleNegotiationComplete = useCallback(async (negotiation: NegotiationRequest) => {
    setProcessing(true);
    try {
      // Express negotiation as natural language
      const prefs = `proceed with ${negotiation.intensity} intensity as ${negotiation.player_role}`;
      const result = await api.doAction(prefs);
      setNegotiating(null);
      addLog("intimate", result.narrative);

      // Poll for updated scene state
      if (character) {
        const sceneResult = await api.getActiveScene(character.id);
        if (sceneResult.scene) {
          setActiveScene(sceneResult.scene);
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [character, addLog]);

  const handleNegotiationCancel = useCallback(() => {
    setNegotiating(null);
    addLog("system", "Scene cancelled.");
  }, [addLog]);

  const handleSceneAction = useCallback(async (action: string) => {
    if (!activeScene) return;

    setProcessing(true);
    try {
      const result = await api.doAction(action);
      addLog("intimate", result.narrative);

      // Poll for updated scene state
      if (character) {
        const sceneResult = await api.getActiveScene(character.id);
        if (sceneResult.scene) {
          setActiveScene(sceneResult.scene);
        } else {
          // Scene ended
          setActiveScene(null);
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
    setProcessing(false);
  }, [activeScene, character, addLog]);

  const handleSafeword = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await api.doAction("safeword - stop immediately");
      setActiveScene(null);
      addLog("system", result.narrative || "Scene ended safely.");
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
      setActiveScene(null);
    }
    setProcessing(false);
  }, [addLog]);

  const handleSceneComplete = useCallback(async (aftercareQuality: "minimal" | "standard" | "extended") => {
    setProcessing(true);
    try {
      const result = await api.doAction(`complete scene with ${aftercareQuality} aftercare`);
      setActiveScene(null);
      addLog("intimate", result.narrative);
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
      setActiveScene(null);
    }
    setProcessing(false);
  }, [addLog]);

  // ========== COMBAT HANDLERS (all actions flow through doAction) ==========

  const handleCombatAction = useCallback(async (
    action: "attack" | "defend" | "skill" | "item" | "flee",
    targetId?: string
  ) => {
    if (!activeCombat || !character) return;

    setProcessing(true);
    try {
      // Convert structured action to natural language
      const target = activeCombat.participants.find(p => p.id === targetId);
      const actionText = target ? `${action} ${target.name}` : action;
      const result = await api.doAction(actionText);

      setCombatNarrative(result.narrative);
      addLog("combat", result.narrative);

      // Check for death recovery prompt (guest died)
      if (result.requires_account) {
        setAuthModalReason(result.account_prompt_reason);
        setAuthModalIncentive(result.account_prompt_incentive);
        setShowAuthModal(true);
        setProcessing(false);
        return;
      }

      // Poll for updated combat state
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
      if (!activeScene && character) {
        api.getActiveScene(character.id).then((result) => {
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
  }, [phase, isDemo, activeScene, activeCombat, character, playerId]);

  // Fetch player influence on game start
  useEffect(() => {
    if (phase === "game" && !isDemo && playerId && selectedWorld) {
      api.getPlayerInfluence(selectedWorld.id, playerId)
        .then(setInfluence)
        .catch(() => setInfluence(null));
    }
  }, [phase, isDemo, playerId, selectedWorld]);

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
      <>
        <WorldBrowser
          realmGroups={realmGroups}
          onSelect={selectInfiniteWorld}
          onBack={() => setPhase("landing")}
          nsfwEnabled={nsfwEnabled}
          nsfwAutoBlocked={nsfwAutoBlocked}
          onRequestNsfw={() => requestAgeVerification()}
        />
        <AgeGateModal
          isOpen={showAgeGate}
          onConfirm={handleAgeVerified}
          onCancel={handleAgeGateCancelled}
        />
      </>
    );
  }

  /// New: Infinite Worlds campfire (character selection)
  if (phase === "infinite-campfire" && infiniteCampfire && selectedWorld) {
    return (
      <>
        <InfiniteCampfireView
          campfire={infiniteCampfire}
          onSelect={selectInfiniteCharacter}
          onBack={() => setPhase("worlds")}
          loading={processing}
          onCreateOwn={() => setCharCreatorOpen(true)}
        />
        <CharacterCreationModal
          isOpen={charCreatorOpen}
          onClose={() => setCharCreatorOpen(false)}
          onSubmit={handleCreateCharacter}
          worldName={selectedWorld.name}
          loading={charCreatorLoading}
        />
      </>
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
        nsfwEnabled={nsfwEnabled}
        onNsfwToggle={handleNsfwToggle}
        nsfwVerified={nsfwVerified}
        onRequestAgeVerification={() => requestAgeVerification()}
      />
      <AgeGateModal
        isOpen={showAgeGate}
        onConfirm={handleAgeVerified}
        onCancel={handleAgeGateCancelled}
      />
      <BillingPanel
        isOpen={billingOpen}
        onClose={() => setBillingOpen(false)}
        isDemo={isDemo}
      />
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        worldId={selectedWorld?.id || null}
        worldName={selectedWorld?.name}
        playerId={playerId}
        isDemo={isDemo}
      />
      <PlayerStatsModal
        isOpen={playerStatsOpen}
        onClose={() => setPlayerStatsOpen(false)}
        stats={playerWorldStats}
        influence={influence}
        worldName={selectedWorld?.name}
        onLeaderboardClick={() => {
          setPlayerStatsOpen(false);
          setLeaderboardOpen(true);
        }}
        isDemo={isDemo}
      />
      <EntityTimelineModal
        isOpen={entityTimelineOpen}
        onClose={() => {
          setEntityTimelineOpen(false);
          setEntityTimelineId(null);
          setEntityTimelineName(null);
        }}
        entityId={entityTimelineId}
        entityName={entityTimelineName || undefined}
        isDemo={isDemo}
      />
      <WorldTemplatesModal
        isOpen={worldTemplatesOpen}
        onClose={() => setWorldTemplatesOpen(false)}
        onSelectTemplate={(template) => {
          setSelectedWorldTemplate(template);
          setWorldTemplatesOpen(false);
          setWorldCreationOpen(true);
        }}
        isDemo={isDemo}
      />
      <WorldCreationModal
        isOpen={worldCreationOpen}
        onClose={() => {
          setWorldCreationOpen(false);
          setSelectedWorldTemplate(null);
        }}
        selectedTemplate={selectedWorldTemplate}
        isDemo={isDemo}
      />
      <EntityGenerationModal
        isOpen={entityGenerationOpen}
        onClose={() => setEntityGenerationOpen(false)}
        worldId={selectedWorld?.id || null}
        worldName={selectedWorld?.name}
        isDemo={isDemo}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // If it was a soft prompt (no reason), mark as dismissed
          if (!authModalReason) {
            setSavePromptDismissed(true);
          }
        }}
        reason={authModalReason}
        incentive={authModalIncentive}
      />
      <BountyBoard
        isOpen={bountyBoardOpen}
        onClose={() => setBountyBoardOpen(false)}
        worldId={selectedWorld?.id || null}
        playerId={playerId}
        isDemo={isDemo}
      />
      <PlayerRecord
        isOpen={playerRecordOpen}
        onClose={() => setPlayerRecordOpen(false)}
        worldId={selectedWorld?.id || null}
        playerId={playerId}
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
          {/* Wanted status indicator */}
          <div className="relative hidden sm:block">
            <WantedStatus
              worldId={selectedWorld?.id || null}
              playerId={playerId}
              isDemo={isDemo}
              onViewBounties={() => setBountyBoardOpen(true)}
              onViewRecord={() => setPlayerRecordOpen(true)}
            />
          </div>
          {/* Influence badge - desktop only */}
          {influence && (
            <div className="hidden sm:block">
              <InfluenceBadge
                score={influence.trailblazer_score}
                rank={influence.rank}
                size="sm"
                onClick={() => setLeaderboardOpen(true)}
              />
            </div>
          )}
          <button
            onClick={() => setBountyBoardOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--crimson)] transition-colors text-xs hidden sm:block"
            title="Bounty Board"
          >
            ☠
          </button>
          <button
            onClick={() => setEntityGenerationOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title="Forge - Create Entities"
          >
            +
          </button>
          <button
            onClick={() => setBillingOpen(true)}
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors text-xs hidden sm:block"
            title="Account & Tokens"
          >
            $
          </button>
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
      {!activeScene && !activeCombat && (
        <MobileStats
          character={character}
          zoneName={zoneName}
          influence={influence}
          onLeaderboardClick={() => setLeaderboardOpen(true)}
        />
      )}

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
            <QuickActions
              onCommand={handleCommand}
              disabled={processing}
              onTimelineClick={() => setEntityTimelineOpen(true)}
              hasExaminedEntity={!!entityTimelineId}
              onForgeClick={() => setEntityGenerationOpen(true)}
            />
            <CommandInput
              onSubmit={handleCommand}
              disabled={processing}
              placeholder={processing ? "..." : "What do you do?"}
            />
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <CharacterPanel
            character={character}
            zoneName={zoneName}
            influence={influence}
            onLeaderboardClick={() => setLeaderboardOpen(true)}
            onStatsClick={handleOpenPlayerStats}
            footprints={footprints}
            onLeaveMessage={handleLeaveMessage}
            loadingFootprints={loadingFootprints}
          />
        </div>
      </div>
    </main>
  );
}
