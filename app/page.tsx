"use client";

import { useState, useCallback, useEffect } from "react";
import { GameLog, CommandInput, CharacterPanel, QuickActions, MobileStats } from "@/components/game";
import { ThemePicker } from "@/components/ThemePicker";
import type { Character, GameLogEntry } from "@/types/game";
import * as api from "@/lib/api";

let logId = 0;
const log = (type: GameLogEntry["type"], content: string, actor?: string): GameLogEntry => ({
  id: `${++logId}`,
  type,
  content,
  timestamp: new Date(),
  actor,
});

const DEMO_CHARACTER: Character = {
  id: "demo-1",
  name: "Wanderer",
  race: "human",
  character_class: "adventurer",
  stats: { hp: 85, max_hp: 100, mana: 45, max_mana: 50, gold: 127, xp: 35, level: 3 },
  current_zone_id: "starting_zone",
  inventory: [],
  equipped: { weapon: "iron_sword" },
};

export default function GamePage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [entries, setEntries] = useState<GameLogEntry[]>([]);
  const [zoneName, setZoneName] = useState("...");
  const [processing, setProcessing] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const healthy = await api.checkHealth();

        if (!healthy) {
          // API unavailable - use demo mode
          setIsDemo(true);
          setCharacter(DEMO_CHARACTER);
          setZoneName("The Crossroads");
          setEntries([
            log("system", "Demo Mode - Backend unavailable"),
            log("narrative", "You stand at the crossroads. The wind carries whispers of adventure."),
            log("system", "Type 'help' for commands"),
          ]);
          setLoading(false);
          return;
        }

        // Start session (creates guest character if needed)
        const { session, message } = await api.startSession();

        if (session.character_id && session.character_name) {
          // Create character object from session
          // We'll get full stats from the look command
          setCharacter({
            id: session.character_id,
            name: session.character_name,
            race: "human",
            character_class: "adventurer",
            stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50, gold: 0, xp: 0, level: 1 },
            current_zone_id: null,
            inventory: [],
            equipped: {},
          });

          setEntries([
            log("system", session.is_guest ? "Guest Session" : "Welcome back!"),
            log("narrative", message),
            log("system", "Type 'look' to see your surroundings, or 'help' for commands"),
          ]);

          // Auto-look to get initial zone info
          try {
            const lookResult = await api.look(session.character_id);
            setZoneName(lookResult.zone_name);
            setEntries(prev => [...prev, log("narrative", lookResult.description)]);
            if (lookResult.exits.length) {
              setEntries(prev => [...prev, log("system", `Exits: ${lookResult.exits.join(", ")}`)]);
            }
          } catch {
            setZoneName("Unknown");
          }
        }
      } catch (error) {
        // Fallback to demo on any error
        console.error("Session init failed:", error);
        setIsDemo(true);
        setCharacter(DEMO_CHARACTER);
        setZoneName("The Crossroads");
        setEntries([
          log("system", "Demo Mode - Connection failed"),
          log("narrative", "You stand at the crossroads. The wind carries whispers of adventure."),
          log("system", "Type 'help' for commands"),
        ]);
      }

      setLoading(false);
    }

    initSession();
  }, []);

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
      if (action === "help") {
        addLog("system", "Commands: look, go <dir>, talk <npc>, attack, inventory, stats, or try anything");
      } else if (action === "stats") {
        const { stats: s } = character;
        addLog("system", `${character.name} - Lv.${s.level} ${character.race} ${character.character_class}\nHP: ${s.hp}/${s.max_hp} | MP: ${s.mana}/${s.max_mana} | Gold: ${s.gold} | XP: ${s.xp}`);
      } else if (["inventory", "inv", "i"].includes(action)) {
        addLog("system", character.inventory.length ? `Inventory: ${character.inventory.join(", ")}` : "Your pack is empty.");
      } else if (["look", "l"].includes(action)) {
        if (isDemo) {
          addLog("narrative", "The ancient crossroads stretches in all directions, worn stones marking countless footsteps.");
          addLog("system", "Exits: north, south, east, west");
        } else {
          const result = await api.look(character.id);
          setZoneName(result.zone_name);
          addLog("narrative", result.description);
          if (result.exits.length) addLog("system", `Exits: ${result.exits.join(", ")}`);
        }
      } else if (["go", "move", "walk", "n", "s", "e", "w", "north", "south", "east", "west"].includes(action)) {
        let dir = args;
        if (["n", "north"].includes(action)) dir = "north";
        if (["s", "south"].includes(action)) dir = "south";
        if (["e", "east"].includes(action)) dir = "east";
        if (["w", "west"].includes(action)) dir = "west";

        if (!dir) {
          addLog("system", "Go where?");
        } else if (isDemo) {
          addLog("narrative", `You head ${dir}. The path stretches before you...`);
        } else {
          const result = await api.move(character.id, dir);
          addLog("narrative", result.narrative);
          if (result.new_zone_name) setZoneName(result.new_zone_name);
        }
      } else if (["talk", "speak"].includes(action)) {
        if (!args) {
          addLog("system", "Talk to whom?");
        } else if (isDemo) {
          addLog("dialogue", `"Greetings, traveler."`, args);
        } else {
          const result = await api.talk(character.id, args);
          addLog("dialogue", result.dialogue, result.npc_name);
        }
      } else if (["attack", "fight"].includes(action)) {
        addLog("combat", "You ready your weapon...");
        addLog("system", "No enemies nearby.");
      } else {
        if (isDemo) {
          addLog("narrative", "Nothing happens.");
        } else {
          const result = await api.performAction(character.id, command);
          addLog("narrative", result.narrative);
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    setProcessing(false);
  }, [character, addLog, isDemo]);

  // Loading state
  if (loading) {
    return (
      <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)]">
        <div className="text-[var(--amber)] font-bold tracking-wider text-lg mb-4">TEXTLANDS</div>
        <div className="text-[var(--mist)] text-sm animate-pulse">Connecting...</div>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col bg-[var(--void)]">
      {/* Header - compact on mobile, handles top safe area */}
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

      {/* Mobile stats bar - visible only on mobile */}
      <MobileStats character={character} zoneName={zoneName} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Game log - full width on mobile */}
        <div className="flex-1 flex flex-col min-w-0">
          <GameLog entries={entries} />

          {/* Quick actions - mobile only */}
          <QuickActions
            onCommand={handleCommand}
            disabled={processing}
          />

          <CommandInput
            onSubmit={handleCommand}
            disabled={processing}
            placeholder={processing ? "..." : "What do you do?"}
          />
        </div>

        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <CharacterPanel character={character} zoneName={zoneName} />
        </div>
      </div>
    </main>
  );
}
