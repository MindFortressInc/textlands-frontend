"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type {
  HiScoreCategory,
  HiScoreTimeWindow,
  HiScoreEntry,
  PlayerHiScoreRankings,
  AuthUser,
} from "@/lib/api";

const CATEGORIES: { key: HiScoreCategory; label: string; icon: string; desc: string }[] = [
  { key: "trailblazers", label: "TRAILBLAZERS", icon: "★", desc: "EXPLORERS" },
  { key: "warriors", label: "WARRIORS", icon: "⚔", desc: "COMBAT" },
  { key: "outlaws", label: "OUTLAWS", icon: "☠", desc: "INFAMOUS" },
  { key: "tycoons", label: "TYCOONS", icon: "◆", desc: "WEALTH" },
];

const TIME_WINDOWS: { key: HiScoreTimeWindow; label: string }[] = [
  { key: "all_time", label: "ALL TIME" },
  { key: "weekly", label: "WEEKLY" },
  { key: "monthly", label: "MONTHLY" },
];

function ScoreRow({
  entry,
  index,
  isCurrentPlayer,
  category,
}: {
  entry: HiScoreEntry;
  index: number;
  isCurrentPlayer: boolean;
  category: HiScoreCategory;
}) {
  const rankDisplay = entry.rank <= 3
    ? ["①", "②", "③"][entry.rank - 1]
    : String(entry.rank).padStart(2, "0");

  const getSecondaryInfo = () => {
    switch (category) {
      case "warriors":
        if (entry.kills_by_tier) {
          return `${entry.kills_by_tier.legendary}L ${entry.kills_by_tier.named}N`;
        }
        return entry.total_kills ? `${entry.total_kills} KILLS` : null;
      case "outlaws":
        return entry.active_bounty ? `◈${entry.active_bounty.toLocaleString()}` : null;
      case "tycoons":
        return entry.inventory_value ? `INV:${entry.inventory_value.toLocaleString()}` : null;
      case "trailblazers":
        return entry.footprints ? `${entry.footprints} FP` : null;
      default:
        return null;
    }
  };

  const secondary = getSecondaryInfo();

  return (
    <div
      className={`
        grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto_6rem] gap-2 sm:gap-4 items-center py-2 px-3
        border-b border-[var(--slate)]/30 transition-all duration-200
        ${isCurrentPlayer ? "bg-[var(--amber)]/15 border-[var(--amber)]/30" : "hover:bg-[var(--shadow)]"}
        ${entry.rank <= 3 ? "text-base" : "text-sm"}
      `}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Rank */}
      <div className={`
        font-mono font-bold text-center
        ${entry.rank === 1 ? "text-[var(--amber)] text-lg animate-pulse" : ""}
        ${entry.rank === 2 ? "text-[var(--text)]" : ""}
        ${entry.rank === 3 ? "text-[var(--amber-dim)]" : ""}
        ${entry.rank > 3 ? "text-[var(--mist)]" : ""}
      `}>
        {rankDisplay}
      </div>

      {/* Name */}
      <div className="truncate">
        <span className={`
          font-mono tracking-wide
          ${isCurrentPlayer ? "text-[var(--amber)]" : "text-[var(--text)]"}
          ${entry.rank === 1 ? "font-bold" : ""}
        `}>
          {(entry.display_name || entry.player_id.slice(0, 12)).toUpperCase()}
        </span>
        {isCurrentPlayer && (
          <span className="text-[var(--amber)] text-xs ml-2 animate-pulse">◄YOU</span>
        )}
      </div>

      {/* Secondary stat (hidden on mobile) */}
      <div className="hidden sm:block text-[var(--mist)] text-xs font-mono text-right">
        {secondary}
      </div>

      {/* Score */}
      <div className={`
        font-mono font-bold text-right tabular-nums
        ${entry.rank === 1 ? "text-[var(--amber)] text-lg" : ""}
        ${entry.rank === 2 ? "text-[var(--arcane)]" : ""}
        ${entry.rank === 3 ? "text-[var(--arcane)]" : ""}
        ${entry.rank > 3 ? "text-[var(--arcane)]" : ""}
      `}>
        {entry.score.toLocaleString()}
      </div>
    </div>
  );
}

function HiScoreTable({
  entries,
  loading,
  currentPlayerId,
  category,
}: {
  entries: HiScoreEntry[];
  loading: boolean;
  currentPlayerId?: string;
  category: HiScoreCategory;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-[var(--amber)] text-2xl animate-pulse font-mono">
          LOADING...
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[var(--amber)] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-[var(--mist)] text-xl font-mono">NO SCORES YET</div>
        <div className="text-[var(--slate)] text-sm font-mono animate-pulse">
          BE THE FIRST TO ENTER
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--slate)]/20">
      {/* Header */}
      <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto_6rem] gap-2 sm:gap-4 py-2 px-3 text-[var(--mist)] text-xs font-mono tracking-widest border-b border-[var(--slate)]">
        <div className="text-center">RNK</div>
        <div>PLAYER</div>
        <div className="hidden sm:block text-right">INFO</div>
        <div className="text-right">SCORE</div>
      </div>

      {/* Entries */}
      {entries.map((entry, index) => (
        <ScoreRow
          key={entry.player_id}
          entry={entry}
          index={index}
          isCurrentPlayer={currentPlayerId === entry.player_id}
          category={category}
        />
      ))}
    </div>
  );
}

