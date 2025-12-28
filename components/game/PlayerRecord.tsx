"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { Infraction, Bounty } from "@/types/game";

interface PlayerRecordProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
  playerId: string | null;
  isDemo: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SeverityBadge({ severity }: { severity: Infraction["severity"] }) {
  const styles: Record<Infraction["severity"], { bg: string; text: string; label: string }> = {
    minor: { bg: "var(--mist)/20", text: "var(--mist)", label: "MINOR" },
    moderate: { bg: "var(--amber-dim)/20", text: "var(--amber)", label: "MODERATE" },
    serious: { bg: "var(--crimson)/20", text: "var(--crimson)", label: "SERIOUS" },
    heinous: { bg: "var(--crimson)/40", text: "var(--crimson)", label: "HEINOUS" },
  };

  const style = styles[severity] || styles.minor;

  return (
    <span
      className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {style.label}
    </span>
  );
}

function InfractionRow({ infraction }: { infraction: Infraction }) {
  return (
    <div className="px-4 py-3 border-b border-[var(--slate)] last:border-b-0 hover:bg-[var(--shadow)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text)] font-medium">
              {infraction.crime_type}
            </span>
            <SeverityBadge severity={infraction.severity} />
            {infraction.resolved && (
              <span className="text-[var(--arcane)] text-[10px]">✓ RESOLVED</span>
            )}
          </div>

          <div className="text-[var(--mist)] text-xs mt-1">
            {infraction.description}
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--mist)]">
            {infraction.victim_name && (
              <span>
                Victim: <span className="text-[var(--text)]">{infraction.victim_name}</span>
              </span>
            )}
            {infraction.location_name && (
              <span>
                Location: <span className="text-[var(--text)]">{infraction.location_name}</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[var(--mist)] text-[10px]">
            {formatDate(infraction.occurred_at)}
          </div>
          {infraction.resolved && infraction.resolved_at && (
            <div className="text-[var(--arcane)] text-[10px] mt-1">
              Resolved: {formatDate(infraction.resolved_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlayerRecord({
  isOpen,
  onClose,
  worldId,
  playerId,
  isDemo,
}: PlayerRecordProps) {
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [activeBounties, setActiveBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || isDemo || !worldId || !playerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [infractionsData, bountiesData] = await Promise.all([
          api.getPlayerInfractions(worldId, playerId),
          api.getPlayerBounties(worldId, playerId),
        ]);
        setInfractions(infractionsData);
        setActiveBounties(bountiesData.filter(b => b.status === "active"));
      } catch {
        // Silently fail
      }
      setLoading(false);
    };

    fetchData();
  }, [isOpen, worldId, playerId, isDemo]);

  if (!isOpen) return null;

  const unresolvedCount = infractions.filter(i => !i.resolved).length;
  const totalBounty = activeBounties.reduce((sum, b) => sum + b.bounty_amount, 0);

  // Calculate "reputation" based on infractions
  const severityScores = { minor: 1, moderate: 3, serious: 7, heinous: 15 };
  const criminalScore = infractions.reduce(
    (sum, i) => sum + (i.resolved ? severityScores[i.severity] * 0.3 : severityScores[i.severity]),
    0
  );

  const getReputation = (score: number): { label: string; color: string } => {
    if (score === 0) return { label: "Lawful Citizen", color: "var(--arcane)" };
    if (score < 5) return { label: "Petty Criminal", color: "var(--mist)" };
    if (score < 15) return { label: "Known Troublemaker", color: "var(--amber)" };
    if (score < 30) return { label: "Dangerous Outlaw", color: "var(--crimson)" };
    return { label: "Public Enemy", color: "var(--crimson)" };
  };

  const reputation = getReputation(criminalScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--void)] border border-[var(--slate)] rounded-lg overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative p-4 border-b border-[var(--slate)] bg-[var(--shadow)]">
          <div className="text-center">
            <div className="text-[var(--mist)] text-[10px] font-mono opacity-70 select-none">
              ┌─────────────────────────────┐
            </div>
            <div className="text-[var(--text)] text-lg font-bold tracking-wider py-1">
              CRIMINAL RECORD
            </div>
            <div className="text-[var(--mist)] text-[10px] font-mono opacity-70 select-none">
              └─────────────────────────────┘
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Summary card */}
        <div className="p-4 bg-[var(--stone)] border-b border-[var(--slate)]">
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Status */}
            <div>
              <div className="text-[10px] text-[var(--mist)] uppercase tracking-wide mb-1">
                Status
              </div>
              <div className="font-bold" style={{ color: reputation.color }}>
                {reputation.label}
              </div>
            </div>

            {/* Active bounties */}
            <div>
              <div className="text-[10px] text-[var(--mist)] uppercase tracking-wide mb-1">
                Bounty
              </div>
              <div className={`font-bold ${totalBounty > 0 ? "text-[var(--amber)]" : "text-[var(--mist)]"}`}>
                {totalBounty > 0 ? `${totalBounty}g` : "None"}
              </div>
            </div>

            {/* Open cases */}
            <div>
              <div className="text-[10px] text-[var(--mist)] uppercase tracking-wide mb-1">
                Open Cases
              </div>
              <div className={`font-bold ${unresolvedCount > 0 ? "text-[var(--crimson)]" : "text-[var(--arcane)]"}`}>
                {unresolvedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isDemo ? (
            <div className="text-center py-12 text-[var(--mist)]">
              <p>Criminal records unavailable in demo mode</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-[var(--mist)]">
              <div className="animate-pulse">Accessing records...</div>
            </div>
          ) : infractions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[var(--arcane)] text-4xl mb-4">⚖</div>
              <div className="text-[var(--text)] font-bold">Clean Record</div>
              <div className="text-[var(--mist)] text-sm mt-2">
                No crimes on file. You are a model citizen.
              </div>
              <div className="mt-4 inline-block px-3 py-1 bg-[var(--arcane)]/10 border border-[var(--arcane)]/30 rounded text-[var(--arcane)] text-xs">
                REPUTATION: LAWFUL
              </div>
            </div>
          ) : (
            <div>
              {/* Section header */}
              <div className="px-4 py-2 bg-[var(--shadow)] border-b border-[var(--slate)] sticky top-0">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--mist)] text-xs font-bold tracking-wider">
                    INFRACTIONS ({infractions.length})
                  </span>
                  <span className="text-[var(--mist)] text-[10px]">
                    {unresolvedCount} unresolved
                  </span>
                </div>
              </div>

              {/* Infractions list */}
              {infractions.map((infraction) => (
                <InfractionRow key={infraction.id} infraction={infraction} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)] bg-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div className="text-[var(--mist)] text-xs">
              {unresolvedCount > 0 ? (
                <span>
                  <span className="text-[var(--amber)]">!</span> Pay bounties to clear your name
                </span>
              ) : infractions.length > 0 ? (
                <span className="text-[var(--arcane)]">All matters resolved</span>
              ) : (
                <span>Keep it clean, citizen</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
