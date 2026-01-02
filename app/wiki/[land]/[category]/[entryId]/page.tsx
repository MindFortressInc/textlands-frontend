"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWiki } from "@/contexts/WikiContext";
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

// Mock entry detail
function getMockEntry(category: LoreCategory, entryId: string): WikiEntry & { lore_text?: string } {
  const names: Record<string, string> = {
    items: "Iron Longsword",
    enemies: "Forest Wolf",
    skills: "Melee Combat",
    npcs: "Village Elder",
    locations: "Ancient Temple",
    realms: "Thornwood Vale",
  };

  const descriptions: Record<string, string> = {
    items: "A well-forged blade of sturdy iron, favored by soldiers and adventurers alike. The edge holds well against most foes.",
    enemies: "A cunning predator of the woodlands. Wolves hunt in packs, using coordinated tactics to bring down prey larger than themselves.",
    skills: "The fundamental art of close-quarters combat. Masters can deliver devastating blows and parry incoming attacks with precision.",
    npcs: "The eldest member of the village council, keeper of traditions and arbiter of disputes. Known for wisdom earned through decades of experience.",
    locations: "Ruins of a once-great temple, now reclaimed by nature. Strange energies still linger within its crumbling halls.",
    realms: "A verdant valley surrounded by ancient forests. Home to many villages and the mysterious Thornwood itself.",
  };

  const loreTexts: Record<string, string> = {
    items: "The first iron swords were forged in the early days of the realm, when blacksmiths discovered the secrets of smelting. This particular design has been refined over generations, balancing weight and reach for optimal combat effectiveness.",
    enemies: "Legends speak of a great wolf spirit that once ruled these forests, whose descendants still roam the woodlands today. Some hunters claim the wolves possess an intelligence beyond mere animals, and warn against underestimating them.",
    skills: "Combat has been practiced since the dawn of civilization. Those who master the blade speak of entering a state of flow, where instinct and training merge into seamless action.",
    npcs: "Born in simpler times, the Elder has witnessed the rise and fall of kings, the coming of dark omens, and the eternal cycles of the seasons. Their counsel is sought by many who face difficult decisions.",
    locations: "Before the Cataclysm, this temple was dedicated to the Old Gods. Now it serves as a waypoint for travelers and, some say, a gathering place for those who still practice the old ways.",
    realms: "Thornwood Vale was founded by settlers fleeing conflict in the eastern lands. Over centuries, it has grown from a handful of homesteads into a thriving region with its own traditions and mysteries.",
  };

  return {
    entry_type: category,
    entry_id: entryId,
    entry_key: `${category}_${entryId}`,
    display_name: names[category] || "Unknown Entry",
    tier: category === "enemies" ? "common" : "uncommon",
    description: descriptions[category] || "A mysterious entry.",
    extra: {
      category: category === "items" ? "weapon" : undefined,
      subcategory: category === "items" ? "sword" : undefined,
      damage: category === "items" ? [5, 10] : undefined,
      level: category === "enemies" ? 5 : undefined,
      hp: category === "enemies" ? 45 : undefined,
      occupation: category === "npcs" ? "village_leader" : undefined,
      location_type: category === "locations" ? "dungeon" : undefined,
    },
    lore_text: loreTexts[category],
  };
}

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
        color: "var(--wiki-fog)",
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
          border: "1px solid var(--wiki-slate)",
          color: "var(--wiki-fog)",
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

  const [entry, setEntry] = useState<(WikiEntry & { lore_text?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  const landConfig = LAND_CONFIG[landKey] || LAND_CONFIG.fantasy;
  const categoryConfig = CATEGORY_CONFIG[category] || { icon: "◇", label: category };

  // Load entry
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockEntry = getMockEntry(category, entryId);
      setEntry(mockEntry);
      setIsHidden(isLoggedIn && isEntryHidden(entryId));
      setLoading(false);
    }, 200);
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
            <div className="wiki-logo-text">Textlands Codex</div>
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
          <Link href="/wiki">Codex</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <Link href={`/wiki/${landKey}`}>{LAND_NAMES[landKey] || landKey}</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <Link href={`/wiki/${landKey}/${category}`}>{categoryConfig.label}</Link>
          <span className="wiki-breadcrumb-sep">/</span>
          <span>{entry?.display_name || "Loading..."}</span>
        </nav>

        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--wiki-mist)" }}>
            Loading entry...
          </div>
        ) : !entry ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--wiki-mist)" }}>
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
            {entry.lore_text && (
              <section className="wiki-section">
                <h2 className="wiki-section-title">Lore</h2>
                <p className="wiki-lore-text" style={{ fontStyle: "italic" }}>
                  {entry.lore_text}
                </p>
              </section>
            )}

            {/* Discovery hint */}
            <section className="wiki-section" style={{ marginTop: 48 }}>
              <div style={{
                padding: 16,
                background: "var(--wiki-stone)",
                border: "1px solid var(--wiki-slate)",
                fontSize: 13,
                color: "var(--wiki-mist)",
              }}>
                <strong style={{ color: "var(--wiki-fog)" }}>Discovery Hint:</strong>{" "}
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
