"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUIStrings } from "@/contexts/UIStringsContext";
import type { AccountPromptReason } from "@/types/game";

// Session context to preserve across auth
interface SessionContext {
  world_id?: string;
  entity_id?: string;
  character_name?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: AccountPromptReason;
  incentive?: string;
  sessionContext?: SessionContext;
}

const REASON_ICONS: Record<AccountPromptReason, string> = {
  nsfw_unlock: "🔥",
  death_recovery: "💀",
  time_limit: "⏰",
};

export function AuthModal({ isOpen, onClose, reason, incentive, sessionContext }: AuthModalProps) {
  const { requestMagicLink } = useAuth();
  const { t } = useUIStrings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Get reason-specific content using t()
  const getReasonContent = (r: AccountPromptReason) => ({
    nsfw_unlock: { title: t("unlock_intimate_content"), description: t("unlock_intimate_desc") },
    death_recovery: { title: t("character_fallen"), description: t("character_fallen_desc") },
    time_limit: { title: t("session_limit"), description: t("session_limit_desc") },
  }[r]);

  const content = reason ? getReasonContent(reason) : null;
  const icon = reason ? REASON_ICONS[reason] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Pass session context so backend can link guest session to new account
    const result = await requestMagicLink(email, sessionContext);

    if (result.success) {
      setSent(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    // Reset state on close
    setEmail("");
    setSent(false);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--void)] border border-[var(--amber-dim)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="relative p-4 border-b border-[var(--stone)] bg-gradient-to-b from-[var(--amber)]/10 to-transparent">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
            aria-label="Close"
          >
            x
          </button>
          {icon && <div className="text-4xl text-center mb-2">{icon}</div>}
          <h2 className="text-[var(--amber)] font-bold tracking-wider text-center">
            {content ? content.title : t("save_your_progress")}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {sent ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-[var(--text)]">{t("check_your_email")}</p>
              <p className="text-[var(--mist)] text-sm">
                {t("email_link_sent")} <span className="text-[var(--amber)]">{email}</span>
              </p>
              <p className="text-[var(--text-dim)] text-xs">{t("link_expires")}</p>
              <button
                onClick={handleClose}
                className="mt-4 w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            // Email form
            <form onSubmit={handleSubmit} className="space-y-4">
              {content && (
                <p className="text-[var(--text)] text-center text-sm">{content.description}</p>
              )}
              {!content && (
                <p className="text-[var(--text)] text-center text-sm">
                  {t("enter_email_to_save")}
                </p>
              )}

              {incentive && (
                <div className="bg-[var(--shadow)] border border-[var(--amber-dim)] rounded-lg p-3">
                  <p className="text-[var(--amber)] text-sm text-center font-medium">{incentive}</p>
                </div>
              )}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
              </div>

              {error && <p className="text-[var(--crimson)] text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-medium hover:bg-[var(--amber)]/80 transition-colors disabled:opacity-50"
              >
                {loading ? t("sending") : t("send_login_link")}
              </button>

              <p className="text-[var(--mist)] text-xs text-center">
                {t("no_password_magic_link")}
              </p>

              {!reason && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-[var(--mist)] text-sm hover:text-[var(--text)] transition-colors"
                >
                  {t("maybe_later")}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
