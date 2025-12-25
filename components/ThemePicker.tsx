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
        className="text-[var(--mist)] hover:text-[var(--text)] text-xs px-2 py-1 border border-[var(--slate)] rounded transition-colors"
      >
        Theme: {availableThemes[themeId]?.name || themeId}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--shadow)] border border-[var(--slate)] rounded shadow-lg min-w-48">
            {Object.values(availableThemes).map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--stone)] transition-colors flex items-center justify-between ${
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
