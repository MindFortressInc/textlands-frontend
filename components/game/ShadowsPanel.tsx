"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "@/lib/api";
import type {
  ShadowSoldier,
  ShadowOverviewResponse,
  ShadowGrade,
} from "@/lib/api";

interface ShadowsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
}

const GRADE_COLORS: Record<ShadowGrade, string> = {
  normal: "var(--fog)",
  elite: "#a855f7",
  knight: "#3b82f6",
  commander: "var(--amber)",
  marshal: "var(--crimson)",
};

const GRADE_GLOW: Record<ShadowGrade, string> = {
  normal: "none",
  elite: "0 0 4px #a855f740",
  knight: "0 0 8px #3b82f6, 0 0 12px #3b82f680",
  commander: "0 0 10px var(--amber), 0 0 16px var(--amber-dim)",
  marshal: "0 0 10px var(--crimson), 0 0 20px var(--crimson), 0 0 30px rgba(220,38,38,0.5)",
};

const GRADE_ORDER: ShadowGrade[] = ["normal", "elite", "knight", "commander", "marshal"];

const SKILL_ICONS: Record<string, string> = {
  combat: "⚔",
  mining: "⛏",
  fishing: "🎣",
  thieving: "🗝",
  woodcutting: "🪓",
  hunting: "🏹",
  farming: "🌾",
  herblore: "🌿",
  cooking: "🍖",
  magic: "✧",
  healing: "✚",
  smithing: "⚒",
};

type PanelView = "overview" | "squad" | "realm" | "working" | "detail";

