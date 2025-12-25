"use client";

import { useState, useCallback } from "react";
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

const INITIAL_LOG: GameLogEntry[] = [
  log("system", "Welcome to Textlands"),
  log("narrative", "You stand at the crossroads. The wind carries whispers of adventure. To the north, ancient city spires. East, dark forests. South, distant mountains. West, the glint of water."),
  log("system", "Type 'help' for commands"),
];

export default function GamePage() {
  const [character] = useState<Character | null>(DEMO_CHARACTER);
  const [entries, setEntries] = useState<GameLogEntry[]>(INITIAL_LOG);
  const [zoneName, setZoneName] = useState("The Crossroads");
  const [processing, setProcessing] = useState(false);

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
        try {
          const result = await api.look(character.id);
          setZoneName(result.zone_name);
          addLog("narrative", result.description);
          if (result.exits.length) addLog("system", `Exits: ${result.exits.join(", ")}`);
        } catch {
          addLog("narrative", "The ancient crossroads stretches in all directions, worn stones marking countless footsteps.");
          addLog("system", "Exits: north, south, east, west");
        }
      } else if (["go", "move", "walk", "n", "s", "e", "w", "north", "south", "east", "west"].includes(action)) {
        let dir = args;
        if (["n", "north"].includes(action)) dir = "north";
        if (["s", "south"].includes(action)) dir = "south";
        if (["e", "east"].includes(action)) dir = "east";
        if (["w", "west"].includes(action)) dir = "west";

        if (!dir) {
          addLog("system", "Go where?");
        } else {
          try {
            const result = await api.move(character.id, dir);
            addLog("narrative", result.narrative);
            if (result.new_zone_name) setZoneName(result.new_zone_name);
          } catch {
            addLog("narrative", `You head ${dir}. The path stretches before you...`);
          }
        }
      } else if (["talk", "speak"].includes(action)) {
        if (!args) {
          addLog("system", "Talk to whom?");
        } else {
          try {
            const result = await api.talk(character.id, args);
            addLog("dialogue", result.dialogue, result.npc_name);
          } catch {
            addLog("dialogue", `"Greetings, traveler."`, args);
          }
        }
      } else if (["attack", "fight"].includes(action)) {
        addLog("combat", "You ready your weapon...");
        addLog("system", "No enemies nearby.");
      } else {
        try {
          const result = await api.performAction(character.id, command);
          addLog("narrative", result.narrative);
        } catch {
          addLog("narrative", "Nothing happens.");
        }
      }
    } catch (error) {
      addLog("system", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    setProcessing(false);
  }, [character, addLog]);

  return (
    <main className="h-dvh flex flex-col bg-[var(--void)]">
      {/* Header - compact on mobile */}
      <header className="bg-[var(--shadow)] border-b border-[var(--slate)] px-3 py-2 md:px-4 flex items-center justify-between shrink-0">
        <span className="text-[var(--amber)] font-bold tracking-wider text-sm md:text-base">TEXTLANDS</span>
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
