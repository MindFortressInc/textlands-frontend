"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { Bounty } from "@/types/game";

interface BountyBoardProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
  playerId: string | null;
  isDemo: boolean;
}

function formatTimeRemaining(expiresAt: string | undefined): string {
  if (!expiresAt) return "∞";
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  if (diffMs <= 0) return "EXPIRED";
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatGold(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toString();
}

function BountyPoster({ bounty, onClaim, canClaim }: {
  bounty: Bounty;
  onClaim?: () => void;
  canClaim: boolean;
}) {
  const severityColors: Record<string, string> = {
    murder: "var(--crimson)",
    assault: "var(--crimson)",
    theft: "var(--amber)",
    trespassing: "var(--mist)",
    vandalism: "var(--amber-dim)",
  };

  const crimeColor = severityColors[bounty.crime_type.toLowerCase()] || "var(--crimson)";

  return (
    <div className="bounty-poster relative bg-[var(--stone)] border border-[var(--slate)] p-4 transition-all hover:border-[var(--amber-dim)] group">
      {/* ASCII border decoration */}
      <div className="absolute top-0 left-0 right-0 text-[var(--amber-dim)] text-[10px] text-center opacity-60 select-none overflow-hidden whitespace-nowrap">
        ╔{'═'.repeat(40)}╗
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-[var(--amber-dim)] text-[10px] text-center opacity-60 select-none overflow-hidden whitespace-nowrap">
        ╚{'═'.repeat(40)}╝
      </div>

      {/* WANTED header */}
      <div className="text-center mb-3 pt-2">
        <div className="text-[var(--crimson)] text-lg font-bold tracking-[0.3em] leading-none">
          ★ WANTED ★
        </div>
        <div className="text-[var(--mist)] text-[10px] tracking-widest mt-1">
          DEAD OR ALIVE
        </div>
      </div>

      {/* Target info */}
      <div className="text-center border-y border-[var(--slate)] py-3 my-2">
        <div className="text-[var(--text)] text-base font-bold">
          {bounty.target_display_name || `Outlaw #${bounty.target_player_id.slice(0, 6)}`}
        </div>
        <div className="text-[10px] text-[var(--mist)] mt-1 font-mono">
          ID: {bounty.target_player_id.slice(0, 8)}...
        </div>
      </div>

      {/* Crime */}
      <div className="text-center my-3">
        <div className="text-[var(--mist)] text-[10px] tracking-wide">FOR THE CRIME OF</div>
        <div className="text-sm font-bold mt-1" style={{ color: crimeColor }}>
          {bounty.crime_type.toUpperCase()}
        </div>
        <div className="text-[var(--mist)] text-xs mt-1 italic line-clamp-2">
          "{bounty.crime_description}"
        </div>
        {bounty.victim_name && (
          <div className="text-[var(--mist)] text-[10px] mt-2">
            Victim: <span className="text-[var(--text)]">{bounty.victim_name}</span>
          </div>
        )}
      </div>

      {/* Reward */}
      <div className="text-center border-t border-[var(--slate)] pt-3 mt-3">
        <div className="text-[var(--mist)] text-[10px] tracking-wide">REWARD</div>
        <div className="text-[var(--amber)] text-2xl font-bold mt-1">
          {formatGold(bounty.bounty_amount)} <span className="text-sm">GOLD</span>
        </div>
      </div>

      {/* Status & actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--slate)]">
        <div className="text-[10px]">
          <span className="text-[var(--mist)]">Expires: </span>
          <span className="text-[var(--text)]">{formatTimeRemaining(bounty.expires_at)}</span>
        </div>

        {bounty.status === "active" && canClaim && onClaim && (
          <button
            onClick={onClaim}
            className="px-3 py-1 text-xs bg-[var(--crimson)] text-[var(--void)] font-bold rounded hover:brightness-110 transition-all"
          >
            CLAIM
          </button>
        )}

        {bounty.status === "claimed" && (
          <div className="text-[var(--arcane)] text-xs font-bold">
            ✓ CLAIMED
          </div>
        )}

        {bounty.status === "paid_off" && (
          <div className="text-[var(--mist)] text-xs">
            SETTLED
          </div>
        )}
      </div>
    </div>
  );
}

export function BountyBoard({
  isOpen,
  onClose,
  worldId,
  playerId,
  isDemo,
}: BountyBoardProps) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || isDemo || !worldId) return;

    const fetchBounties = async () => {
      setLoading(true);
      try {
        const data = await api.getWorldBounties(worldId);
        setBounties(data);
      } catch {
        // Silently fail
      }
      setLoading(false);
    };

    fetchBounties();
  }, [isOpen, worldId, isDemo]);

  const handleClaim = async (bountyId: string) => {
    if (!playerId) return;
    setClaimingId(bountyId);
    try {
      const result = await api.claimBounty(bountyId);
      if (result.success) {
        // Update the bounty in local state
        setBounties(prev => prev.map(b =>
          b.id === bountyId ? { ...b, status: "claimed" as const } : b
        ));
      }
    } catch {
      // Could show error toast
    }
    setClaimingId(null);
  };

  if (!isOpen) return null;

  const activeBounties = bounties.filter(b => b.status === "active");
  const claimedBounties = bounties.filter(b => b.status !== "active");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--void)] border border-[var(--slate)] rounded-lg overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header with ASCII art style */}
        <div className="relative p-4 border-b border-[var(--slate)] bg-[var(--shadow)]">
          <div className="text-center">
            <div className="text-[var(--amber-dim)] text-[10px] font-mono opacity-70 select-none">
              ┌──────────────────────────────────────┐
            </div>
            <div className="text-[var(--amber)] text-xl font-bold tracking-[0.4em] py-2">
              BOUNTY BOARD
            </div>
            <div className="text-[var(--amber-dim)] text-[10px] font-mono opacity-70 select-none">
              └──────────────────────────────────────┘
            </div>
            <div className="text-[var(--mist)] text-xs mt-1">
              {activeBounties.length} active {activeBounties.length === 1 ? "bounty" : "bounties"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isDemo ? (
            <div className="text-center py-12 text-[var(--mist)]">
              <div className="text-2xl mb-2">🎭</div>
              <p>Bounty board unavailable in demo mode</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-[var(--mist)]">
              <div className="animate-pulse">Loading wanted posters...</div>
            </div>
          ) : bounties.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[var(--mist)] text-4xl mb-4">⚖</div>
              <div className="text-[var(--text)] font-bold">All Clear</div>
              <div className="text-[var(--mist)] text-sm mt-2">
                No outlaws are currently wanted in this realm.
              </div>
              <div className="text-[var(--mist)] text-xs mt-4 italic">
                "Justice prevails... for now."
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active bounties */}
              {activeBounties.length > 0 && (
                <div>
                  <div className="text-[var(--crimson)] text-xs font-bold tracking-wider mb-3 flex items-center gap-2">
                    <span className="animate-pulse">●</span> ACTIVE BOUNTIES
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeBounties.map((bounty) => (
                      <BountyPoster
                        key={bounty.id}
                        bounty={bounty}
                        onClaim={() => handleClaim(bounty.id)}
                        canClaim={bounty.target_player_id !== playerId && claimingId !== bounty.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Claimed/resolved bounties */}
              {claimedBounties.length > 0 && (
                <div>
                  <div className="text-[var(--mist)] text-xs font-bold tracking-wider mb-3">
                    RESOLVED
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 opacity-60">
                    {claimedBounties.map((bounty) => (
                      <BountyPoster
                        key={bounty.id}
                        bounty={bounty}
                        canClaim={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)] bg-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div className="text-[var(--mist)] text-xs">
              <span className="text-[var(--amber)]">TIP:</span> Capture wanted players to claim rewards
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
