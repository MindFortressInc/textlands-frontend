"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { RegionalWallet, RegionalStanding, ExchangeQuote } from "@/lib/api";

interface CurrencyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string | null;
  playerId: string | null;
}

const STANDING_COLORS: Record<string, string> = {
  exalted: "var(--amber)",
  honored: "#22c55e",
  friendly: "#86efac",
  neutral: "var(--mist)",
  unfriendly: "#fbbf24",
  hostile: "#f97316",
  hated: "var(--crimson)",
};

const STANDING_ICONS: Record<string, string> = {
  exalted: "★★★",
  honored: "★★☆",
  friendly: "★☆☆",
  neutral: "───",
  unfriendly: "▼☆☆",
  hostile: "▼▼☆",
  hated: "▼▼▼",
};

const AFFINITY_INFO: Record<string, { fee: string; desc: string }> = {
  allied: { fee: "2%", desc: "Trade partners" },
  friendly: { fee: "10%", desc: "Regular trade" },
  neutral: { fee: "25%", desc: "Some contact" },
  distant: { fee: "50%", desc: "Rare trade" },
  hostile: { fee: "90%", desc: "Black market" },
};

function WalletCard({
  wallet,
  standing,
  selected,
  onClick,
}: {
  wallet: RegionalWallet;
  standing?: RegionalStanding;
  selected: boolean;
  onClick: () => void;
}) {
  // Use standing if available, fall back to reputation_tier
  const standingLevel = standing?.standing || standing?.reputation_tier || "neutral";
  const hasBalance = wallet.balance > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border transition-all duration-150
        ${selected
          ? "bg-[var(--stone)] border-[var(--amber)]"
          : "border-[var(--slate)] hover:border-[var(--mist)] hover:bg-[var(--shadow)]"
        }
        ${!hasBalance ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--mist)] truncate">{wallet.region_name}</div>
          <div className="text-lg font-bold text-[var(--text)] flex items-baseline gap-1">
            <span className="text-[var(--amber)]">{wallet.currency_symbol}</span>
            <span>{wallet.balance.toLocaleString()}</span>
          </div>
          <div className="text-xs text-[var(--fog)]">{wallet.currency_name}</div>
        </div>
        <div className="text-right">
          <div
            className="text-xs font-mono"
            style={{ color: STANDING_COLORS[standingLevel] }}
          >
            {STANDING_ICONS[standingLevel] || "───"}
          </div>
          <div
            className="text-[10px] uppercase tracking-wide"
            style={{ color: STANDING_COLORS[standingLevel] }}
          >
            {standingLevel}
          </div>
        </div>
      </div>
      {standing?.bounty && standing.bounty > 0 && (
        <div className="mt-2 text-xs text-[var(--crimson)] flex items-center gap-1">
          <span>⚠</span>
          <span>BOUNTY: {standing.bounty}</span>
        </div>
      )}
      {standing?.exile && (
        <div className="mt-1 text-xs text-[var(--crimson)]">◆ EXILED ◆</div>
      )}
      {standing?.citizenship && (
        <div className="mt-1 text-xs text-[var(--amber)]">◆ CITIZEN ◆</div>
      )}
    </button>
  );
}

