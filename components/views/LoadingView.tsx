"use client";

import { useUIStrings } from "@/contexts/UIStringsContext";

export function LoadingView() {
  const { t } = useUIStrings();
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-[var(--void)]">
      <div className="text-[var(--amber)] font-bold tracking-[0.3em] text-lg mb-4 title-glow">TEXTLANDS</div>
      <div className="text-[var(--mist)] text-sm animate-pulse">{t("connecting")}</div>
    </main>
  );
}
