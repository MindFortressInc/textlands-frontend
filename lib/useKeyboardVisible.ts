"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
  viewportHeight: number;
}

/**
 * Detects when the mobile virtual keyboard is visible.
 * Returns keyboard state including height for layout calculations.
 * Uses multiple detection methods for reliability across iOS/Android.
 */
export function useKeyboardVisible(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Track initial viewport height (before keyboard)
  const initialHeightRef = useRef<number>(0);
  const inputFocusedRef = useRef<boolean>(false);

  const updateKeyboardState = useCallback(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const currentHeight = visualViewport.height;
    const initialHeight = initialHeightRef.current || window.innerHeight;

    // Calculate keyboard height
    const keyboardHeight = Math.max(0, initialHeight - currentHeight);

    // Keyboard is visible if:
    // 1. Height difference is significant (>100px)
    // 2. AND an input is focused (prevents false positives from address bar)
    const isVisible = keyboardHeight > 100 && inputFocusedRef.current;

    setState({
      isVisible,
      keyboardHeight: isVisible ? keyboardHeight : 0,
      viewportHeight: currentHeight,
    });

    // Update CSS custom property for use in stylesheets
    document.documentElement.style.setProperty(
      "--keyboard-height",
      `${isVisible ? keyboardHeight : 0}px`
    );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${currentHeight}px`
    );
  }, []);

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // Store initial height
    initialHeightRef.current = visualViewport.height;

    // Track input focus to distinguish keyboard from other viewport changes
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        inputFocusedRef.current = true;
        // Small delay to let keyboard animation start
        setTimeout(updateKeyboardState, 100);
      }
    };

    const handleFocusOut = () => {
      inputFocusedRef.current = false;
      // Delay to let keyboard close animation complete
      setTimeout(updateKeyboardState, 100);
    };

    // Visual viewport events
    visualViewport.addEventListener("resize", updateKeyboardState);
    visualViewport.addEventListener("scroll", updateKeyboardState);

    // Focus tracking
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    // Initial check
    updateKeyboardState();

    return () => {
      visualViewport.removeEventListener("resize", updateKeyboardState);
      visualViewport.removeEventListener("scroll", updateKeyboardState);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);

      // Clean up CSS variables
      document.documentElement.style.removeProperty("--keyboard-height");
      document.documentElement.style.removeProperty("--viewport-height");
    };
  }, [updateKeyboardState]);

  return state;
}

// Simple boolean hook for backward compatibility
export function useIsKeyboardVisible(): boolean {
  const { isVisible } = useKeyboardVisible();
  return isVisible;
}