function PlayerRankingsBanner({
  rankings,
  loading,
  timeWindow,
}: {
  rankings: PlayerHiScoreRankings | null;
  loading: boolean;
  timeWindow: HiScoreTimeWindow;
}) {
  if (loading) {
    return (
      <div className="bg-[var(--shadow)] border border-[var(--slate)] rounded p-4 animate-pulse">
        <div className="h-4 bg-[var(--slate)] rounded w-1/3 mb-3" />
        <div className="h-6 bg-[var(--slate)] rounded w-2/3" />
      </div>
    );
  }

  if (!rankings?.rankings) return null;

  const suffix = timeWindow === "all_time" ? "_all_time" : timeWindow === "weekly" ? "_weekly" : "_monthly";

  return (
    <div className="bg-[var(--shadow)] border border-[var(--amber-dim)]/30 rounded-lg p-4">
      <div className="text-[var(--mist)] text-xs font-mono tracking-widest mb-3">
        ═══ YOUR RANKINGS ═══
      </div>
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map((cat) => {
          const key = `${cat.key}${suffix}`;
          const data = rankings.rankings[key];
          const rank = data?.rank;
          const score = data?.score ?? 0;

          return (
            <div key={cat.key} className="text-center">
              <div className="text-lg mb-1">{cat.icon}</div>
              <div className="text-[var(--mist)] text-[10px] tracking-wider">{cat.desc}</div>
              {rank ? (
                <>
                  <div className="text-[var(--amber)] font-mono font-bold">#{rank}</div>
                  <div className="text-[var(--arcane)] text-xs font-mono">{score.toLocaleString()}</div>
                </>
              ) : (
                <div className="text-[var(--slate)] text-xs font-mono">---</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HiScoresPage() {
  const [category, setCategory] = useState<HiScoreCategory>("trailblazers");
  const [timeWindow, setTimeWindow] = useState<HiScoreTimeWindow>("all_time");
  const [entries, setEntries] = useState<HiScoreEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [playerRankings, setPlayerRankings] = useState<PlayerHiScoreRankings | null>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Fetch current user
  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch hiscores when category or time window changes
  useEffect(() => {
    setLoading(true);
    api.getGlobalHiScores(category, timeWindow, 50)
      .then((response) => {
        setEntries(response.entries);
        setTotalCount(response.total_count);
      })
      .catch((err) => {
        console.error("Failed to fetch hiscores:", err);
        setEntries([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [category, timeWindow]);

  // Fetch player rankings
  useEffect(() => {
    if (!user?.player_id) {
      setPlayerRankings(null);
      return;
    }
    setRankingsLoading(true);
    api.getPlayerGlobalHiScores(user.player_id)
      .then(setPlayerRankings)
      .catch(() => setPlayerRankings(null))
      .finally(() => setRankingsLoading(false));
  }, [user?.player_id]);

  const currentCat = CATEGORIES.find((c) => c.key === category);

  return (
    <main className="min-h-dvh bg-[var(--void)] text-[var(--text)] relative overflow-hidden">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }}
      />

      {/* Header */}
      <header className="border-b border-[var(--slate)] bg-[var(--shadow)] relative">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors font-mono text-sm"
            >
              ◄ BACK
            </Link>
            {user?.logged_in && !user.is_guest && (
              <div className="text-xs text-[var(--mist)] font-mono">
                {(user.display_name || user.email || "").toUpperCase()}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-[var(--amber)] text-3xl sm:text-4xl font-bold tracking-[0.3em] mb-1" style={{ textShadow: "0 0 20px var(--amber)" }}>
              HISCORES
            </h1>
            <div className="text-[var(--mist)] text-[10px] tracking-[0.5em] font-mono">
              ═══════ HALL OF FAME ═══════
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Player rankings banner */}
        {user?.player_id && (
          <PlayerRankingsBanner
            rankings={playerRankings}
            loading={rankingsLoading}
            timeWindow={timeWindow}
          />
        )}

        {/* Category selector */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`
                group relative px-4 py-3 font-mono text-sm transition-all duration-200
                border rounded
                ${category === cat.key
                  ? "bg-[var(--amber)] text-[var(--void)] border-[var(--amber)] shadow-[0_0_15px_var(--amber-dim)]"
                  : "bg-[var(--shadow)] text-[var(--text)] border-[var(--slate)] hover:border-[var(--amber-dim)] hover:text-[var(--amber)]"
                }
              `}
            >
              <span className="text-lg mr-2">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">{cat.desc}</span>
            </button>
          ))}
        </div>

        {/* Time window tabs */}
        <div className="flex justify-center gap-1 bg-[var(--shadow)] rounded-lg p-1 max-w-md mx-auto border border-[var(--slate)]">
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw.key}
              onClick={() => setTimeWindow(tw.key)}
              className={`
                flex-1 px-3 py-2 font-mono text-xs tracking-wider transition-all duration-200 rounded
                ${timeWindow === tw.key
                  ? "bg-[var(--stone)] text-[var(--amber)]"
                  : "text-[var(--mist)] hover:text-[var(--text)]"
                }
              `}
            >
              {tw.label}
            </button>
          ))}
        </div>

        {/* Current category header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded">
            <span className="text-2xl">{currentCat?.icon}</span>
            <div>
              <div className="text-[var(--amber)] font-bold tracking-wider">{currentCat?.label}</div>
              <div className="text-[var(--mist)] text-xs font-mono">
                {totalCount > 0 ? `${totalCount.toLocaleString()} PLAYERS` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* HiScore table */}
        <div className="bg-[var(--stone)] rounded-lg border border-[var(--slate)] overflow-hidden">
          <HiScoreTable
            entries={entries}
            loading={loading}
            currentPlayerId={user?.player_id}
            category={category}
          />
        </div>

        {/* Footer decoration */}
        <div className="text-center text-[var(--slate)] text-[10px] font-mono tracking-widest pt-4">
          ════════════════════════════
          <div className="mt-2 animate-pulse">SCORES REFRESH EVERY 5 MIN</div>
        </div>
      </div>
    </main>
  );
}
