"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWiki } from "@/contexts/WikiContext";
import * as api from "@/lib/api";
import type { WikiLandSummary, LoreCategory } from "@/lib/api";

const CATEGORY_CONFIG: Record<LoreCategory, { icon: string; label: string; description: string }> = {
  items: {
    icon: "⚔",
    label: "Items",
    description: "Weapons, armor, consumables, and treasures",
  },
  enemies: {
    icon: "☠",
    label: "Enemies",
    description: "Creatures and adversaries you'll face",
  },
  skills: {
    icon: "◈",
    label: "Skills",
    description: "Abilities and proficiencies to master",
  },
  npcs: {
    icon: "☺",
    label: "NPCs",
    description: "Characters inhabiting the world",
  },
  locations: {
    icon: "◎",
    label: "Locations",
    description: "Places to discover and explore",
  },
  realms: {
    icon: "◉",
    label: "Realms",
    description: "Vast territories within this land",
  },
};

const CATEGORY_ORDER: LoreCategory[] = ["items", "enemies", "skills", "npcs", "locations", "realms"];

const LAND_CONFIG: Record<string, { icon: string; accent: string }> = {
  fantasy: { icon: "🏰", accent: "#d4a849" },
  scifi: { icon: "🚀", accent: "#06b6d4" },
  contemporary: { icon: "🌆", accent: "#84cc16" },
  historical: { icon: "📜", accent: "#b45309" },
  horror: { icon: "🦇", accent: "#dc2626" },
  adults_only: { icon: "🌹", accent: "#ec4899" },
};

function CategoryCard({
  land,
  category,
  count,
  accent,
}: {
  land: string;
  category: LoreCategory;
  count: number;
  accent: string;
}) {
  const config = CATEGORY_CONFIG[category];

  return (
    <Link
      href={`/wiki/${land}/${category}`}
      className="wiki-card"
      style={{ "--wiki-accent": accent } as React.CSSProperties}
    >
      <div className="wiki-card-header">
        <div className="wiki-card-icon" style={{ color: accent }}>
          {config.icon}
        </div>
        <div>
          <div className="wiki-card-title">{config.label}</div>
          <div className="wiki-card-meta">{count.toLocaleString()} entries</div>
        </div>
      </div>
      <div className="wiki-card-desc">{config.description}</div>
    </Link>
  );
}

export default function WikiLandPage() {
  const params = useParams();
  const landKey = params.land as string;
  const { isLoggedIn } = useWiki();

  const [summary, setSummary] = useState<WikiLandSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const landConfig = LAND_CONFIG[landKey] || LAND_CONFIG.fantasy;

  // Fetch from API
  useEffect(() => {
    setLoading(true);
    api.getWikiLandSummary(landKey)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [landKey]);

  if (loading || !summary) {
    return (
      <>
        <header className="wiki-header">
          <Link href="/wiki" className="wiki-logo">
            <div className="wiki-logo-icon">📖</div>
            <div>
              <div className="wiki-logo-text">Textlands Wiki</div>
            </div>
          </Link>
        </header>
        <main className="wiki-main full-width">
          <div style={{ textAlign: "center", padding: 64, color: "var(--mist)" }}>
            {loading ? "Loading..." : "Land not found"}
          </div>
        </main>
      </>
    );
  }

  const totalEntries = Object.values(summary.categories).reduce((sum, cat) => sum + cat.total, 0);

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
              placeholder={`Search ${summary.land_display_name}...`}
            />
          </div>
          <Link href="/" className="wiki-auth-btn">
            {isLoggedIn ? "Return to Game" : "Log In"}
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="wiki-sidebar">
        <div className="wiki-sidebar-section">
          <div className="wiki-sidebar-title">Navigation</div>
          <ul className="wiki-nav-list">
            <li className="wiki-nav-item">
              <Link href="/wiki" className="wiki-nav-link">
                <span className="wiki-nav-icon">←</span>
                All Lands
              </Link>
            </li>
          </ul>
        </div>

        <div className="wiki-sidebar-section">
          <div className="wiki-sidebar-title">Categories</div>
          <ul className="wiki-nav-list">
            {CATEGORY_ORDER.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = summary.categories[cat]?.total || 0;
              return (
                <li key={cat} className="wiki-nav-item">
                  <Link href={`/wiki/${landKey}/${cat}`} className="wiki-nav-link">
                    <span className="wiki-nav-icon">{config.icon}</span>
                    {config.label}
                    <span className="wiki-nav-count">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="wiki-main">
        {/* Breadcrumb */}
        <nav className="wiki-breadcrumb">
          <Link href="/wiki">Wiki</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <span>{summary.land_display_name}</span>
        </nav>

        {/* Land Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 80,
            height: 80,
            background: "var(--wiki-stone)",
            border: "1px solid var(--slate)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
          }}>
            {landConfig.icon}
          </div>
          <div>
            <h1 className="wiki-page-title" style={{ color: landConfig.accent }}>
              {summary.land_display_name}
            </h1>
            <div className="wiki-page-subtitle">
              {summary.loretracker_name} — {totalEntries.toLocaleString()} entries
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="wiki-grid">
          {CATEGORY_ORDER.map((cat) => (
            <CategoryCard
              key={cat}
              land={landKey}
              category={cat}
              count={summary.categories[cat]?.total || 0}
              accent={landConfig.accent}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
