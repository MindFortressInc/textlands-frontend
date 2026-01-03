"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWiki } from "@/contexts/WikiContext";
import * as api from "@/lib/api";
import type { WikiEntry, LoreCategory } from "@/lib/api";

const CATEGORY_CONFIG: Record<LoreCategory, { icon: string; label: string }> = {
  items: { icon: "⚔", label: "Items" },
  enemies: { icon: "☠", label: "Enemies" },
  skills: { icon: "◈", label: "Skills" },
  npcs: { icon: "☺", label: "NPCs" },
  locations: { icon: "◎", label: "Locations" },
  realms: { icon: "◉", label: "Realms" },
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  junk: { label: "Junk", color: "#6b7280" },
  common: { label: "Common", color: "#9ca3af" },
  uncommon: { label: "Uncommon", color: "#22c55e" },
  rare: { label: "Rare", color: "#3b82f6" },
  epic: { label: "Epic", color: "#a855f7" },
  legendary: { label: "Legendary", color: "#f59e0b" },
  minion: { label: "Minion", color: "#6b7280" },
  elite: { label: "Elite", color: "#a855f7" },
  boss: { label: "Boss", color: "#dc2626" },
};

const LAND_CONFIG: Record<string, { accent: string }> = {
  fantasy: { accent: "#d4a849" },
  scifi: { accent: "#06b6d4" },
  contemporary: { accent: "#84cc16" },
  historical: { accent: "#b45309" },
  horror: { accent: "#dc2626" },
  adults_only: { accent: "#ec4899" },
};

const LAND_NAMES: Record<string, string> = {
  fantasy: "High Fantasy",
  scifi: "Sci-Fi",
  contemporary: "Contemporary",
  historical: "Historical",
  horror: "Horror",
  adults_only: "Romance",
};

function SpoilerLock({ onReveal }: { onReveal: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 64,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.3 }}>🔒</div>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: 24,
        color: "var(--wiki-bright)",
        marginBottom: 12,
      }}>
        Entry Not Yet Discovered
      </h2>
      <p style={{
        color: "var(--text-dim)",
        marginBottom: 24,
        maxWidth: 400,
        lineHeight: 1.6,
      }}>
        You haven&apos;t discovered this entry in-game yet. Revealing it will spoil the surprise of finding it yourself.
      </p>
      <button
        onClick={onReveal}
        style={{
          padding: "12px 24px",
          background: "var(--wiki-stone)",
          border: "1px solid var(--slate)",
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Reveal Entry Anyway
      </button>
    </div>
  );
}

