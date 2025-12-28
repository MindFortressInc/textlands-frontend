"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { Bounty } from "@/types/game";

interface WantedStatusProps {
  worldId: string | null;
  playerId: string | null;
  onViewBounties?: () => void;
  onViewRecord?: () => void;
}

function formatGold(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toString();
}

export function WantedStatus({
  worldId,
  playerId,
  onViewBounties,
  onViewRecord,
}: WantedStatusProps) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [payingOff, setPayingOff] = useState<string | null>(null);

  useEffect(() => {
    if (!worldId || !playerId) return;

    const fetchBounties = async () => {
      setLoading(true);
      try {
        const data = await api.getPlayerBounties(worldId, playerId);
        setBounties(data.filter(b => b.status === "active"));
      } catch {
        // Silently fail
      }
      setLoading(false);
    };

    fetchBounties();

    // Refresh periodically
    const interval = setInterval(fetchBounties, 60000);
    return () => clearInterval(interval);
  }, [worldId, playerId]);

  const handlePayOff = async (bountyId: string) => {
    setPayingOff(bountyId);
    try {
      const result = await api.payOffBounty(bountyId);
      if (result.success) {
        setBounties(prev => prev.filter(b => b.id !== bountyId));
      }
    } catch {
      // Could show error toast
    }
    setPayingOff(null);
  };

  // Don't render if no bounties or loading
  if (loading || bounties.length === 0) return null;

  const totalBounty = bounties.reduce((sum, b) => sum + b.bounty_amount, 0);

  return (
    <div className="wanted-status">
      {/* Collapsed badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--crimson)]/20 border border-[var(--crimson)] rounded-lg hover:bg-[var(--crimson)]/30 transition-all group"
      >
        {/* Pulsing wanted indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--crimson)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--crimson)]"></span>
        </span>

        <span className="text-[var(--crimson)] text-xs font-bold tracking-wider">
          WANTED
        </span>

        <span className="text-[var(--amber)] text-xs font-mono">
          {formatGold(totalBounty)}g
        </span>

        <span className="text-[var(--mist)] text-xs">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--void)] border border-[var(--crimson)] rounded-lg shadow-lg overflow-hidden z-40 animate-slide-down">
          {/* Header */}
          <div className="bg-[var(--crimson)]/10 px-4 py-3 border-b border-[var(--slate)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--crimson)] font-bold text-sm">
                  ★ YOU ARE WANTED ★
                </div>
                <div className="text-[var(--mist)] text-xs mt-0.5">
                  {bounties.length} active {bounties.length === 1 ? "bounty" : "bounties"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[var(--amber)] font-bold">
                  {formatGold(totalBounty)}
                </div>
                <div className="text-[var(--mist)] text-[10px]">
                  TOTAL BOUNTY
                </div>
              </div>
            </div>
          </div>

          {/* Bounty list */}
          <div className="max-h-48 overflow-y-auto">
            {bounties.map((bounty) => (
              <div
                key={bounty.id}
                className="px-4 py-3 border-b border-[var(--slate)] last:border-b-0 hover:bg-[var(--shadow)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--text)] text-sm font-medium">
                      {bounty.crime_type}
                    </div>
                    <div className="text-[var(--mist)] text-xs truncate mt-0.5">
                      {bounty.crime_description}
                    </div>
                    {bounty.victim_name && (
                      <div className="text-[var(--mist)] text-[10px] mt-1">
                        vs. {bounty.victim_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[var(--amber)] text-sm font-mono">
                      {formatGold(bounty.bounty_amount)}g
                    </div>
                    <button
                      onClick={() => handlePayOff(bounty.id)}
                      disabled={payingOff === bounty.id}
                      className="text-[10px] text-[var(--arcane)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingOff === bounty.id ? "..." : "PAY OFF"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 bg-[var(--shadow)] border-t border-[var(--slate)] flex gap-2">
            {onViewBounties && (
              <button
                onClick={onViewBounties}
                className="flex-1 px-3 py-1.5 text-xs bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
              >
                Bounty Board
              </button>
            )}
            {onViewRecord && (
              <button
                onClick={onViewRecord}
                className="flex-1 px-3 py-1.5 text-xs bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
              >
                My Record
              </button>
            )}
          </div>

          {/* Warning */}
          <div className="px-4 py-2 bg-[var(--crimson)]/5 border-t border-[var(--slate)]">
            <div className="text-[var(--mist)] text-[10px] text-center italic">
              Other players may hunt you for the reward
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