function ShadowRow({
  shadow,
  onClick,
  selected,
  showWorkStatus = false,
}: {
  shadow: ShadowSoldier;
  onClick: () => void;
  selected: boolean;
  showWorkStatus?: boolean;
}) {
  const gradeColor = GRADE_COLORS[shadow.grade];
  const isGlowing = ["knight", "commander", "marshal"].includes(shadow.grade);
  const skillIcon = SKILL_ICONS[shadow.specialty_skill] || "◆";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 flex items-center gap-2 transition-all duration-150 font-mono text-sm
        ${selected
          ? "bg-[var(--stone)] border-l-2 border-[var(--amber)]"
          : "border-l-2 border-transparent hover:bg-[var(--shadow)] hover:border-[var(--slate)]"
        }
        ${!shadow.is_alive ? "opacity-50" : ""}`}
    >
      <span className="text-[var(--mist)] w-4 text-xs">{skillIcon}</span>
      <span
        className={`flex-1 truncate ${isGlowing ? "animate-pulse-subtle" : ""}`}
        style={{
          color: gradeColor,
          textShadow: GRADE_GLOW[shadow.grade],
        }}
      >
        {shadow.name}
      </span>
      <span className="text-[var(--mist)] text-xs font-mono">
        Lv{shadow.level}
      </span>
      {!shadow.is_alive && (
        <span className="text-[var(--crimson)] text-xs">☠</span>
      )}
      {shadow.is_in_squad && shadow.is_alive && (
        <span className="text-[var(--amber)] text-xs">◆</span>
      )}
      {showWorkStatus && shadow.is_working && (
        <span className="text-[var(--arcane)] text-xs animate-pulse">⚙</span>
      )}
    </button>
  );
}

function ShadowDetail({
  shadow,
  worldId,
  onAction,
  actionLoading,
}: {
  shadow: ShadowSoldier;
  worldId: string;
  onAction: (action: string, shadowId: string) => void;
  actionLoading: boolean;
}) {
  const gradeColor = GRADE_COLORS[shadow.grade];
  const isGlowing = ["knight", "commander", "marshal"].includes(shadow.grade);
  const skillIcon = SKILL_ICONS[shadow.specialty_skill] || "◆";

  return (
    <div className="p-3 space-y-3 font-mono text-sm flex flex-col h-full">
      {/* Shadow Name with ASCII frame */}
      <div className="border border-[var(--slate)] p-2 bg-[var(--void)]">
        <div
          className={`font-bold text-center ${isGlowing ? "animate-pulse-subtle" : ""}`}
          style={{
            color: gradeColor,
            textShadow: GRADE_GLOW[shadow.grade],
          }}
        >
          {skillIcon} {shadow.name}
        </div>
        <div className="text-xs text-[var(--mist)] text-center mt-1">
          [{shadow.grade.toUpperCase()}] • {shadow.specialty_skill}
        </div>
      </div>

      {/* Original identity */}
      <div className="text-[var(--fog)] text-xs leading-relaxed border-l-2 border-[var(--slate)] pl-2">
        Shadow of <span className="text-[var(--amber)]">{shadow.original_name}</span>
        {shadow.original_tier && (
          <span className="text-[var(--mist)]"> ({shadow.original_tier})</span>
        )}
      </div>

      {/* Stats Block */}
      <div className="border border-[var(--slate)] bg-[var(--void)]">
        <div className="text-xs text-[var(--mist)] px-2 py-1 border-b border-[var(--slate)] bg-[var(--shadow)]">
          ┌─ STATS ─┐
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--fog)]">LEVEL</span>
            <span className="text-[var(--amber)]">{shadow.level}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--fog)]">XP</span>
            <span className="text-[var(--mist)]">
              {shadow.xp}{shadow.xp_to_next ? ` / ${shadow.xp + shadow.xp_to_next}` : ""}
            </span>
          </div>
          {shadow.loyalty !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--fog)]">LOYALTY</span>
              <span className="text-[var(--arcane)]">{Math.round(shadow.loyalty * 100)}%</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-[var(--fog)]">KILLS</span>
            <span className="text-[var(--crimson)]">{shadow.kills}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-xs space-y-1">
        {!shadow.is_alive && (
          <div className="text-[var(--crimson)] text-center py-1 border border-[var(--crimson)] bg-[var(--crimson)]/10">
            ☠ FALLEN
          </div>
        )}
        {shadow.is_in_squad && shadow.is_alive && (
          <div className="text-[var(--amber)] text-center">◆ IN SQUAD ◆</div>
        )}
        {shadow.is_working && (
          <div className="text-[var(--arcane)] text-center animate-pulse">
            ⚙ Working: {shadow.specialty_skill}
            {shadow.hours_worked !== undefined && ` (${shadow.hours_worked.toFixed(1)}h)`}
          </div>
        )}
        {shadow.promotion_eligible && (
          <div className="text-[var(--amber)] text-center animate-pulse">
            ★ PROMOTION READY → {shadow.next_grade?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-3 border-t border-[var(--slate)] space-y-1.5">
        {!shadow.is_alive && shadow.can_resurrect && (
          <button
            onClick={() => onAction("resurrect", shadow.id)}
            disabled={actionLoading}
            className="w-full py-1.5 text-xs border border-[var(--arcane)] text-[var(--arcane)] bg-[var(--void)] hover:bg-[var(--arcane)] hover:text-[var(--void)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "..." : "[RESURRECT]"}
          </button>
        )}
        {shadow.is_alive && !shadow.is_in_squad && (
          <button
            onClick={() => onAction("summon", shadow.id)}
            disabled={actionLoading}
            className="w-full py-1.5 text-xs border border-[var(--amber)] text-[var(--amber)] bg-[var(--void)] hover:bg-[var(--amber)] hover:text-[var(--void)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "..." : "[SUMMON TO SQUAD]"}
          </button>
        )}
        {shadow.is_in_squad && (
          <button
            onClick={() => onAction("dismiss", shadow.id)}
            disabled={actionLoading}
            className="w-full py-1.5 text-xs border border-[var(--slate)] bg-[var(--void)] hover:bg-[var(--stone)] hover:border-[var(--mist)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "..." : "[DISMISS]"}
          </button>
        )}
        {shadow.promotion_eligible && (
          <button
            onClick={() => onAction("promote", shadow.id)}
            disabled={actionLoading}
            className="w-full py-1.5 text-xs border border-[var(--amber)] text-[var(--amber)] bg-[var(--void)] hover:bg-[var(--amber)] hover:text-[var(--void)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "..." : "[PROMOTE]"}
          </button>
        )}
      </div>
    </div>
  );
}

function OverviewView({
  data,
  onSelectShadow,
  onViewChange,
  onWorkAction,
  actionLoading,
}: {
  data: ShadowOverviewResponse;
  onSelectShadow: (shadow: ShadowSoldier) => void;
  onViewChange: (view: PanelView) => void;
  onWorkAction: (action: "start" | "collect") => void;
  actionLoading: boolean;
}) {
  const hasWorkingResources = Object.values(data.total_resources_pending).some(v => v > 0);

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Squad Section */}
      <div className="border-b border-[var(--slate)]">
        <button
          onClick={() => onViewChange("squad")}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--stone)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--amber)]">◆</span>
            <span className="text-[var(--fog)] uppercase tracking-wider">Active Squad</span>
          </div>
          <span className="text-[var(--mist)] font-mono">
            {data.squad_size}/{data.max_squad_size} &gt;
          </span>
        </button>
        {data.squad.length > 0 && (
          <div className="px-2 pb-2 space-y-0.5">
            {data.squad.slice(0, 3).map((shadow) => (
              <ShadowRow
                key={shadow.id}
                shadow={shadow}
                onClick={() => onSelectShadow(shadow)}
                selected={false}
              />
            ))}
            {data.squad.length > 3 && (
              <div className="text-center text-[var(--mist)] py-1">
                +{data.squad.length - 3} more
              </div>
            )}
          </div>
        )}
        {data.squad.length === 0 && (
          <div className="px-3 pb-2 text-[var(--mist)]">No shadows in squad</div>
        )}
      </div>

      {/* Working Section */}
      <div className="border-b border-[var(--slate)]">
        <button
          onClick={() => onViewChange("working")}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--stone)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--arcane)]">⚙</span>
            <span className="text-[var(--fog)] uppercase tracking-wider">Working</span>
          </div>
          <span className="text-[var(--mist)] font-mono">
            {data.working_count} &gt;
          </span>
        </button>
        {data.working_count > 0 && (
          <div className="px-3 pb-2">
            <div className="flex justify-between text-[var(--mist)]">
              <span>XP Pending</span>
              <span className="text-[var(--arcane)]">+{data.total_xp_pending}</span>
            </div>
            {hasWorkingResources && (
              <div className="flex justify-between text-[var(--mist)]">
                <span>Resources</span>
                <span className="text-[var(--amber)]">
                  {Object.entries(data.total_resources_pending)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
        {/* Work Actions */}
        <div className="px-3 pb-2 flex gap-2">
          {data.idle_count > 0 && (
            <button
              onClick={() => onWorkAction("start")}
              disabled={actionLoading}
              className="flex-1 py-1 text-[10px] border border-[var(--arcane)] text-[var(--arcane)] hover:bg-[var(--arcane)] hover:text-[var(--void)] transition-all disabled:opacity-50"
            >
              {actionLoading ? "..." : `START WORK (${data.idle_count})`}
            </button>
          )}
          {(data.total_xp_pending > 0 || hasWorkingResources) && (
            <button
              onClick={() => onWorkAction("collect")}
              disabled={actionLoading}
              className="flex-1 py-1 text-[10px] border border-[var(--amber)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--void)] transition-all disabled:opacity-50"
            >
              {actionLoading ? "..." : "COLLECT"}
            </button>
          )}
        </div>
      </div>

      {/* Shadow Realm Section */}
      <button
        onClick={() => onViewChange("realm")}
        className="px-3 py-2 flex items-center justify-between hover:bg-[var(--stone)] transition-colors border-b border-[var(--slate)]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--mist)]">◐</span>
          <span className="text-[var(--fog)] uppercase tracking-wider">Shadow Realm</span>
        </div>
        <span className="text-[var(--mist)] font-mono">
          VIEW ALL &gt;
        </span>
      </button>

      {/* 24h Stats */}
      {data.xp_earned_24h > 0 && (
        <div className="px-3 py-2 bg-[var(--shadow)]">
          <div className="text-[var(--mist)] text-[10px] uppercase tracking-wider mb-1">
            Last 24 Hours
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--mist)]">XP Earned</span>
            <span className="text-[var(--arcane)]">+{data.xp_earned_24h}</span>
          </div>
          {Object.entries(data.resources_earned_24h).filter(([, v]) => v > 0).length > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--mist)]">Resources</span>
              <span className="text-[var(--amber)]">
                {Object.entries(data.resources_earned_24h)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => `${v} ${k}`)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ShadowsPanel({ isOpen, onClose, worldId }: ShadowsPanelProps) {
  const [view, setView] = useState<PanelView>("overview");
  const [overview, setOverview] = useState<ShadowOverviewResponse | null>(null);
  const [realmShadows, setRealmShadows] = useState<ShadowSoldier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShadow, setSelectedShadow] = useState<ShadowSoldier | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const refreshData = useCallback(async () => {
    if (!worldId) return;
    try {
      const data = await api.getShadowOverview(worldId);
      setOverview(data);
      return data;
    } catch (err) {
      console.error("Failed to refresh shadow data:", err);
    }
  }, [worldId]);

  const fetchRealm = useCallback(async () => {
    if (!worldId) return;
    try {
      const data = await api.getShadowRealm(worldId);
      setRealmShadows(data.shadows);
    } catch (err) {
      console.error("Failed to fetch realm:", err);
    }
  }, [worldId]);

  // Initial load
  useEffect(() => {
    if (isOpen && worldId) {
      setLoading(true);
      setError(null);
      setView("overview");
      setSelectedShadow(null);

      api
        .getShadowOverview(worldId)
        .then((data) => {
          setOverview(data);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, worldId]);

  // Fetch realm when switching to realm view
  useEffect(() => {
    if (view === "realm" && worldId && realmShadows.length === 0) {
      fetchRealm();
    }
  }, [view, worldId, realmShadows.length, fetchRealm]);

  const handleAction = useCallback(async (action: string, shadowId: string) => {
    if (!worldId) return;
    setActionLoading(true);
    try {
      switch (action) {
        case "summon":
          await api.summonShadow(worldId, shadowId);
          break;
        case "dismiss":
          await api.dismissShadow(worldId, shadowId);
          break;
        case "resurrect":
          await api.resurrectShadow(worldId, shadowId);
          break;
        case "promote":
          await api.promoteShadow(worldId, shadowId);
          break;
      }
      await refreshData();
      if (selectedShadow) {
        const updated = await api.getShadowDetail(worldId, shadowId);
        setSelectedShadow(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }, [worldId, selectedShadow, refreshData]);

  const handleWorkAction = useCallback(async (action: "start" | "collect") => {
    if (!worldId) return;
    setActionLoading(true);
    try {
      if (action === "start") {
        await api.startShadowWork(worldId);
      } else {
        await api.collectShadowWork(worldId);
      }
      await refreshData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }, [worldId, refreshData]);

  const handleSelectShadow = useCallback((shadow: ShadowSoldier) => {
    setSelectedShadow(shadow);
    setView("detail");
  }, []);

  const handleBack = useCallback(() => {
    if (view === "detail") {
      setView("overview");
      setSelectedShadow(null);
    } else {
      setView("overview");
    }
  }, [view]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view !== "overview") {
          handleBack();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, view, handleBack, onClose]);

  if (!isOpen) return null;

  const totalShadows = overview
    ? overview.squad.length + overview.working_count + overview.idle_count
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          )`,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-[var(--void)] border-2 border-[var(--slate)] w-full max-w-2xl max-h-[80vh] flex flex-col font-mono shadow-2xl"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* CRT effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(255,255,255,0.1) 1px,
              rgba(255,255,255,0.1) 2px
            )`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-[var(--slate)] bg-[var(--shadow)]">
          <div className="flex items-center gap-3">
            {view !== "overview" && (
              <button
                onClick={handleBack}
                className="text-[var(--mist)] hover:text-[var(--fog)] transition-colors"
              >
                &lt;
              </button>
            )}
            <span className="text-[var(--amber)] font-bold tracking-wider">◐ SHADOW ARMY ◐</span>
            {overview && (
              <span className="text-[var(--mist)] text-xs">
                [{totalShadows} shadows]
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--mist)] text-xs hidden sm:block">
              ESC {view !== "overview" ? "back" : "close"}
            </span>
            <button
              onClick={onClose}
              className="text-[var(--mist)] hover:text-[var(--crimson)] transition-colors font-bold"
            >
              [×]
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[var(--amber)] animate-pulse">◌ LOADING ◌</div>
            <div className="text-[var(--mist)] text-xs mt-2">Accessing shadow realm...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-[var(--crimson)]">⚠ ERROR</div>
            <div className="text-[var(--mist)] text-xs mt-2">{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-1 text-xs border border-[var(--slate)] hover:border-[var(--mist)] transition-colors"
            >
              DISMISS
            </button>
          </div>
        ) : !worldId ? (
          <div className="p-8 text-center text-[var(--mist)]">No active world</div>
        ) : !overview ? (
          <div className="p-8 text-center text-[var(--mist)]">No shadow data</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Main content */}
            <div className="flex-1 overflow-y-auto" ref={listRef}>
              {view === "overview" && (
                <OverviewView
                  data={overview}
                  onSelectShadow={handleSelectShadow}
                  onViewChange={setView}
                  onWorkAction={handleWorkAction}
                  actionLoading={actionLoading}
                />
              )}

              {view === "squad" && (
                <div className="p-3">
                  <div className="text-[10px] text-[var(--mist)] mb-2 tracking-widest">
                    ┌─ ACTIVE SQUAD ({overview.squad_size}/{overview.max_squad_size}) ─┐
                  </div>
                  {overview.squad.length === 0 ? (
                    <div className="text-[var(--mist)] text-sm py-8 text-center border border-dashed border-[var(--slate)]">
                      ∅ No shadows in squad
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {overview.squad.map((shadow) => (
                        <ShadowRow
                          key={shadow.id}
                          shadow={shadow}
                          onClick={() => handleSelectShadow(shadow)}
                          selected={selectedShadow?.id === shadow.id}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-[var(--mist)] text-[10px]">
                    Total Power: <span className="text-[var(--amber)]">{overview.squad_total_power}</span>
                  </div>
                </div>
              )}

              {view === "working" && (
                <div className="p-3">
                  <div className="text-[10px] text-[var(--mist)] mb-2 tracking-widest">
                    ┌─ WORKING SHADOWS ({overview.working_count}) ─┐
                  </div>
                  {overview.working.length === 0 ? (
                    <div className="text-[var(--mist)] text-sm py-8 text-center border border-dashed border-[var(--slate)]">
                      ∅ No shadows working
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {overview.working.map((shadow) => (
                        <ShadowRow
                          key={shadow.id}
                          shadow={shadow}
                          onClick={() => handleSelectShadow(shadow)}
                          selected={selectedShadow?.id === shadow.id}
                          showWorkStatus
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === "realm" && (
                <div className="p-3">
                  <div className="text-[10px] text-[var(--mist)] mb-2 tracking-widest">
                    ┌─ SHADOW REALM ─┐
                  </div>
                  {realmShadows.length === 0 ? (
                    <div className="text-[var(--mist)] text-sm py-8 text-center border border-dashed border-[var(--slate)]">
                      ∅ No shadows extracted yet
                      <div className="text-[10px] mt-2">Defeat enemies and use [arise] to extract shadows</div>
                    </div>
                  ) : (
                    <>
                      {/* Group by grade */}
                      {GRADE_ORDER.map((grade) => {
                        const gradeShadows = realmShadows.filter(s => s.grade === grade);
                        if (gradeShadows.length === 0) return null;
                        return (
                          <div key={grade} className="mb-4">
                            <div
                              className="text-xs uppercase tracking-wider mb-1 px-1"
                              style={{ color: GRADE_COLORS[grade] }}
                            >
                              {grade} ({gradeShadows.length})
                            </div>
                            <div className="space-y-0.5">
                              {gradeShadows.map((shadow) => (
                                <ShadowRow
                                  key={shadow.id}
                                  shadow={shadow}
                                  onClick={() => handleSelectShadow(shadow)}
                                  selected={selectedShadow?.id === shadow.id}
                                  showWorkStatus
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Detail sidebar */}
            {view === "detail" && selectedShadow && worldId && (
              <div className="w-64 bg-[var(--shadow)] overflow-y-auto border-l border-[var(--slate)]">
                <ShadowDetail
                  shadow={selectedShadow}
                  worldId={worldId}
                  onAction={handleAction}
                  actionLoading={actionLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-1.5 border-t-2 border-[var(--slate)] bg-[var(--shadow)] text-[10px] text-[var(--mist)] flex justify-between">
          <span>TEXTLANDS v1.0</span>
          <span>◐ SHADOW SYSTEM ◐</span>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
