"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import { useUIStrings } from "@/contexts/UIStringsContext";

interface BillingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOKEN_PACKS: { id: api.TokenPack; name: string; tokens: number; price: string }[] = [
  { id: "starter", name: "Starter", tokens: 5, price: "$2" },
  { id: "standard", name: "Standard", tokens: 15, price: "$5" },
  { id: "value", name: "Value Pack", tokens: 50, price: "$15" },
];

export function BillingPanel({ isOpen, onClose }: BillingPanelProps) {
  const { t } = useUIStrings();
  const [subscription, setSubscription] = useState<api.SubscriptionStatus | null>(null);
  const [tokens, setTokens] = useState<api.TokenBalance | null>(null);
  const [playtime, setPlaytime] = useState<api.PlaytimeStatus | null>(null);
  const [freeUses, setFreeUses] = useState<api.FreeUsesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBillingData();
    }
  }, [isOpen]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [sub, tok, play, free] = await Promise.all([
        api.getSubscription().catch((err) => { console.error("[Billing] Subscription:", err); return null; }),
        api.getTokenBalance().catch((err) => { console.error("[Billing] Tokens:", err); return null; }),
        api.getPlaytime().catch((err) => { console.error("[Billing] Playtime:", err); return null; }),
        api.getFreeUses().catch((err) => { console.error("[Billing] Free uses:", err); return null; }),
      ]);
      setSubscription(sub);
      setTokens(tok);
      setPlaytime(play);
      setFreeUses(free);
    } catch (err) {
      console.error("[Billing] Failed to load billing data:", err);
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      const { checkout_url } = await api.createSubscription();
      window.location.href = checkout_url;
    } catch (err) {
      console.error("Failed to start subscription checkout:", err);
    }
    setPurchasing(false);
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Cancel your Plus subscription? You'll keep access until the end of your billing period.")) {
      return;
    }
    setPurchasing(true);
    try {
      await api.cancelSubscription();
      await loadBillingData();
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    }
    setPurchasing(false);
  };

  const handleBuyTokens = async (pack: api.TokenPack) => {
    setPurchasing(true);
    try {
      const { checkout_url } = await api.purchaseTokens(pack);
      window.location.href = checkout_url;
    } catch (err) {
      console.error("Failed to start token checkout:", err);
    }
    setPurchasing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--stone)] shrink-0">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">ACCOUNT</h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[var(--mist)] animate-pulse">Loading...</p>
            </div>
          ) : (
            <>
              {/* Subscription Status */}
              <div>
                <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
                  <span className="text-[var(--amber)]">*</span>
                  Subscription
                </h3>

                {subscription?.is_active ? (
                  <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--arcane)]/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[var(--arcane)] font-bold">PLUS</span>
                      <span className="text-[var(--arcane)] text-xs">$10/mo</span>
                    </div>
                    <p className="text-[var(--text-dim)] text-sm mb-3">
                      Unlimited playtime, 5 death recoveries & rerolls per month
                    </p>
                    {subscription.cancel_at_period_end ? (
                      <p className="text-[var(--crimson)] text-xs">
                        {t("cancels_at_period_end")}
                      </p>
                    ) : (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={purchasing}
                        className="text-[var(--mist)] text-xs hover:text-[var(--crimson)] transition-colors disabled:opacity-50"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--slate)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[var(--mist)] font-bold">FREE</span>
                      <span className="text-[var(--mist)] text-xs">Limited</span>
                    </div>
                    <p className="text-[var(--text-dim)] text-sm mb-4">
                      30 min daily playtime, limited features
                    </p>
                    <button
                      onClick={handleSubscribe}
                      disabled={purchasing}
                      className="w-full px-4 py-2 rounded bg-[var(--amber)] text-[var(--void)] font-bold hover:bg-[var(--amber-dim)] transition-colors disabled:opacity-50"
                    >
                      Upgrade to Plus - $10/mo
                    </button>
                  </div>
                )}
              </div>

              {/* Playtime (for free users) */}
              {playtime && !playtime.is_subscriber && (
                <div>
                  <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
                    <span className="text-[var(--arcane)]">*</span>
                    Daily Playtime
                  </h3>
                  <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--slate)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[var(--text)]">{formatTime(playtime.remaining_seconds)} remaining</span>
                      <span className="text-[var(--mist)] text-xs">of 30:00</span>
                    </div>
                    <div className="h-2 bg-[var(--stone)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--arcane)] transition-all"
                        style={{ width: `${(playtime.remaining_seconds / playtime.daily_limit_seconds) * 100}%` }}
                      />
                    </div>
                    <p className="text-[var(--mist)] text-xs mt-2">
                      {t("resets_daily")}
                    </p>
                  </div>
                </div>
              )}

              {/* Token Balance */}
              <div>
                <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
                  <span className="text-[var(--amber)]">*</span>
                  Tokens
                </h3>
                <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--slate)] mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--amber)] text-2xl font-bold">
                      {tokens?.balance ?? 0}
                    </span>
                    <span className="text-[var(--mist)] text-xs">tokens</span>
                  </div>
                  <p className="text-[var(--text-dim)] text-xs mt-1">
                    {t("token_uses")}
                  </p>
                </div>

                {/* Token Packs */}
                <div className="grid grid-cols-3 gap-2">
                  {TOKEN_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => handleBuyTokens(pack.id)}
                      disabled={purchasing}
                      className="p-3 rounded bg-[var(--stone)] border border-[var(--slate)] hover:border-[var(--amber-dim)] transition-colors disabled:opacity-50 text-center"
                    >
                      <div className="text-[var(--amber)] font-bold">{pack.tokens}</div>
                      <div className="text-[var(--mist)] text-[10px]">{pack.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Uses */}
              {freeUses && (
                <div>
                  <h3 className="text-[var(--text)] font-semibold mb-3 flex items-center gap-2">
                    <span className="text-[var(--arcane)]">*</span>
                    Free Uses Remaining
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded bg-[var(--shadow)] border border-[var(--slate)]">
                      <div className="text-[var(--text)] font-bold">{freeUses.death_recoveries_remaining}</div>
                      <div className="text-[var(--mist)] text-[10px]">Recoveries</div>
                    </div>
                    <div className="p-3 rounded bg-[var(--shadow)] border border-[var(--slate)]">
                      <div className="text-[var(--text)] font-bold">{freeUses.fate_rerolls_remaining}</div>
                      <div className="text-[var(--mist)] text-[10px]">Rerolls</div>
                    </div>
                    <div className="p-3 rounded bg-[var(--shadow)] border border-[var(--slate)]">
                      <div className="text-[var(--text)] font-bold">{freeUses.nsfw_unlocks_remaining}</div>
                      <div className="text-[var(--mist)] text-[10px]">18+ Unlocks</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--stone)] shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
