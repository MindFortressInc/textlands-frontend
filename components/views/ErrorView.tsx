"use client";

import { useUIStrings } from "@/contexts/UIStringsContext";

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const { t } = useUIStrings();
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-[var(--crimson)] text-4xl">⚠</div>
        <div className="text-[var(--amber)] font-bold tracking-[0.3em] text-lg">{t("connection_error")}</div>
        <p className="text-[var(--text-dim)] text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
        >
          {t("try_again")}
        </button>
      </div>
    </main>
  );
}
