"use client";

interface SaveProgressModalProps {
  isOpen: boolean;
  onSignUp: () => void;
  onDismiss: () => void;
}

export function SaveProgressModal({
  isOpen,
  onSignUp,
  onDismiss,
}: SaveProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--stone)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider text-center">
            SAVE YOUR PROGRESS?
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--text)] text-center">
            You&apos;ve been adventuring for a while now.
          </p>
          <p className="text-[var(--mist)] text-sm text-center">
            Create an account to save your character and continue your journey across sessions.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[var(--stone)] space-y-3">
          <button
            onClick={onSignUp}
            className="w-full px-4 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-medium hover:bg-[var(--amber)]/80 transition-colors"
          >
            Create Account
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
