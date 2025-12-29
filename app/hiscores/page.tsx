"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type {
  LeaderboardCategory,
  CategoryLeaderboardEntry,
  PlayerRankings,
  AuthUser,
} from "@/lib/api";

const CATEGORIES: { key: LeaderboardCategory; label: string; icon: string }[] = [
  { key: "trailblazer", label: "Trailblazer", icon: "★" },
  { key: "slayers", label: "Slayers", icon: "⚔" },
  { key: "outlaws", label: "Outlaws", icon: "☠" },
];

function LeaderboardTable({
  entries,
  loading,
  currentPlayerId,
}: {
  entries: CategoryLeaderboardEntry[];
  loading: boolean;
  currentPlayerId?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--mist)] animate-pulse">Loading...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--mist)]">No entries yet</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[var(--mist)] text-left border-b border-[var(--slate)]">
            <th className="py-3 px-4 w-16">Rank</th>
            <th className="py-3 px-4">Player</th>
            <th className="py-3 px-4 text-right">Score</th>
            <th className="py-3 px-4 text-right hidden sm:table-cell">Title</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentPlayer = currentPlayerId && entry.player_id === currentPlayerId;
            return (
              <tr
                key={entry.player_id}
                className={`border-b border-[var(--slate)]/50 hover:bg-[var(--shadow)] transition-colors ${
                  isCurrentPlayer ? "bg-[var(--amber)]/10" : ""
                }`}
              >
                <td className="py-3 px-4">
                  <span
                    className={`${
                      entry.rank === 1
                        ? "text-[var(--amber)]"
                        : entry.rank === 2
                        ? "text-[var(--text)]"
                        : entry.rank === 3
                        ? "text-[var(--amber-dim)]"
                        : "text-[var(--mist)]"
                    }`}
                  >
                    {entry.rank === 1 ? "★" : entry.rank === 2 ? "☆" : entry.rank === 3 ? "◇" : "#"}
                    {entry.rank}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={isCurrentPlayer ? "text-[var(--amber)]" : "text-[var(--text)]"}>
                    {entry.display_name || entry.player_id.slice(0, 8)}
                    {isCurrentPlayer && " (you)"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-[var(--arcane)]">
                  {entry.score.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-[var(--mist)] hidden sm:table-cell">
                  {entry.title || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlayerRankingsSummary({
  rankings,
  loading,
}: {
  rankings: PlayerRankings | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-4 bg-[var(--shadow)] rounded-lg border border-[var(--slate)] animate-pulse">
        <div className="h-4 bg-[var(--slate)] rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-[var(--slate)] rounded w-2/3"></div>
      </div>
    );
  }

  if (!rankings || rankings.rankings.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-[var(--shadow)] rounded-lg border border-[var(--slate)]">
      <h3 className="text-[var(--amber)] text-sm font-bold mb-3">Your Rankings</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {rankings.rankings.map((r) => {
          const cat = CATEGORIES.find((c) => c.key === r.category);
          return (
            <div key={r.category} className="text-center">
              <div className="text-lg text-[var(--text)]">{cat?.icon}</div>
              <div className="text-xs text-[var(--mist)]">{cat?.label}</div>
              <div className="text-sm font-mono text-[var(--arcane)]">#{r.rank}</div>
              <div className="text-xs text-[var(--mist)]">
                Top {r.percentile.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeaderboardsPage() {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("trailblazer");
  const [isGlobal, setIsGlobal] = useState(true);
  const [entries, setEntries] = useState<CategoryLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [playerRankings, setPlayerRankings] = useState<PlayerRankings | null>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Fetch current user
  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch leaderboard data when category or scope changes
  useEffect(() => {
    setLoading(true);
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getGlobalCategoryLeaderboard(activeCategory, 50);
        setEntries(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeCategory, isGlobal]);

  // Fetch player rankings when user is available
  useEffect(() => {
    if (!user?.player_id) {
      setPlayerRankings(null);
      return;
    }
    setRankingsLoading(true);
    api
      .getPlayerGlobalRankings(user.player_id)
      .then(setPlayerRankings)
      .catch(() => setPlayerRankings(null))
      .finally(() => setRankingsLoading(false));
  }, [user?.player_id]);

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
            <h1 className="text-[var(--amber)] font-bold tracking-wider">HISCORES</h1>
          </div>
          {user?.logged_in && !user.is_guest && (
            <div className="text-sm text-[var(--mist)]">
              {user.display_name || user.email}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Player's own rankings */}
        <PlayerRankingsSummary rankings={playerRankings} loading={rankingsLoading} />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-[var(--amber)] text-[var(--void)]"
                  : "bg-[var(--shadow)] text-[var(--text)] border border-[var(--slate)] hover:border-[var(--amber)]"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Scope toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsGlobal(true)}
            className={`px-3 py-1 rounded text-xs ${
              isGlobal
                ? "bg-[var(--slate)] text-[var(--text)]"
                : "text-[var(--mist)] hover:text-[var(--text)]"
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setIsGlobal(false)}
            disabled
            className="px-3 py-1 rounded text-xs text-[var(--mist)] opacity-50 cursor-not-allowed"
            title="Select a world first"
          >
            Per-World
          </button>
        </div>

        {/* Leaderboard table */}
        <div className="bg-[var(--stone)] rounded-lg border border-[var(--slate)] overflow-hidden">
          <LeaderboardTable
            entries={entries}
            loading={loading}
            currentPlayerId={user?.player_id}
          />
        </div>
      </div>
    </main>
  );
}
