"use client";

import { useEffect, useState } from "react";

interface SuggestedActionsProps {
  suggestions: string[];
  onSelect: (action: string) => void;
  disabled?: boolean;
}

export function SuggestedActions({
  suggestions,
  onSelect,
  disabled = false,
}: SuggestedActionsProps) {
  const [visible, setVisible] = useState(false);

  // Trigger stagger animation on mount/suggestions change
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [suggestions]);

  if (!suggestions.length) return null;

  return (
    <div className="suggestion-container px-3 py-2 border-t border-[var(--slate)] bg-[var(--shadow)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[var(--mist)] text-[10px] tracking-widest uppercase">
          Suggested
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--slate)] to-transparent" />
      </div>
      <div
        className={`flex flex-wrap gap-2 ${visible ? "suggestions-visible" : ""}`}
        role="group"
        aria-label="Suggested actions"
      >
        {suggestions.map((action, index) => (
          <button
            key={`${action}-${index}`}
            onClick={() => !disabled && onSelect(action)}
            disabled={disabled}
            className="suggestion-chip group"
            style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
            aria-label={`Execute: ${action}`}
          >
            <span className="suggestion-prefix" aria-hidden="true">›</span>
            <span className="suggestion-text">{action}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
