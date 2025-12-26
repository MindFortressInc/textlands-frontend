"use client";

import { useState, useCallback, useEffect } from "react";
import { GameLog, CommandInput, CharacterPanel, QuickActions, MobileStats } from "@/components/game";
import { ThemePicker } from "@/components/ThemePicker";
import type { Character, GameLogEntry, Genre, World, CampfireResponse, CharacterOption } from "@/types/game";
import * as api from "@/lib/api";

// ========== HELPERS ==========

let logId = 0;
const log = (type: GameLogEntry["type"], content: string, actor?: string): GameLogEntry => ({
  id: `${++logId}`,
  type,
  content,
  timestamp: new Date(),
  actor,
});

// ========== DEMO DATA ==========

const DEMO_GENRES: Genre[] = [
  { id: "fantasy", name: "Fantasy", description: "Swords, sorcery & dragons", world_count: 12 },
  { id: "scifi", name: "Sci-Fi", description: "Space & technology", world_count: 10 },
  { id: "horror", name: "Horror", description: "Fear & the unknown", world_count: 8 },
  { id: "mystery", name: "Mystery", description: "Puzzles & intrigue", world_count: 11 },
  { id: "western", name: "Western", description: "Frontier & outlaws", world_count: 9 },
  { id: "romance", name: "Romance", description: "Love & drama", world_count: 10 },
  { id: "historical", name: "Historical", description: "Past eras", world_count: 14 },
  { id: "urban", name: "Urban Fantasy", description: "Magic in modern times", world_count: 14 },
];

const DEMO_WORLDS: World[] = [
  { id: "demo-crossroads", name: "The Crossroads", tagline: "Where all paths converge", genre_id: "fantasy" },
  { id: "demo-elderwood", name: "Elderwood", tagline: "Ancient forest of whispers", genre_id: "fantasy" },
  { id: "demo-ironhold", name: "Ironhold", tagline: "A fortress city besieged", genre_id: "fantasy" },
];

const DEMO_CAMPFIRE: CampfireResponse = {
  world: {
    id: "demo-crossroads",
    name: "The Crossroads",
    tagline: "Where all paths converge",
    description: "A mystical nexus where travelers from all realms meet.",
    genre_id: "fantasy",
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

type AppPhase = "loading" | "landing" | "genres" | "worlds" | "campfire" | "game";

// ========== INLINE VIEW COMPONENTS ==========

function LoadingView() {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)]">
      <div className="text-[var(--amber)] font-bold tracking-wider text-lg mb-4">TEXTLANDS</div>
      <div className="text-[var(--mist)] text-sm animate-pulse">Connecting...</div>
    </main>
  );
}

function LandingView({ onEnter, isDemo }: { onEnter: () => void; isDemo: boolean }) {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4 pt-[max(1rem,env(safe-area-inset-top))] animate-fade-in">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-[var(--amber)] text-2xl md:text-4xl font-bold tracking-wider">
          TEXTLANDS
        </h1>
        <p className="text-[var(--text-dim)] text-sm md:text-base">
          Choose your world. Become your character.
        </p>
        {isDemo && (
          <p className="text-[var(--crimson)] text-xs uppercase tracking-wide">Demo Mode</p>
        )}
        <button
          onClick={onEnter}
          className="quick-btn px-8 py-4 text-[var(--amber)] font-bold text-base md:text-lg min-h-[48px]"
        >
          Begin Your Journey
        </button>
      </div>
      <div className="absolute bottom-4 right-4 pb-[env(safe-area-inset-bottom)]">
        <ThemePicker />
      </div>
    </main>
  );
}

