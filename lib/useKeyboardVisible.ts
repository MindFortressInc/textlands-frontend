"use client";

import { useState, useEffect } from "react";

/**
 * Detects when the mobile virtual keyboard is visible.
 * Uses the Visual Viewport API to detect viewport height changes.
 * Returns true when keyboard is likely open (viewport significantly smaller than window).
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      // Keyboard is likely visible if visual viewport is significantly smaller than window
      // Using 150px threshold to account for keyboard height (usually 250-350px)
      const heightDiff = window.innerHeight - visualViewport.height;
      setIsKeyboardVisible(heightDiff > 150);
    };

    visualViewport.addEventListener("resize", handleResize);
    visualViewport.addEventListener("scroll", handleResize);

    // Initial check
    handleResize();

    return () => {
      visualViewport.removeEventListener("resize", handleResize);
      visualViewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return isKeyboardVisible;
}
