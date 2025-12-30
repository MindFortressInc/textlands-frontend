"use client";

import type { AccountPromptReason } from "@/types/game";
import { useUIStrings } from "@/contexts/UIStringsContext";

interface AccountRequiredModalProps {
  isOpen: boolean;
  reason?: AccountPromptReason;
  incentive?: string;
  onSignUp: () => void;
}

const REASON_ICONS: Record<AccountPromptReason, string> = {
  nsfw_unlock: "🔥",
  death_recovery: "💀",
  time_limit: "⏰",
};

export function AccountRequiredModal({
  isOpen,
  reason = "nsfw_unlock",
  incentive,
  onSignUp,
}: AccountRequiredModalProps) {
  const { t } = useUIStrings();

  if (!isOpen) return null;

  const getReasonContent = (r: AccountPromptReason) => ({
    nsfw_unlock: { title: t("unlock_intimate_content"), description: t("requires_age_verification") },
    death_recovery: { title: t("character_fallen"), description: t("recover_character_desc") },
    time_limit: { title: t("session_limit"), description: t("continue_without_limits") },
  }[r]);

  const content = getReasonContent(reason);
  const icon = REASON_ICONS[reason];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--void)] border border-[var(--crimson)]/50 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--stone)] bg-gradient-to-b from-[var(--crimson)]/10 to-transparent">
          <div className="text-4xl text-center mb-2">{icon}</div>
          <h2 className="text-[var(--crimson)] font-bold tracking-wider text-center">
            {content.title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--text)] text-center">
            {content.description}
          </p>
          {incentive && (
            <div className="bg-[var(--shadow)] border border-[var(--amber-dim)] rounded-lg p-3">
              <p className="text-[var(--amber)] text-sm text-center font-medium">
                {incentive}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[var(--stone)]">
          <button
            onClick={onSignUp}
            className="w-full px-4 py-3 rounded bg-[var(--crimson)] text-white font-medium hover:bg-[var(--crimson)]/80 transition-colors"
          >
            Create Free Account
          </button>
          <p className="text-[var(--mist)] text-xs text-center mt-3">
            {t("progress_saved_auto")}
          </p>
        </div>
      </div>
    </div>
  );
}