function GenreGrid({ genres, onSelect, onBack }: {
  genres: Genre[];
  onSelect: (genre: Genre) => void;
  onBack: () => void;
}) {
  return (
    <main className="h-dvh flex flex-col bg-[var(--void)] pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center">
          &larr; Back
        </button>
        <span className="text-[var(--amber)] font-bold tracking-wide">Choose a Genre</span>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onSelect(genre)}
              className="quick-btn p-4 text-left flex flex-col gap-2 min-h-[100px] md:min-h-[120px]"
            >
              <span className="text-[var(--amber)] font-bold text-sm md:text-base">{genre.name}</span>
              <span className="text-[var(--text-dim)] text-xs line-clamp-2">{genre.description}</span>
              <span className="text-[var(--mist)] text-[10px] mt-auto">
                {genre.world_count} worlds
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function WorldList({ genre, worlds, onSelect, onBack }: {
  genre: Genre;
  worlds: World[];
  onSelect: (world: World) => void;
  onBack: () => void;
}) {
  const filteredWorlds = worlds.filter(w => w.genre_id === genre.id);

  return (
    <main className="h-dvh flex flex-col bg-[var(--void)] pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center">
          &larr; Back
        </button>
        <span className="text-[var(--amber)] font-bold tracking-wide">{genre.name}</span>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-3 max-w-2xl mx-auto">
          {filteredWorlds.length === 0 ? (
            <p className="text-[var(--mist)] text-center py-8">No worlds available in this genre yet.</p>
          ) : (
            filteredWorlds.map((world) => (
              <button
                key={world.id}
                onClick={() => onSelect(world)}
                className="quick-btn w-full p-4 text-left min-h-[72px]"
              >
                <span className="text-[var(--amber)] font-bold block">{world.name}</span>
                <span className="text-[var(--text-dim)] text-sm mt-1 block">{world.tagline}</span>
              </button>
            ))
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
    <main className="h-dvh flex flex-col bg-[var(--void)] pt-[max(0.5rem,env(safe-area-inset-top))] animate-fade-in">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--slate)] shrink-0">
        <button onClick={onBack} className="text-[var(--mist)] text-sm min-w-[44px] min-h-[44px] flex items-center">
          &larr; Back
        </button>
        <span className="text-[var(--amber)] font-bold tracking-wide">{campfire.world.name}</span>
        <ThemePicker />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Intro narrative */}
        <div className="p-4 border-b border-[var(--slate)]">
          <p className="text-[var(--amber)] leading-relaxed whitespace-pre-wrap max-w-2xl mx-auto text-sm md:text-base">
            {campfire.intro_text}
          </p>
        </div>

        {/* Character selection */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-[var(--mist)] text-sm text-center mb-4">
            Choose your character
          </p>
          <div className="space-y-3 max-w-2xl mx-auto">
            {campfire.characters.map((char) => (
              <button
                key={char.id}
                onClick={() => onSelect(char)}
                disabled={loading}
                className="quick-btn w-full p-4 text-left min-h-[88px] disabled:opacity-50"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[var(--amber)] font-bold">{char.name}</span>
                  <span className="text-[var(--mist)] text-xs capitalize">
                    {char.race} {char.character_class}
                  </span>
                </div>
                <p className="text-[var(--text-dim)] text-sm mt-2 line-clamp-2">
                  {char.backstory}
                </p>
              </button>
            ))}
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

  // World selection state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [campfireData, setCampfireData] = useState<CampfireResponse | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  // Game state
  const [character, setCharacter] = useState<Character | null>(null);
  const [entries, setEntries] = useState<GameLogEntry[]>([]);
  const [zoneName, setZoneName] = useState("...");
  const [processing, setProcessing] = useState(false);

  // ========== INITIALIZATION ==========

  useEffect(() => {
    async function init() {
      const healthy = await api.checkHealth();

      if (!healthy) {
        // API unavailable - demo mode
        setIsDemo(true);
        setGenres(DEMO_GENRES);
        setWorlds(DEMO_WORLDS);
        setPhase("landing");
        return;
      }

      // Fetch genres
      try {
        const genreData = await api.getGenres();
        setGenres(genreData);
      } catch {
        setIsDemo(true);
        setGenres(DEMO_GENRES);
        setWorlds(DEMO_WORLDS);
      }

      setPhase("landing");
    }

    init();
  }, []);

  // ========== PHASE TRANSITIONS ==========

  const enterGenres = () => setPhase("genres");

  const selectGenre = async (genre: Genre) => {
    setSelectedGenre(genre);

    // Fetch worlds if not cached
    if (!isDemo && worlds.length === 0) {
      try {
        const worldData = await api.getWorlds();
        setWorlds(worldData);
      } catch {
        setWorlds(DEMO_WORLDS);
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
      } catch (error) {
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
        addLog("narrative", result.narrative);

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

  // ========== RENDER BY PHASE ==========

  if (phase === "loading") {
    return <LoadingView />;
  }

  if (phase === "landing") {
    return <LandingView onEnter={enterGenres} isDemo={isDemo} />;
  }

  if (phase === "genres") {
    return (
      <GenreGrid
        genres={genres}
        onSelect={selectGenre}
        onBack={() => setPhase("landing")}
      />
    );
  }

  if (phase === "worlds" && selectedGenre) {
    return (
      <WorldList
        genre={selectedGenre}
        worlds={worlds}
        onSelect={selectWorld}
        onBack={() => setPhase("genres")}
      />
    );
  }

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
      {/* Header */}
      <header className="bg-[var(--shadow)] border-b border-[var(--slate)] px-3 py-2 md:px-4 flex items-center justify-between shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--amber)] font-bold tracking-wider text-sm md:text-base">TEXTLANDS</span>
          {isDemo && <span className="text-[var(--crimson)] text-[10px] uppercase tracking-wide">Demo</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--mist)] text-xs hidden sm:block">{zoneName}</span>
          <ThemePicker />
        </div>
      </header>

      {/* Mobile stats bar */}
      <MobileStats character={character} zoneName={zoneName} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <GameLog entries={entries} />
          <QuickActions onCommand={handleCommand} disabled={processing} />
          <CommandInput
            onSubmit={handleCommand}
            disabled={processing}
            placeholder={processing ? "..." : "What do you do?"}
          />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <CharacterPanel character={character} zoneName={zoneName} />
        </div>
      </div>
    </main>
  );
}
