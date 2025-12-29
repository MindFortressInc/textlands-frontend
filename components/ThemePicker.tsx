"use client";

import { useState } from "react";
import { useTheme } from "@/lib/themes/ThemeProvider";

export function ThemePicker() {
  const { themeId, setTheme, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-[var(--mist)] hover:text-[var(--text)] text-xs px-2 py-1.5 md:py-1 border border-[var(--slate)] rounded transition-colors active:bg-[var(--stone)]"
      >
        <span className="hidden sm:inline">Theme: </span>
        {availableThemes[themeId]?.name || themeId}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />

          {/* Dropdown - opens upward to avoid going off-screen */}
          <div className="absolute right-0 bottom-full mb-1 z-50 bg-[var(--shadow)] border border-[var(--slate)] rounded shadow-lg min-w-48 max-h-80 overflow-y-auto">
            {Object.values(availableThemes).map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-3 md:py-2 text-sm active:bg-[var(--stone)] transition-colors flex items-center justify-between ${
                  themeId === theme.id ? "text-[var(--amber)]" : "text-[var(--text)]"
                }`}
              >
                <div>
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-xs text-[var(--mist)]">{theme.description}</div>
                </div>
                {themeId === theme.id && <span className="text-[var(--amber)]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
