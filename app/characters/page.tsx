"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type {
  RosterCharacter,
  CharacterSlots,
  GraveyardEntry,
  AuthUser,
} from "@/lib/api";

function StatusBadge({ status }: { status: RosterCharacter["status"] }) {
  const styles = {
    active: "bg-[var(--arcane)]/20 text-[var(--arcane)] border-[var(--arcane)]/30",
    dead: "bg-[var(--crimson)]/20 text-[var(--crimson)] border-[var(--crimson)]/30",
    retired: "bg-[var(--mist)]/20 text-[var(--mist)] border-[var(--mist)]/30",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded border ${styles[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function CharacterCard({
  character,
  onRetire,
  onPlay,
}: {
  character: RosterCharacter;
  onRetire: () => void;
  onPlay: () => void;
}) {
  const [confirmRetire, setConfirmRetire] = useState(false);

  const hpPercent = character.max_hp
    ? Math.round((character.current_hp || 0) / character.max_hp * 100)
    : 0;

  return (
    <div className="bg-[var(--shadow)] rounded-lg border border-[var(--slate)] p-4 hover:border-[var(--amber)]/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[var(--amber)] font-bold">{character.character_name}</h3>
          <p className="text-[var(--mist)] text-sm">{character.occupation || "Adventurer"}</p>
        </div>
        <StatusBadge status={character.status} />
      </div>

      <div className="text-xs text-[var(--mist)] mb-3">
        <span className="text-[var(--text)]">{character.world_name}</span>
      </div>

      {character.status === "active" && character.max_hp && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[var(--mist)] mb-1">
            <span>HP</span>
            <span>{character.current_hp}/{character.max_hp}</span>
          </div>
          <div className="stat-bar hp-bar">
            <div className="stat-bar-fill" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>
      )}

      {character.status === "dead" && character.death_cause && (
        <div className="text-xs text-[var(--crimson)] mb-3">
          {character.death_cause}
        </div>
      )}

      {character.final_stats && (
        <div className="grid grid-cols-4 gap-2 text-xs text-center mb-4">
          <div>
            <div className="text-[var(--amber)]">{character.final_stats.level}</div>
            <div className="text-[var(--mist)]">Level</div>
          </div>
          <div>
            <div className="text-[var(--arcane)]">{character.final_stats.quests_completed}</div>
            <div className="text-[var(--mist)]">Quests</div>
          </div>
          <div>
            <div className="text-[var(--amber)]">{character.final_stats.gold.toLocaleString()}</div>
            <div className="text-[var(--mist)]">Gold</div>
          </div>
          <div>
            <div className="text-[var(--text)]">{Math.floor(character.final_stats.playtime_minutes / 60)}h</div>
            <div className="text-[var(--mist)]">Played</div>
          </div>
        </div>
      )}

      {character.status === "active" && (
        <div className="flex gap-2">
          <button
            onClick={onPlay}
            className="flex-1 px-3 py-2 rounded bg-[var(--amber)] text-[var(--void)] text-sm font-bold hover:bg-[var(--amber-dim)] transition-colors"
          >
            Play
          </button>
          {!confirmRetire ? (
            <button
              onClick={() => setConfirmRetire(true)}
              className="px-3 py-2 rounded border border-[var(--slate)] text-[var(--mist)] text-sm hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-colors"
            >
              Retire
            </button>
          ) : (
            <button
              onClick={onRetire}
              className="px-3 py-2 rounded bg-[var(--crimson)] text-white text-sm font-bold"
            >
              Confirm?
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GraveyardCard({ entry }: { entry: GraveyardEntry }) {
  return (
    <div className="bg-[var(--shadow)]/50 rounded-lg border border-[var(--slate)]/50 p-3 opacity-75">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-[var(--text)] font-medium">{entry.character_name}</h4>
          <p className="text-[var(--mist)] text-xs">{entry.occupation || "Adventurer"}</p>
        </div>
        <StatusBadge status={entry.status} />
      </div>
      <div className="text-xs text-[var(--mist)]">{entry.world_name}</div>
      {entry.death_cause && (
        <div className="text-xs text-[var(--crimson)] mt-1">{entry.death_cause}</div>
      )}
      {entry.final_stats && (
        <div className="flex gap-4 text-xs text-[var(--mist)] mt-2">
          <span>Lv.{entry.final_stats.level}</span>
          <span>{Math.floor(entry.final_stats.playtime_minutes / 60)}h played</span>
        </div>
      )}
    </div>
  );
}

function SlotIndicator({ slots }: { slots: CharacterSlots | null }) {
  if (!slots) return null;

  const usedPercent = (slots.used_slots / slots.max_slots) * 100;

  return (
    <div className="bg-[var(--shadow)] rounded-lg border border-[var(--slate)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--mist)]">Character Slots</span>
        <span className="text-sm">
          <span className="text-[var(--amber)]">{slots.used_slots}</span>
          <span className="text-[var(--mist)]"> / {slots.max_slots}</span>
        </span>
      </div>
      <div className="h-2 bg-[var(--void)] rounded overflow-hidden">
        <div
          className="h-full bg-[var(--amber)] transition-all"
          style={{ width: `${usedPercent}%` }}
        />
      </div>
      {!slots.is_plus && slots.available_slots <= 1 && (
        <p className="text-xs text-[var(--mist)] mt-2">
          Upgrade to Plus for 100 character slots
        </p>
      )}
    </div>
  );
}

function LoginPrompt() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    try {
      await api.requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[var(--shadow)] rounded-lg border border-[var(--arcane)]/30 p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <h3 className="text-[var(--arcane)] font-bold mb-2">Check Your Email</h3>
        <p className="text-[var(--mist)] text-sm">
          We sent a login link to <span className="text-[var(--text)]">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--shadow)] rounded-lg border border-[var(--slate)] p-6">
      <h3 className="text-[var(--amber)] font-bold mb-2">Sign In to Access Characters</h3>
      <p className="text-[var(--mist)] text-sm mb-4">
        Your characters are saved to your account. Sign in to continue your adventures.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 rounded bg-[var(--void)] border border-[var(--slate)] text-[var(--text)] placeholder:text-[var(--mist)] focus:outline-none focus:border-[var(--amber)]"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="px-4 py-2 rounded bg-[var(--amber)] text-[var(--void)] font-bold disabled:opacity-50 hover:bg-[var(--amber-dim)] transition-colors"
        >
          {loading ? "..." : "Sign In"}
        </button>
      </form>
      {error && <p className="text-[var(--crimson)] text-sm mt-2">{error}</p>}
    </div>
  );
}

export default function CharactersPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [characters, setCharacters] = useState<RosterCharacter[]>([]);
  const [slots, setSlots] = useState<CharacterSlots | null>(null);
  const [graveyard, setGraveyard] = useState<GraveyardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGraveyard, setShowGraveyard] = useState(false);

  // Fetch current user
  useEffect(() => {
    api
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  // Fetch character data when user is logged in
  useEffect(() => {
    if (!user?.logged_in || user.is_guest) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getCharacterRoster(),
      api.getCharacterSlots(),
    ])
      .then(([roster, slotsData]) => {
        setCharacters(roster);
        setSlots(slotsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch graveyard when expanded
  useEffect(() => {
    if (!showGraveyard || !user?.logged_in || user.is_guest) return;
    api.getCharacterGraveyard().then(setGraveyard).catch(console.error);
  }, [showGraveyard, user]);

  const handleRetire = async (characterId: string) => {
    try {
      await api.retireCharacter(characterId);
      // Refresh roster
      const [roster, slotsData] = await Promise.all([
        api.getCharacterRoster(),
        api.getCharacterSlots(),
      ]);
      setCharacters(roster);
      setSlots(slotsData);
    } catch (err) {
      console.error("Failed to retire character:", err);
    }
  };

  const handlePlay = (character: RosterCharacter) => {
    // Redirect to main game with character selected
    window.location.href = `/?world=${character.world_id}&entity=${character.entity_id}`;
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCharacters([]);
    setSlots(null);
    setGraveyard([]);
  };

  const isLoggedIn = user?.logged_in && !user.is_guest;
  const activeCharacters = characters.filter((c) => c.status === "active");

  return (
    <main className="min-h-dvh bg-[var(--void)] text-[var(--text)]">
      {/* Header */}
      <header className="border-b border-[var(--slate)] bg-[var(--shadow)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-[var(--amber)] font-bold tracking-wider">CHARACTERS</h1>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--mist)]">
                {user.display_name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-[var(--mist)] hover:text-[var(--crimson)] transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Auth state */}
        {userLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[var(--mist)] animate-pulse">Loading...</div>
          </div>
        ) : !isLoggedIn ? (
          <>
            <LoginPrompt />
            {user?.is_guest && (
              <div className="bg-[var(--shadow)] rounded-lg border border-[var(--amber)]/30 p-4">
                <p className="text-[var(--amber)] text-sm">
                  You&apos;re playing as a guest. Sign in above to save your progress and access your characters from any device.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Slot indicator */}
            <SlotIndicator slots={slots} />

            {/* Character roster */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-[var(--mist)] animate-pulse">Loading characters...</div>
              </div>
            ) : activeCharacters.length === 0 ? (
              <div className="bg-[var(--shadow)] rounded-lg border border-[var(--slate)] p-8 text-center">
                <div className="text-4xl mb-4">⚔</div>
                <h3 className="text-[var(--amber)] font-bold mb-2">No Active Characters</h3>
                <p className="text-[var(--mist)] text-sm mb-4">
                  Start a new adventure to create your first character.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-bold hover:bg-[var(--amber-dim)] transition-colors"
                >
                  Start Adventure
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeCharacters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onRetire={() => handleRetire(character.id)}
                    onPlay={() => handlePlay(character)}
                  />
                ))}
              </div>
            )}

            {/* Graveyard section */}
            <div className="border-t border-[var(--slate)] pt-6">
              <button
                onClick={() => setShowGraveyard(!showGraveyard)}
                className="flex items-center gap-2 text-[var(--mist)] hover:text-[var(--text)] transition-colors"
              >
                <span className="text-lg">☠</span>
                <span>Graveyard</span>
                <span className="text-xs">{showGraveyard ? "▲" : "▼"}</span>
              </button>

              {showGraveyard && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {graveyard.length === 0 ? (
                    <p className="text-[var(--mist)] text-sm col-span-full">
                      No fallen characters yet.
                    </p>
                  ) : (
                    graveyard.map((entry) => (
                      <GraveyardCard key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
