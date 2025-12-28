"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountPromptReason } from "@/types/game";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: AccountPromptReason;
  incentive?: string;
}

const REASON_CONTENT: Record<AccountPromptReason, { title: string; description: string; icon: string }> = {
  nsfw_unlock: {
    title: "UNLOCK INTIMATE CONTENT",
    description: "Sign in to access mature content and save your progress.",
    icon: "🔥",
  },
  death_recovery: {
    title: "YOUR CHARACTER HAS FALLEN",
    description: "Sign in to recover your character and continue your adventure.",
    icon: "💀",
  },
  time_limit: {
    title: "SESSION LIMIT REACHED",
    description: "Sign in to continue playing without limits.",
    icon: "⏰",
  },
};

export function AuthModal({ isOpen, onClose, reason, incentive }: AuthModalProps) {
  const { requestMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const content = reason ? REASON_CONTENT[reason] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await requestMagicLink(email);

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
        <div className="p-4 border-b border-[var(--stone)] bg-gradient-to-b from-[var(--amber)]/10 to-transparent">
          {content && <div className="text-4xl text-center mb-2">{content.icon}</div>}
          <h2 className="text-[var(--amber)] font-bold tracking-wider text-center">
            {content ? content.title : "SAVE YOUR PROGRESS"}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {sent ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-[var(--text)]">Check your email!</p>
              <p className="text-[var(--mist)] text-sm">
                We sent a login link to <span className="text-[var(--amber)]">{email}</span>
              </p>
              <p className="text-[var(--text-dim)] text-xs">Link expires in 15 minutes</p>
              <button
                onClick={handleClose}
                className="mt-4 w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
              >
                Close
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
                  Enter your email to save your character and continue across sessions.
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
                {loading ? "Sending..." : "Send Login Link"}
              </button>

              <p className="text-[var(--mist)] text-xs text-center">
                No password needed - we&apos;ll email you a magic link
              </p>

              {!reason && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-[var(--mist)] text-sm hover:text-[var(--text)] transition-colors"
                >
                  Maybe Later
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
