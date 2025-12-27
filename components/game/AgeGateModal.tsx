"use client";

interface AgeGateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgeGateModal({ isOpen, onConfirm, onCancel }: AgeGateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--stone)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider text-center">
            AGE VERIFICATION
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--text)] text-center">
            This content is intended for adults only.
          </p>
          <p className="text-[var(--text-dim)] text-sm text-center">
            By continuing, you confirm that you are at least 18 years old.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[var(--stone)] space-y-3">
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3 rounded bg-[var(--crimson)] text-white font-medium hover:bg-[var(--crimson)]/80 transition-colors"
          >
            I am 18 or older
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
