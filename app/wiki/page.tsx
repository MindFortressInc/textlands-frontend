"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWiki } from "@/contexts/WikiContext";
import * as api from "@/lib/api";
import type { WikiLand } from "@/lib/api";

// Land configuration with icons and accent colors
const LAND_CONFIG: Record<string, { icon: string; accent: string; gradient: string }> = {
  fantasy: {
    icon: "🏰",
    accent: "#d4a849",
    gradient: "linear-gradient(135deg, #d4a849 0%, #a88838 100%)",
  },
  scifi: {
    icon: "🚀",
    accent: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
  },
  contemporary: {
    icon: "🌆",
    accent: "#84cc16",
    gradient: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
  },
  historical: {
    icon: "📜",
    accent: "#b45309",
    gradient: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
  },
  horror: {
    icon: "🦇",
    accent: "#dc2626",
    gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  },
  adults_only: {
    icon: "🌹",
    accent: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  },
};

function SpoilerGate({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="wiki-gate">
      <div className="wiki-gate-content">
        <div className="wiki-gate-icon">📖</div>
        <h1 className="wiki-gate-title">The Textlands Wiki</h1>
        <p className="wiki-gate-text">
          This wiki contains complete information about all items, enemies, skills,
          NPCs, and locations in Textlands. Reading ahead may spoil the joy of discovery.
        </p>
        <div className="wiki-gate-warning">
          <span className="wiki-gate-warning-icon">⚠</span>
          <span>
            <strong>Spoiler Warning:</strong> The following pages reveal game content
            that is normally discovered through gameplay.
          </span>
        </div>
        <div className="wiki-gate-actions">
          <button className="wiki-gate-btn primary" onClick={onAccept}>
            I understand, show me everything
          </button>
          <Link href="/" className="wiki-gate-btn secondary" style={{ textDecoration: "none", textAlign: "center" }}>
            Return to Textlands
          </Link>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: "var(--mist)" }}>
          <strong>Tip:</strong> Log in for spoiler-free mode — undiscovered content
          will be hidden until you choose to reveal it.
        </p>
      </div>
    </div>
  );
}

function LandCard({ land }: { land: WikiLand }) {
  const config = LAND_CONFIG[land.key] || LAND_CONFIG.fantasy;
  const totalEntries = Object.values(land.categories).reduce((sum, cat) => sum + cat.total, 0);

  return (
    <Link
      href={`/wiki/${land.key}`}
      className="wiki-land-card"
      style={{ "--land-accent": config.accent } as React.CSSProperties}
    >
      <div className="wiki-land-icon">{config.icon}</div>
      <h2 className="wiki-land-name">{land.display_name}</h2>
      <div className="wiki-land-codex">{land.loretracker_name}</div>
      <p className="wiki-land-desc">{land.description}</p>
      <div className="wiki-land-stats">
        <span>{totalEntries.toLocaleString()} entries</span>
        <span>•</span>
        <span>{land.categories.realms.total} realms</span>
      </div>
    </Link>
  );
}

export default function WikiHomePage() {
  const { spoilerAccepted, acceptSpoilers, isLoggedIn } = useWiki();
  const [lands, setLands] = useState<WikiLand[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch lands on mount
  useEffect(() => {
    api.getWikiLands()
      .then(setLands)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Show spoiler gate if not accepted and not logged in
  if (!spoilerAccepted && !isLoggedIn) {
    return <SpoilerGate onAccept={acceptSpoilers} />;
  }

  return (
    <>
      {/* Header */}
      <header className="wiki-header">
        <Link href="/wiki" className="wiki-logo">
          <div className="wiki-logo-icon">📖</div>
          <div>
            <div className="wiki-logo-text">Textlands Wiki</div>
            <div className="wiki-logo-subtitle">The Complete Encyclopedia</div>
          </div>
        </Link>

        <div className="wiki-header-actions">
          <div className="wiki-search">
            <span className="wiki-search-icon">🔍</span>
            <input
              type="text"
              className="wiki-search-input"
              placeholder="Search the codex..."
            />
          </div>
          {isLoggedIn ? (
            <Link href="/" className="wiki-auth-btn">
              Return to Game
            </Link>
          ) : (
            <Link href="/?login=1" className="wiki-auth-btn">
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content - No sidebar on home */}
      <main className="wiki-main full-width" style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 className="wiki-page-title" style={{ fontSize: 42, marginBottom: 16 }}>
            Welcome to the Codex
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-dim)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7, fontFamily: "var(--font-lore)" }}>
            The complete encyclopedia of Textlands. Browse items, enemies, skills,
            NPCs, and locations across all lands.
          </p>
        </div>

        {/* Spoiler mode toggle for logged-in users */}
        {isLoggedIn && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 32,
            gap: 16,
          }}>
            <div style={{
              padding: "12px 20px",
              background: "var(--wiki-stone)",
              border: "1px solid var(--slate)",
              fontSize: 13,
              color: "var(--text-dim)",
            }}>
              <span style={{ marginRight: 12 }}>Spoiler-Free Mode</span>
              <label style={{ cursor: "pointer" }}>
                <input type="checkbox" style={{ marginRight: 8 }} />
                Hide undiscovered content
              </label>
            </div>
          </div>
        )}

        {/* Land Selection */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--mist)" }}>
            Loading lands...
          </div>
        ) : (
          <div className="wiki-lands-grid">
            {lands.map((land) => (
              <LandCard key={land.key} land={land} />
            ))}
          </div>
        )}

        {/* Global Skills Link */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link
            href="/wiki/skills"
            style={{
              display: "inline-block",
              padding: "16px 32px",
              background: "var(--wiki-stone)",
              border: "1px solid var(--slate)",
              color: "var(--text-dim)",
              textDecoration: "none",
              fontSize: 14,
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ marginRight: 8 }}>◈</span>
            Browse All Skills
            <span style={{ marginLeft: 8, color: "var(--mist)" }}>
              (Universal across all lands)
            </span>
          </Link>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 80,
          paddingTop: 32,
          borderTop: "1px solid var(--slate)",
          textAlign: "center",
          color: "var(--mist)",
          fontSize: 12,
        }}>
          <p>Textlands Wiki — The complete game encyclopedia</p>
          <p style={{ marginTop: 8, opacity: 0.6 }}>
            Content is dynamically generated. Some information may vary based on game updates.
          </p>
        </footer>
      </main>
    </>
  );
}