export default function WikiEntryPage() {
  const params = useParams();
  const landKey = params.land as string;
  const category = params.category as LoreCategory;
  const entryId = params.entryId as string;

  const { isLoggedIn, isEntryHidden, unlockEntry } = useWiki();

  const [entry, setEntry] = useState<WikiEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  const landConfig = LAND_CONFIG[landKey] || LAND_CONFIG.fantasy;
  const categoryConfig = CATEGORY_CONFIG[category] || { icon: "◇", label: category };

  // Load entry from API
  useEffect(() => {
    setLoading(true);
    api.getWikiEntry(landKey, category, entryId)
      .then((data) => {
        setEntry(data);
        setIsHidden(isLoggedIn && isEntryHidden(entryId));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [landKey, category, entryId, isLoggedIn, isEntryHidden]);

  const handleReveal = () => {
    unlockEntry(entryId);
    setIsHidden(false);
  };

  const tierConfig = entry?.tier ? TIER_CONFIG[entry.tier] : null;

  return (
    <div data-land={landKey}>
      {/* Header */}
      <header className="wiki-header">
        <Link href="/wiki" className="wiki-logo">
          <div className="wiki-logo-icon">📖</div>
          <div>
            <div className="wiki-logo-text">Textlands Wiki</div>
          </div>
        </Link>

        <div className="wiki-header-actions">
          <div className="wiki-search">
            <span className="wiki-search-icon">🔍</span>
            <input
              type="text"
              className="wiki-search-input"
              placeholder="Search the wiki..."
            />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="wiki-sidebar">
        <div className="wiki-sidebar-section">
          <div className="wiki-sidebar-title">Navigation</div>
          <ul className="wiki-nav-list">
            <li className="wiki-nav-item">
              <Link href={`/wiki/${landKey}/${category}`} className="wiki-nav-link">
                <span className="wiki-nav-icon">←</span>
                Back to {categoryConfig.label}
              </Link>
            </li>
            <li className="wiki-nav-item">
              <Link href={`/wiki/${landKey}`} className="wiki-nav-link">
                <span className="wiki-nav-icon">◇</span>
                {LAND_NAMES[landKey] || landKey}
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="wiki-main">
        {/* Breadcrumb */}
        <nav className="wiki-breadcrumb">
          <Link href="/wiki">Wiki</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <Link href={`/wiki/${landKey}`}>{LAND_NAMES[landKey] || landKey}</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <Link href={`/wiki/${landKey}/${category}`}>{categoryConfig.label}</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <span>{entry?.display_name || "Loading..."}</span>
        </nav>

        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--mist)" }}>
            Loading entry...
          </div>
        ) : !entry ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--mist)" }}>
            Entry not found
          </div>
        ) : isHidden ? (
          <SpoilerLock onReveal={handleReveal} />
        ) : (
          <article className="wiki-entry">
            {/* Entry Header */}
            <header className="wiki-entry-header">
              <div className="wiki-entry-icon" style={{ color: tierConfig?.color || landConfig.accent }}>
                {categoryConfig.icon}
              </div>
              <div className="wiki-entry-info">
                <h1 className="wiki-entry-title">{entry.display_name}</h1>
                <div className="wiki-entry-type">
                  {categoryConfig.label}
                  {typeof entry.extra?.category === "string" && ` — ${entry.extra.category}`}
                  {typeof entry.extra?.subcategory === "string" && ` / ${entry.extra.subcategory}`}
                </div>
                <div className="wiki-entry-tags">
                  {tierConfig && (
                    <span className={`wiki-tier ${entry.tier}`}>{tierConfig.label}</span>
                  )}
                </div>
              </div>
            </header>

            {/* Description */}
            {entry.description && (
              <section className="wiki-section">
                <h2 className="wiki-section-title">Description</h2>
                <p className="wiki-lore-text">{entry.description}</p>
              </section>
            )}

            {/* Stats */}
            {Object.keys(entry.extra || {}).length > 0 && (
              <section className="wiki-section">
                <h2 className="wiki-section-title">Statistics</h2>
                <div className="wiki-stats-grid">
                  {Array.isArray(entry.extra?.damage) && (
                    <div className="wiki-stat">
                      <div className="wiki-stat-label">Damage</div>
                      <div className="wiki-stat-value">
                        {`${entry.extra.damage[0]}-${entry.extra.damage[1]}`}
                      </div>
                    </div>
                  )}
                  {typeof entry.extra?.level === "number" && (
                    <div className="wiki-stat">
                      <div className="wiki-stat-label">Level</div>
                      <div className="wiki-stat-value">{entry.extra.level}</div>
                    </div>
                  )}
                  {typeof entry.extra?.hp === "number" && (
                    <div className="wiki-stat">
                      <div className="wiki-stat-label">Health</div>
                      <div className="wiki-stat-value">{entry.extra.hp}</div>
                    </div>
                  )}
                  {typeof entry.extra?.occupation === "string" && (
                    <div className="wiki-stat">
                      <div className="wiki-stat-label">Occupation</div>
                      <div className="wiki-stat-value" style={{ fontSize: 14, textTransform: "capitalize" }}>
                        {entry.extra.occupation.replace(/_/g, " ")}
                      </div>
                    </div>
                  )}
                  {typeof entry.extra?.location_type === "string" && (
                    <div className="wiki-stat">
                      <div className="wiki-stat-label">Type</div>
                      <div className="wiki-stat-value" style={{ fontSize: 14, textTransform: "capitalize" }}>
                        {entry.extra.location_type}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Lore */}
            {typeof entry.extra?.lore === "string" && (
              <section className="wiki-section">
                <h2 className="wiki-section-title">Lore</h2>
                <p className="wiki-lore-text" style={{ fontStyle: "italic" }}>
                  {entry.extra.lore}
                </p>
              </section>
            )}

            {/* Discovery hint */}
            <section className="wiki-section" style={{ marginTop: 48 }}>
              <div style={{
                padding: 16,
                background: "var(--wiki-stone)",
                border: "1px solid var(--slate)",
                fontSize: 13,
                color: "var(--mist)",
              }}>
                <strong style={{ color: "var(--text-dim)" }}>Discovery Hint:</strong>{" "}
                {category === "items" && "Found as loot, purchased from merchants, or crafted."}
                {category === "enemies" && "Defeat in combat to add to your bestiary."}
                {category === "skills" && "Gain XP in this skill through related actions."}
                {category === "npcs" && "Speak with this character to add them to your journal."}
                {category === "locations" && "Visit this location to discover it."}
                {category === "realms" && "Start a session in this realm to unlock it."}
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
