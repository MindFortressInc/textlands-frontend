"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { UI, calcDropdownPosition, type DropdownDirection } from "@/lib/ui-config";

interface SmartDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "left" | "right";
  className?: string;
  maxHeight?: number;
  showBackdrop?: boolean;
}

/**
 * A dropdown that automatically opens upward or downward based on available space.
 * Clamps max-height to fit within viewport.
 */
export function SmartDropdown({
  trigger,
  children,
  open,
  onOpenChange,
  align = "left",
  className = "",
  maxHeight = UI.dropdown.defaultMaxHeight,
  showBackdrop = false,
}: SmartDropdownProps) {
  const [direction, setDirection] = useState<DropdownDirection>("down");
  const [constrainedHeight, setConstrainedHeight] = useState(maxHeight);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Recalculate position when opening
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pos = calcDropdownPosition(rect, { maxHeight });
      setDirection(pos.direction);
      setConstrainedHeight(pos.maxHeight);
    }
  }, [open, maxHeight]);

  return (
    <div className="relative" ref={triggerRef}>
      {/* Trigger */}
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>

      {open && (
        <>
          {/* Optional backdrop */}
          {showBackdrop && (
            <div
              className="fixed inset-0 bg-black/20"
              style={{ zIndex: UI.zIndex.backdrop }}
              onClick={() => onOpenChange(false)}
            />
          )}

          {/* Dropdown panel */}
          <div
            className={`absolute bg-[var(--shadow)] border border-[var(--slate)] rounded-lg overflow-y-auto ${
              align === "right" ? "right-0" : "left-0"
            } ${direction === "up" ? "bottom-full mb-1" : "top-full mt-1"} ${className}`}
            style={{ maxHeight: constrainedHeight, zIndex: UI.zIndex.dropdown }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// Hook for easier state management
export function useSmartDropdown() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, onOpenChange: setOpen };
}
