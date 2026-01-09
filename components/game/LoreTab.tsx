"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type {
  LoreCategory,
  LoreSummary,
  LoreEntry,
  LoreHierarchyCategory,
  LoreItemsHierarchy,
  LoreEnemiesHierarchy,
  LoreSkillsHierarchy,
  LoreNpcsHierarchy,
  LoreLocationsHierarchy,
  LoreShadowsHierarchy,
} from "@/lib/api";

interface LoreTabProps {
  landKey: string | null;
}

type LoreView =
  | { type: "summary" }
  | { type: "category"; category: LoreCategory }
  | { type: "detail"; category: LoreCategory; entryId: string };

const CATEGORY_CONFIG: Record<LoreCategory, { icon: string; label: string }> = {
  items: { icon: "⚔", label: "Items" },
  enemies: { icon: "☠", label: "Enemies" },
  skills: { icon: "◈", label: "Skills" },
  npcs: { icon: "☺", label: "NPCs" },
  locations: { icon: "◎", label: "Places" },
  realms: { icon: "◉", label: "Realms" },
  shadows: { icon: "◐", label: "Shadows" },
};

const CATEGORY_ORDER: LoreCategory[] = [
  "items",
  "enemies",
  "shadows",
  "skills",
  "npcs",
  "locations",
  "realms",
];

