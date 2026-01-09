"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/lib/themes/ThemeProvider";
import { UI, calcDropdownPosition, type DropdownDirection } from "@/lib/ui-config";

export function ThemePicker() {
  const { themeId, setTheme, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<DropdownDirection>("up");
  const [maxHeight, setMaxHeight] = useState<number>(UI.dropdown.themePickerMaxHeight);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pos = calcDropdownPosition(rect, { maxHeight: UI.dropdown.themePickerMaxHeight });
      setOpenDirection(pos.direction);
      setMaxHeight(pos.maxHeight);
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="min-h-[44px] md:min-h-0 text-[var(--mist)] hover:text-[var(--text)] active:text-[var(--text)] text-xs px-3 md:px-2 py-2 md:py-1 border border-[var(--slate)] rounded transition-colors active:bg-[var(--stone)] flex items-center justify-center"
      >
        <span className="hidden sm:inline">Theme: </span>
        {availableThemes[themeId]?.name || themeId}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />

          {/* Dropdown - dynamic direction based on available space */}
          <div
            className={`absolute right-0 z-50 bg-[var(--shadow)] border border-[var(--slate)] rounded shadow-lg min-w-48 overflow-y-auto ${
              openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            style={{ maxHeight }}
          >
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
