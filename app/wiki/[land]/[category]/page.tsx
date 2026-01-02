"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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

function EntryCard({
  entry,
  land,
  category,
  isHidden,
  onReveal,
}: {
  entry: WikiEntry;
  land: string;
  category: LoreCategory;
  isHidden: boolean;
  onReveal: () => void;
}) {
  const tierConfig = entry.tier ? TIER_CONFIG[entry.tier] : null;

  if (isHidden) {
    return (
      <div className="wiki-card hidden">
        <div className="wiki-card-content" style={{ filter: "blur(8px)" }}>
          <div className="wiki-card-header">
            <div className="wiki-card-icon">?</div>
            <div>
              <div className="wiki-card-title">?????</div>
              <div className="wiki-card-meta">Undiscovered</div>
            </div>
          </div>
        </div>
        <div className="wiki-spoiler-lock">
          <div className="wiki-spoiler-lock-icon">🔒</div>
          <div>Not yet discovered</div>
          <button className="wiki-reveal-btn" onClick={onReveal}>
            Reveal Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/wiki/${land}/${category}/${entry.entry_id}`} className="wiki-card">
      <div className="wiki-card-header">
        <div className="wiki-card-icon" style={{ color: tierConfig?.color }}>
          {CATEGORY_CONFIG[category]?.icon || "◇"}
        </div>
        <div style={{ flex: 1 }}>
          <div className="wiki-card-title">{entry.display_name}</div>
          {tierConfig && (
            <span className={`wiki-tier ${entry.tier}`}>{tierConfig.label}</span>
          )}
        </div>
      </div>
      {entry.description && (
        <div className="wiki-card-desc">{entry.description}</div>
      )}
    </Link>
  );
}

export default function WikiCategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const landKey = params.land as string;
  const category = params.category as LoreCategory;

  const { isLoggedIn, isEntryHidden, unlockEntry, unlockAll, setUnlockAll, loadDiscoveries } = useWiki();

  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const tierFilter = searchParams.get("tier");
  const landConfig = LAND_CONFIG[landKey] || LAND_CONFIG.fantasy;
  const categoryConfig = CATEGORY_CONFIG[category] || { icon: "◇", label: category };

  // Load entries from API
  useEffect(() => {
    setLoading(true);
    api.getWikiEntries(landKey, category, { tier: tierFilter || undefined, limit: 100 })
      .then((response) => {
        setEntries(response.entries);
        setTotal(response.pagination.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load discoveries for logged-in users
    if (isLoggedIn) {
      loadDiscoveries(landKey, category);
    }
  }, [landKey, category, tierFilter, isLoggedIn, loadDiscoveries]);

  // Entries are already filtered by the API when tierFilter is set
  const filteredEntries = entries;

  // Get unique tiers for filter
  const availableTiers = useMemo(() => {
    const tiers = new Set(entries.map((e) => e.tier).filter(Boolean));
    return Array.from(tiers) as string[];
  }, [entries]);

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
              placeholder={`Search ${categoryConfig.label.toLowerCase()}...`}
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
              <Link href={`/wiki/${landKey}`} className="wiki-nav-link">
                <span className="wiki-nav-icon">←</span>
                {LAND_NAMES[landKey] || landKey}
              </Link>
            </li>
          </ul>
        </div>

        {/* Tier Filter */}
        {availableTiers.length > 0 && (
          <div className="wiki-sidebar-section">
            <div className="wiki-sidebar-title">Filter by Tier</div>
            <ul className="wiki-nav-list">
              <li className="wiki-nav-item">
                <Link
                  href={`/wiki/${landKey}/${category}`}
                  className={`wiki-nav-link ${!tierFilter ? "active" : ""}`}
                >
                  <span className="wiki-nav-icon">◇</span>
                  All Tiers
                </Link>
              </li>
              {availableTiers.map((tier) => {
                const config = TIER_CONFIG[tier];
                return (
                  <li key={tier} className="wiki-nav-item">
                    <Link
                      href={`/wiki/${landKey}/${category}?tier=${tier}`}
                      className={`wiki-nav-link ${tierFilter === tier ? "active" : ""}`}
                    >
                      <span className="wiki-nav-icon" style={{ color: config?.color }}>●</span>
                      {config?.label || tier}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Spoiler Toggle for logged-in users */}
        {isLoggedIn && (
          <div className="wiki-sidebar-section">
            <div className="wiki-sidebar-title">Spoiler Settings</div>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              color: "var(--text-dim)",
              fontSize: 13,
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={unlockAll}
                onChange={(e) => setUnlockAll(e.target.checked)}
              />
              Show all entries
            </label>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="wiki-main">
        {/* Breadcrumb */}
        <nav className="wiki-breadcrumb">
          <Link href="/wiki">Codex</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <Link href={`/wiki/${landKey}`}>{LAND_NAMES[landKey] || landKey}</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <span>{categoryConfig.label}</span>
        </nav>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 className="wiki-page-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: landConfig.accent }}>{categoryConfig.icon}</span>
              {categoryConfig.label}
            </h1>
            <div className="wiki-page-subtitle">
              {total.toLocaleString()} entries
              {tierFilter && ` — Filtered by ${TIER_CONFIG[tierFilter]?.label || tierFilter}`}
            </div>
          </div>
        </div>

        {/* Entry Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--mist)" }}>
            Loading entries...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--mist)" }}>
            No entries found
          </div>
        ) : (
          <div className="wiki-grid">
            {filteredEntries.map((entry) => (
              <EntryCard
                key={entry.entry_id}
                entry={entry}
                land={landKey}
                category={category}
                isHidden={isLoggedIn && isEntryHidden(entry.entry_id)}
                onReveal={() => unlockEntry(entry.entry_id)}
              />
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        {total > 48 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 32,
            paddingTop: 32,
            borderTop: "1px solid var(--slate)",
          }}>
            <button className="wiki-auth-btn">Previous</button>
            <button className="wiki-auth-btn">Next</button>
          </div>
        )}
      </main>
    </div>
  );
}