const TIER_COLORS: Record<string, string> = {
  junk: "var(--mist)",
  common: "var(--fog)",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "var(--amber)",
  minion: "var(--mist)",
  elite: "#a855f7",
  boss: "var(--crimson)",
  // Shadow grades
  normal: "var(--fog)",
  knight: "#3b82f6",
  commander: "var(--amber)",
  marshal: "var(--crimson)",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Summary View Component
function SummaryView({
  summary,
  onSelectCategory,
}: {
  summary: LoreSummary;
  onSelectCategory: (cat: LoreCategory) => void;
}) {
  return (
    <div className="flex flex-col text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[var(--slate)] bg-[var(--stone)]">
        <div className="text-[var(--amber)] font-bold text-sm uppercase tracking-wider">
          {summary.loretracker_name}
        </div>
        <div className="text-[var(--mist)] text-[10px] mt-1">
          {summary.completion_percent.toFixed(1)}% Complete
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-[var(--void)] border border-[var(--slate)] overflow-hidden">
          <div
            className="h-full bg-[var(--amber)] transition-all duration-300"
            style={{ width: `${Math.min(100, summary.completion_percent)}%` }}
          />
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto">
        {CATEGORY_ORDER.map((cat) => {
          const counts = summary.categories[cat];
          const config = CATEGORY_CONFIG[cat];
          const pct = counts.total > 0 ? (counts.discovered / counts.total) * 100 : 0;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="w-full p-3 flex items-center justify-between border-b border-[var(--slate)] hover:bg-[var(--stone)] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-[var(--amber)] w-4">{config.icon}</span>
                <span className="text-[var(--fog)]">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--mist)] font-mono">
                  {counts.discovered}/{counts.total}
                </span>
                <span className="text-[var(--mist)]">&gt;</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Stats */}
      {summary.total_kills > 0 && (
        <div className="p-3 border-t border-[var(--slate)] bg-[var(--stone)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--mist)]">Total Kills</span>
            <span className="text-[var(--crimson)] font-mono">{summary.total_kills}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Category View Component
function CategoryView({
  category,
  landKey,
  onBack,
  onSelectEntry,
}: {
  category: LoreCategory;
  landKey: string;
  onBack: () => void;
  onSelectEntry: (entryId: string) => void;
}) {
  const [hierarchy, setHierarchy] = useState<LoreHierarchyCategory[] | null>(null);
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const config = CATEGORY_CONFIG[category];

  // Fetch hierarchy based on category
  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Realms don't have a hierarchy - fetch entries directly
        if (category === "realms") {
          const res = await api.getLoreEntries(landKey, category, { limit: 100 });
          setEntries(res.entries);
          setHierarchy(null);
        } else {
          // Fetch hierarchy for other categories
          let hierarchyData: LoreHierarchyCategory[];

          switch (category) {
            case "items": {
              const data = await api.getLoreItemsHierarchy(landKey);
              hierarchyData = data.categories;
              break;
            }
            case "enemies": {
              const data = await api.getLoreEnemiesHierarchy(landKey);
              hierarchyData = data.tiers;
              break;
            }
            case "skills": {
              const data = await api.getLoreSkillsHierarchy(landKey);
              hierarchyData = data.categories;
              break;
            }
            case "npcs": {
              const data = await api.getLoreNpcsHierarchy(landKey);
              hierarchyData = data.realms;
              break;
            }
            case "locations": {
              const data = await api.getLoreLocationsHierarchy(landKey);
              hierarchyData = data.realms;
              break;
            }
            case "shadows": {
              const data = await api.getLoreShadowsHierarchy(landKey);
              hierarchyData = data.grades;
              break;
            }
            default:
              hierarchyData = [];
          }

          setHierarchy(hierarchyData);

          // Auto-expand first group with discoveries
          const firstWithDiscoveries = hierarchyData.find((g) => g.discovered > 0);
          if (firstWithDiscoveries) {
            setExpandedGroups(new Set([firstWithDiscoveries.name]));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, landKey]);

  // Fetch entries when filter changes
  useEffect(() => {
    if (!activeFilter || category === "realms") return;

    const fetchEntries = async () => {
      try {
        const options: api.LoreEntriesOptions = { limit: 50 };

        switch (category) {
          case "items":
            options.subcategory = activeFilter;
            break;
          case "enemies":
            options.tier = activeFilter;
            break;
          case "skills":
            // Skills filter by category (complexity)
            break;
          case "npcs":
            options.realm = activeFilter;
            break;
          case "locations":
            options.realm = activeFilter;
            break;
          case "shadows":
            options.tier = activeFilter; // Shadow grade
            break;
        }

        const res = await api.getLoreEntries(landKey, category, options);
        setEntries(res.entries);
      } catch (err) {
        console.error("Failed to fetch entries:", err);
      }
    };

    fetchEntries();
  }, [activeFilter, category, landKey]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
        if (activeFilter === groupName) setActiveFilter(null);
      } else {
        next.add(groupName);
        setActiveFilter(groupName);
      }
      return next;
    });
  };

  const totalDiscovered = hierarchy?.reduce((sum, g) => sum + g.discovered, 0) ?? entries.filter(e => e.is_discovered).length;
  const totalItems = hierarchy?.reduce((sum, g) => sum + g.total, 0) ?? entries.length;

  return (
    <div className="flex flex-col text-xs h-full">
      {/* Header */}
      <button
        onClick={onBack}
        className="p-3 border-b border-[var(--slate)] bg-[var(--stone)] flex items-center gap-2 hover:bg-[var(--shadow)] transition-colors text-left w-full"
      >
        <span className="text-[var(--mist)]">&lt;</span>
        <span className="text-[var(--amber)]">{config.icon}</span>
        <span className="text-[var(--fog)] uppercase tracking-wider flex-1">
          {config.label}
        </span>
        <span className="text-[var(--mist)] font-mono">
          {totalDiscovered}/{totalItems}
        </span>
      </button>

      {/* Content */}
      {loading ? (
        <div className="p-3 text-[var(--mist)] animate-pulse">Loading...</div>
      ) : error ? (
        <div className="p-3 text-[var(--crimson)]">{error}</div>
      ) : category === "realms" ? (
        // Flat list for realms
        <div className="flex-1 overflow-y-auto">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onClick={() => onSelectEntry(entry.id)}
            />
          ))}
        </div>
      ) : hierarchy && hierarchy.length > 0 ? (
        // Hierarchical view
        <div className="flex-1 overflow-y-auto">
          {hierarchy.map((group) => {
            const isExpanded = expandedGroups.has(group.name);
            return (
              <div key={group.name} className="border-b border-[var(--slate)]">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full p-2 flex items-center justify-between hover:bg-[var(--stone)] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--mist)] text-[10px] w-3">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span className="text-[var(--fog)] capitalize">{group.name}</span>
                  </div>
                  <span className="text-[var(--mist)] font-mono text-[10px]">
                    {group.discovered}/{group.total}
                  </span>
                </button>

                {isExpanded && (
                  <div className="pb-2">
                    {/* Subcategories */}
                    {group.subcategories.length > 0 && (
                      <div className="px-4 py-1 space-y-1">
                        {group.subcategories.map((sub) => (
                          <div
                            key={sub.name}
                            className="flex items-center justify-between text-[10px] text-[var(--mist)]"
                          >
                            <span className="capitalize">{sub.name}</span>
                            <span className="font-mono">
                              {sub.discovered}/{sub.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Entries */}
                    {activeFilter === group.name && entries.length > 0 && (
                      <div className="mt-1 border-t border-[var(--slate)] pt-1">
                        {entries.map((entry) => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            onClick={() => onSelectEntry(entry.id)}
                            indent
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 text-[var(--mist)]">No entries found</div>
      )}
    </div>
  );
}

// Entry Row Component
function EntryRow({
  entry,
  onClick,
  indent = false,
}: {
  entry: LoreEntry;
  onClick: () => void;
  indent?: boolean;
}) {
  const tierColor = entry.tier ? TIER_COLORS[entry.tier] || "var(--fog)" : "var(--mist)";

  return (
    <button
      onClick={onClick}
      className={`w-full p-2 flex items-center justify-between hover:bg-[var(--stone)] transition-colors text-left ${
        indent ? "pl-6" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        {entry.is_discovered ? (
          <span className="text-[var(--fog)] truncate block" style={{ color: tierColor }}>
            {entry.display_name}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[var(--slate)]">?????</span>
            {entry.category_hint && (
              <span className="text-[var(--mist)] text-[10px]">({entry.category_hint})</span>
            )}
          </div>
        )}
      </div>
      {entry.is_discovered && entry.kill_count !== undefined && entry.kill_count > 0 && (
        <span className="text-[var(--crimson)] text-[10px] font-mono ml-2">
          x{entry.kill_count}
        </span>
      )}
      <span className="text-[var(--mist)] ml-2">&gt;</span>
    </button>
  );
}

// Detail View Component
function DetailView({
  category,
  entryId,
  landKey,
  onBack,
}: {
  category: LoreCategory;
  entryId: string;
  landKey: string;
  onBack: () => void;
}) {
  const [entry, setEntry] = useState<LoreEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getLoreEntryDetail(landKey, category, entryId)
      .then(setEntry)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [landKey, category, entryId]);

  const config = CATEGORY_CONFIG[category];
  const tierColor = entry?.tier ? TIER_COLORS[entry.tier] || "var(--fog)" : "var(--mist)";

  return (
    <div className="flex flex-col text-xs h-full">
      {/* Header */}
      <button
        onClick={onBack}
        className="p-3 border-b border-[var(--slate)] bg-[var(--stone)] flex items-center gap-2 hover:bg-[var(--shadow)] transition-colors text-left w-full"
      >
        <span className="text-[var(--mist)]">&lt;</span>
        <span className="text-[var(--fog)] flex-1 truncate">
          {entry?.is_discovered ? entry.display_name : "?????"}
        </span>
      </button>

      {/* Content */}
      {loading ? (
        <div className="p-3 text-[var(--mist)] animate-pulse">Loading...</div>
      ) : error ? (
        <div className="p-3 text-[var(--crimson)]">{error}</div>
      ) : !entry ? (
        <div className="p-3 text-[var(--mist)]">Entry not found</div>
      ) : !entry.is_discovered ? (
        // Silhouette view
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-4xl text-[var(--slate)] mb-4">?</div>
          <div className="text-[var(--mist)] text-lg mb-2">?????</div>
          {entry.category_hint && (
            <div className="text-[var(--slate)] text-[10px] uppercase tracking-wider">
              {entry.category_hint}
            </div>
          )}
          <div className="mt-4 text-[var(--mist)] text-[10px]">
            Discover through gameplay
          </div>
        </div>
      ) : (
        // Full detail view
        <div className="flex-1 overflow-y-auto">
          {/* Tier badge */}
          {entry.tier && (
            <div className="p-3 border-b border-[var(--slate)]">
              <span
                className="px-2 py-0.5 text-[10px] uppercase tracking-wider border"
                style={{
                  color: tierColor,
                  borderColor: tierColor,
                  backgroundColor: `${tierColor}10`,
                }}
              >
                {entry.tier}
              </span>
            </div>
          )}

          {/* Description */}
          {entry.description && (
            <div className="p-3 border-b border-[var(--slate)]">
              <div className="text-[var(--fog)] leading-relaxed">{entry.description}</div>
            </div>
          )}

          {/* Enemy kill stats */}
          {category === "enemies" && entry.kill_count !== undefined && (
            <div className="p-3 border-b border-[var(--slate)] space-y-2">
              <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">
                Kill Stats
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Times Defeated</span>
                <span className="text-[var(--crimson)] font-mono">{entry.kill_count}</span>
              </div>
              {entry.first_killed_at && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--mist)]">First Kill</span>
                  <span className="text-[var(--fog)]">{formatDate(entry.first_killed_at)}</span>
                </div>
              )}
              {entry.last_killed_at && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--mist)]">Last Kill</span>
                  <span className="text-[var(--fog)]">{formatDate(entry.last_killed_at)}</span>
                </div>
              )}
            </div>
          )}

          {/* Discovery info */}
          <div className="p-3 space-y-2">
            <div className="text-[var(--amber)] text-[10px] uppercase tracking-wider mb-2">
              Discovery
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mist)]">Discovered</span>
              <span className="text-[var(--fog)]">{formatDate(entry.discovered_at)}</span>
            </div>
            {entry.discovery_source && (
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">Source</span>
                <span className="text-[var(--fog)] capitalize">{entry.discovery_source}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main LoreTab Component
export function LoreTab({ landKey }: LoreTabProps) {
  const [view, setView] = useState<LoreView>({ type: "summary" });
  const [summary, setSummary] = useState<LoreSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch summary on mount / landKey change
  useEffect(() => {
    if (!landKey) return;

    setLoading(true);
    setError(null);
    setView({ type: "summary" });

    api
      .getLoreSummary(landKey)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [landKey]);

  const handleSelectCategory = useCallback((category: LoreCategory) => {
    setView({ type: "category", category });
  }, []);

  const handleSelectEntry = useCallback(
    (category: LoreCategory, entryId: string) => {
      setView({ type: "detail", category, entryId });
    },
    []
  );

  const handleBack = useCallback(() => {
    if (view.type === "detail") {
      setView({ type: "category", category: view.category });
    } else {
      setView({ type: "summary" });
    }
  }, [view]);

  if (!landKey) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs">
        No active land
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs animate-pulse">
        Loading lore...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-[var(--crimson)] text-xs">
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-3 text-[var(--mist)] text-xs">
        No lore data available
      </div>
    );
  }

  switch (view.type) {
    case "summary":
      return <SummaryView summary={summary} onSelectCategory={handleSelectCategory} />;
    case "category":
      return (
        <CategoryView
          category={view.category}
          landKey={landKey}
          onBack={handleBack}
          onSelectEntry={(entryId) => handleSelectEntry(view.category, entryId)}
        />
      );
    case "detail":
      return (
        <DetailView
          category={view.category}
          entryId={view.entryId}
          landKey={landKey}
          onBack={handleBack}
        />
      );
  }
}