function ExchangeView({
  wallets,
  worldId,
  playerId,
  onExchangeComplete,
}: {
  wallets: RegionalWallet[];
  worldId: string;
  playerId: string;
  onExchangeComplete: () => void;
}) {
  const [fromRegion, setFromRegion] = useState<string>("");
  const [toRegion, setToRegion] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quote, setQuote] = useState<ExchangeQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const walletsWithBalance = wallets.filter((w) => w.balance > 0);

  const getQuote = useCallback(async () => {
    if (!fromRegion || !toRegion || !amount || fromRegion === toRegion) {
      setQuote(null);
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const q = await api.getExchangeQuote(worldId, playerId, fromRegion, toRegion, numAmount);
      setQuote(q);
    } catch (e) {
      setError((e as Error).message);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [fromRegion, toRegion, amount, worldId, playerId]);

  useEffect(() => {
    const timer = setTimeout(getQuote, 300);
    return () => clearTimeout(timer);
  }, [getQuote]);

  const executeExchange = async () => {
    if (!quote || !fromRegion || !toRegion) return;

    setExecuting(true);
    setError(null);
    try {
      await api.executeCurrencyExchange(
        worldId,
        playerId,
        fromRegion,
        toRegion,
        parseInt(amount, 10)
      );
      setAmount("");
      setQuote(null);
      onExchangeComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  const fromWallet = wallets.find((w) => w.region_id === fromRegion);
  const toWallet = wallets.find((w) => w.region_id === toRegion);

  return (
    <div className="p-3 space-y-4 font-mono text-sm">
      <div className="text-[10px] text-[var(--mist)] tracking-widest">┌─ EXCHANGE ─┐</div>

      {/* From Selection */}
      <div>
        <label className="text-xs text-[var(--mist)] block mb-1">FROM</label>
        <select
          value={fromRegion}
          onChange={(e) => setFromRegion(e.target.value)}
          className="w-full bg-[var(--void)] border border-[var(--slate)] px-2 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
        >
          <option value="">Select region...</option>
          {walletsWithBalance.map((w) => (
            <option key={w.region_id} value={w.region_id}>
              {w.region_name} ({w.currency_symbol}{w.balance})
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs text-[var(--mist)] block mb-1">AMOUNT</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            max={fromWallet?.balance || 0}
            className="flex-1 bg-[var(--void)] border border-[var(--slate)] px-2 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
          />
          {fromWallet && (
            <button
              onClick={() => setAmount(fromWallet.balance.toString())}
              className="px-2 text-xs text-[var(--mist)] border border-[var(--slate)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors"
            >
              MAX
            </button>
          )}
        </div>
        {fromWallet && (
          <div className="text-[10px] text-[var(--mist)] mt-1">
            Available: {fromWallet.currency_symbol}{fromWallet.balance}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="text-center text-[var(--mist)]">↓</div>

      {/* To Selection */}
      <div>
        <label className="text-xs text-[var(--mist)] block mb-1">TO</label>
        <select
          value={toRegion}
          onChange={(e) => setToRegion(e.target.value)}
          className="w-full bg-[var(--void)] border border-[var(--slate)] px-2 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
        >
          <option value="">Select region...</option>
          {wallets
            .filter((w) => w.region_id !== fromRegion)
            .map((w) => (
              <option key={w.region_id} value={w.region_id}>
                {w.region_name} ({w.currency_name})
              </option>
            ))}
        </select>
      </div>

      {/* Quote Display */}
      {loading && (
        <div className="text-center text-[var(--mist)] py-4">
          ◌ Getting quote...
        </div>
      )}

      {error && (
        <div className="text-[var(--crimson)] text-xs p-2 border border-[var(--crimson)] bg-[var(--crimson)]/10">
          ⚠ {error}
        </div>
      )}

      {quote && !loading && (
        <div className="border border-[var(--slate)] bg-[var(--void)]">
          <div className="text-xs text-[var(--mist)] px-2 py-1 border-b border-[var(--slate)] bg-[var(--shadow)]">
            ┌─ QUOTE ─┐
          </div>
          <div className="p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--mist)]">You send</span>
              <span className="text-[var(--text)]">
                {fromWallet?.currency_symbol}{quote.from_amount}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--mist)]">Rate</span>
              <span className="text-[var(--fog)]">
                1 = {quote.exchange_rate.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--mist)]">Fee</span>
              <span className="text-[var(--crimson)]">
                {(quote.fee_percent * 100).toFixed(0)}%
              </span>
            </div>
            <div className="border-t border-[var(--slate)] pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-[var(--mist)]">You receive</span>
                <span className="text-[var(--amber)] font-bold text-lg">
                  {toWallet?.currency_symbol}{quote.to_amount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execute Button */}
      {quote && (
        <button
          onClick={executeExchange}
          disabled={executing}
          className="w-full py-2 bg-[var(--amber)] text-[var(--void)] font-bold hover:bg-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {executing ? "◌ EXCHANGING..." : "◆ CONFIRM EXCHANGE ◆"}
        </button>
      )}

      {/* Info */}
      <div className="text-[10px] text-[var(--mist)] space-y-1 pt-2 border-t border-[var(--slate)]">
        <div className="text-center">Find a money changer NPC for better rates</div>
        <div className="flex justify-center gap-4">
          {Object.entries(AFFINITY_INFO).slice(0, 3).map(([key, info]) => (
            <span key={key}>{key}: {info.fee}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CurrencyPanel({ isOpen, onClose, worldId, playerId }: CurrencyPanelProps) {
  const [wallets, setWallets] = useState<RegionalWallet[]>([]);
  const [standings, setStandings] = useState<RegionalStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<RegionalWallet | null>(null);
  const [view, setView] = useState<"wallets" | "exchange">("wallets");

  const fetchData = useCallback(async () => {
    if (!worldId || !playerId) return;

    setLoading(true);
    setError(null);
    try {
      const [walletsData, standingsData] = await Promise.all([
        api.getPlayerCurrencies(worldId, playerId),
        api.getRegionalStanding(worldId, playerId),
      ]);
      setWallets(walletsData);
      setStandings(standingsData);
      if (walletsData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletsData[0]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [worldId, playerId, selectedWallet]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Tab") {
        e.preventDefault();
        setView((v) => (v === "wallets" ? "exchange" : "wallets"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalWealth = wallets.reduce((sum, w) => sum + w.balance, 0);
  const getStanding = (regionId: string) =>
    standings.find((s) => s.region_id === regionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with scanlines */}
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
        className="relative bg-[var(--void)] border-2 border-[var(--slate)] w-full max-w-3xl max-h-[80vh] flex flex-col font-mono shadow-2xl"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* CRT overlay */}
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
            <span className="text-[var(--amber)] font-bold tracking-wider">◆ WEALTH ◆</span>
            <span className="text-[var(--mist)] text-xs">
              [{wallets.length} regions]
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--mist)] text-xs hidden sm:block">
              TAB switch • ESC close
            </span>
            <button
              onClick={onClose}
              className="text-[var(--mist)] hover:text-[var(--crimson)] transition-colors font-bold"
            >
              [×]
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[var(--slate)]">
          <button
            onClick={() => setView("wallets")}
            className={`flex-1 py-2 text-sm transition-colors ${
              view === "wallets"
                ? "bg-[var(--stone)] text-[var(--amber)] border-b-2 border-[var(--amber)]"
                : "text-[var(--mist)] hover:text-[var(--text)]"
            }`}
          >
            ◇ WALLETS
          </button>
          <button
            onClick={() => setView("exchange")}
            className={`flex-1 py-2 text-sm transition-colors ${
              view === "exchange"
                ? "bg-[var(--stone)] text-[var(--amber)] border-b-2 border-[var(--amber)]"
                : "text-[var(--mist)] hover:text-[var(--text)]"
            }`}
          >
            ⇄ EXCHANGE
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[var(--amber)] animate-pulse">◌ LOADING ◌</div>
            <div className="text-[var(--mist)] text-xs mt-2">Counting coins...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-[var(--crimson)]">⚠ ERROR</div>
            <div className="text-[var(--mist)] text-xs mt-2">{error}</div>
          </div>
        ) : !worldId || !playerId ? (
          <div className="p-8 text-center text-[var(--mist)]">
            No active session
          </div>
        ) : view === "wallets" ? (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Total Wealth */}
            <div className="mb-4 p-3 border border-[var(--amber)] bg-[var(--shadow)]">
              <div className="text-xs text-[var(--mist)]">TOTAL WEALTH (estimate)</div>
              <div className="text-2xl font-bold text-[var(--amber)]">
                ≈ {totalWealth.toLocaleString()} units
              </div>
            </div>

            {/* Wallets Grid */}
            <div className="text-[10px] text-[var(--mist)] mb-2 tracking-widest">
              ┌─ REGIONAL CURRENCIES ─┐
            </div>
            {wallets.length === 0 ? (
              <div className="text-[var(--mist)] text-sm py-8 text-center border border-dashed border-[var(--slate)]">
                ∅ No currencies yet
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {wallets.map((wallet) => (
                  <WalletCard
                    key={wallet.region_id}
                    wallet={wallet}
                    standing={getStanding(wallet.region_id)}
                    selected={selectedWallet?.region_id === wallet.region_id}
                    onClick={() => setSelectedWallet(wallet)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ExchangeView
              wallets={wallets}
              worldId={worldId}
              playerId={playerId}
              onExchangeComplete={fetchData}
            />
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-1.5 border-t-2 border-[var(--slate)] bg-[var(--shadow)] text-[10px] text-[var(--mist)] flex justify-between">
          <span>TEXTLANDS v1.0</span>
          <span>◆ ECONOMY SYSTEM ◆</span>
        </div>
      </div>
    </div>
  );
}
