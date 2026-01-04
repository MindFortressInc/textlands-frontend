"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/themes/ThemeProvider";
import { themes, applyTheme, type Theme } from "@/lib/themes/index";
import { safeStorage } from "@/lib/errors";

interface ThemeChooserProps {
  onComplete: () => void;
}

// Sample narrative to preview in each theme
const PREVIEW_NARRATIVE = `You enter the tavern. A fire crackles in the hearth, casting dancing shadows across weathered wooden beams. The barkeep nods as you approach.

"Welcome, traveler. What brings you to these lands?"`;

const PREVIEW_SUGGESTIONS = ["Order a drink", "Ask about rumors", "Find a seat"];

// Ordered list of themes for the carousel
const THEME_ORDER = ["terminal", "parchment", "modern"];

// Get starting index based on system preference
function getStartingIndex(): number {
  if (typeof window === "undefined") return 0;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  // terminal (index 0) for dark, modern (index 2) for light (iOS native)
  return prefersDark ? 0 : 2;
}

export function ThemeChooser({ onComplete }: ThemeChooserProps) {
  const { setTheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(getStartingIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);

  const themeList = THEME_ORDER.map(id => themes[id]);
  const currentTheme = themeList[currentIndex];

  // Apply theme preview when index changes
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  const goToIndex = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(themeList.length - 1, index));
    setIsTransitioning(true);
    setCurrentIndex(clampedIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [themeList.length]);

  const handleDragStart = (clientX: number) => {
    if (isTransitioning) return;
    setIsDragging(true);
    startXRef.current = clientX;
    startTimeRef.current = Date.now();
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startXRef.current;
    // Add resistance at edges
    if ((currentIndex === 0 && diff > 0) || (currentIndex === themeList.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const elapsed = Date.now() - startTimeRef.current;
    const velocity = Math.abs(dragOffset) / elapsed;
    const threshold = velocity > 0.5 ? 50 : 100;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        goToIndex(currentIndex - 1);
      } else if (dragOffset < 0 && currentIndex < themeList.length - 1) {
        goToIndex(currentIndex + 1);
      }
    }

    setDragOffset(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const handleMouseUp = () => handleDragEnd();
  const handleMouseLeave = () => { if (isDragging) handleDragEnd(); };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleDragEnd();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        goToIndex(currentIndex + 1);
      } else if (e.key === "Enter") {
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goToIndex]);

  const handleConfirm = () => {
    setTheme(currentTheme.id);
    safeStorage.setItem("textlands-theme-chosen", "true");
    onComplete();
  };

  return (
    <main
      className="fixed inset-0 z-50 flex flex-col bg-[var(--void)] overflow-hidden animate-fade-in"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="text-[var(--mist)] text-[10px] tracking-[0.4em] uppercase mb-2">Choose Your</div>
        <h1 className="text-[var(--amber)] text-2xl md:text-3xl font-bold tracking-[0.15em]">VISUAL STYLE</h1>
        <p className="text-[var(--text-dim)] text-xs mt-3 max-w-xs mx-auto">
          Swipe to explore different aesthetics. You can change this anytime.
        </p>
      </div>

      {/* Carousel container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cards container */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {themeList.map((theme, index) => {
            const offset = index - currentIndex;
            const isActive = index === currentIndex;

            const isAdjacent = Math.abs(offset) === 1;

            return (
              <div
                key={theme.id}
                className={`absolute w-[85vw] max-w-md transition-all duration-300 ease-out ${
                  isAdjacent ? "cursor-pointer" : ""
                }`}
                style={{
                  transform: `translateX(${offset * 105}%) scale(${isActive ? 1 : 0.85}) rotateY(${offset * -5}deg)`,
                  opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.5,
                  zIndex: isActive ? 10 : 5 - Math.abs(offset),
                  pointerEvents: isActive || isAdjacent ? "auto" : "none",
                }}
                onClick={isAdjacent ? () => goToIndex(index) : undefined}
              >
                <ThemePreviewCard theme={theme} isActive={isActive} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 py-4">
        {themeList.map((theme, index) => (
          <button
            key={theme.id}
            onClick={() => goToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-[var(--amber)] w-6"
                : "bg-[var(--slate)] hover:bg-[var(--mist)]"
            }`}
            aria-label={`Go to ${theme.name} theme`}
          />
        ))}
      </div>

      {/* Theme name and confirm */}
      <div className="text-center pb-8 px-4 space-y-4">
        <div>
          <h2 className="text-[var(--amber)] text-xl font-bold tracking-wide">{currentTheme.name}</h2>
          <p className="text-[var(--mist)] text-sm">{currentTheme.description}</p>
        </div>

        <button
          onClick={handleConfirm}
          className="group relative px-10 py-4 text-[var(--amber)] font-bold text-base bg-[var(--shadow)] border border-[var(--slate)] rounded transition-all duration-200 hover:border-[var(--amber)] hover:bg-[var(--stone)] active:scale-95"
        >
          <span className="relative z-10">Choose {currentTheme.name}</span>
          <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>

        <p className="text-[var(--slate)] text-[10px] tracking-wide">
          ← SWIPE, CLICK, OR USE ARROW KEYS →
        </p>
      </div>
    </main>
  );
}

// Theme preview card with inline styles for the theme
function ThemePreviewCard({ theme, isActive }: { theme: Theme; isActive: boolean }) {
  const colors = theme.colors;

  return (
    <div
      className="rounded-lg overflow-hidden shadow-2xl"
      style={{
        backgroundColor: colors.void,
        border: `1px solid ${colors.slate}`,
        boxShadow: isActive ? `0 0 40px ${colors.amberDim}40` : undefined,
      }}
    >
      {/* Mini header */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          backgroundColor: colors.shadow,
          borderBottom: `1px solid ${colors.slate}`,
        }}
      >
        <span style={{ color: colors.amber, fontWeight: "bold", fontSize: "12px", letterSpacing: "0.1em" }}>
          TEXTLANDS
        </span>
        <span style={{ color: colors.mist, fontSize: "10px" }}>The Rusty Anchor</span>
      </div>

      {/* Preview content */}
      <div className="p-4 space-y-4" style={{ fontFamily: theme.font }}>
        {/* Narrative preview */}
        <div style={{ color: colors.text, fontSize: "13px", lineHeight: "1.6" }}>
          {PREVIEW_NARRATIVE.split("\n\n").map((para, i) => (
            <p key={i} className={i > 0 ? "mt-3" : ""}>
              {para.includes('"') ? (
                <>
                  {para.split('"').map((part, j) =>
                    j % 2 === 1 ? (
                      <span key={j} style={{ color: colors.arcane }}>"{part}"</span>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </>
              ) : para}
            </p>
          ))}
        </div>

        {/* Suggestion chips preview */}
        <div className="flex flex-wrap gap-2 pt-2">
          {PREVIEW_SUGGESTIONS.map((suggestion) => (
            <span
              key={suggestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: colors.stone,
                border: `1px solid ${colors.slate}`,
                color: colors.textDim,
              }}
            >
              <span style={{ color: colors.amber, fontWeight: 600 }}>›</span>
              {suggestion}
            </span>
          ))}
        </div>

        {/* Mini input preview */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded"
          style={{
            backgroundColor: colors.shadow,
            border: `1px solid ${colors.slate}`,
          }}
        >
          <span style={{ color: colors.amber }}>›</span>
          <span style={{ color: colors.mist, fontSize: "13px" }}>What do you do?</span>
          <span
            className="w-2 h-4 animate-pulse"
            style={{ backgroundColor: colors.amber }}
          />
        </div>
      </div>

    </div>
  );
}

// Utility to check if theme has been chosen before
export function hasChosenTheme(): boolean {
  return safeStorage.getItem("textlands-theme-chosen") === "true";
}
