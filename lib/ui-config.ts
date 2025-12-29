/**
 * Centralized UI configuration values.
 * Adjust these to change behavior across all components.
 */

export const UI = {
  // Dropdown positioning
  dropdown: {
    edgePadding: 16,          // Min distance from viewport edge (px)
    defaultMaxHeight: 256,    // Default max-height for dropdowns (px)
    themePickerMaxHeight: 320, // Theme picker specific (more items)
    characterPickerMaxHeight: 256,
  },

  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
  },

  // Z-index layers
  zIndex: {
    dropdown: 50,
    backdrop: 40,
    modal: 60,
    toast: 70,
  },

  // Breakpoints (match Tailwind defaults)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Touch targets (min sizes for accessibility)
  touch: {
    minHeight: 44,  // iOS HIG minimum
    minWidth: 44,
  },
} as const;

// Type for dropdown direction
export type DropdownDirection = "up" | "down";

/**
 * Calculate optimal dropdown direction and constrained height.
 * Call this when opening a dropdown.
 */
export function calcDropdownPosition(
  triggerRect: DOMRect,
  options: { maxHeight?: number; padding?: number } = {}
): { direction: DropdownDirection; maxHeight: number } {
  const { maxHeight = UI.dropdown.defaultMaxHeight, padding = UI.dropdown.edgePadding } = options;

  const spaceAbove = triggerRect.top;
  const spaceBelow = window.innerHeight - triggerRect.bottom;

  if (spaceBelow >= spaceAbove) {
    return {
      direction: "down",
      maxHeight: Math.min(maxHeight, spaceBelow - padding),
    };
  } else {
    return {
      direction: "up",
      maxHeight: Math.min(maxHeight, spaceAbove - padding),
    };
  }
}
