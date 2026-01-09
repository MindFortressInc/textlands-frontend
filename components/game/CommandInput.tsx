"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { hapticImpact } from "@/lib/haptics";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onFocusChange?: (focused: boolean) => void;
  processing?: boolean;
}

export function CommandInput({
  onSubmit,
  disabled = false,
  placeholder = "Enter command...",
  onFocusChange,
  processing = false,
}: CommandInputProps) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss keyboard
  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  // Handle focus - iOS keyboard handling
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocusChange?.(true);

    // iOS Safari: Ensure input is scrolled into view after keyboard opens
    // The visualViewport API + dvh should handle most of this,
    // but we add a fallback scroll to ensure visibility
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS && inputRef.current) {
      // Wait for keyboard animation to complete
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 350);
    }
  }, [onFocusChange]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const handleSubmit = () => {
    const trimmed = command.trim();
    if (trimmed && !disabled) {
      hapticImpact();
      onSubmit(trimmed);
      setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
      setCommand("");
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowUp" && history.length > 0 && historyIndex < history.length - 1) {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCommand(history[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="command-input-container bg-[var(--shadow)] border-t border-[var(--slate)] p-3 md:p-3 flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
    >
      {/* Mobile keyboard dismiss button - shows when focused */}
      {isFocused && (
        <button
          onClick={dismissKeyboard}
          className="md:hidden min-w-[44px] min-h-[44px] -ml-1 flex items-center justify-center text-[var(--mist)] active:text-[var(--text)] transition-colors"
          aria-label="Dismiss keyboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      <span className="text-[var(--amber)] font-bold text-lg md:text-base">&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={command}
        onChange={(e) => {
          setCommand(e.target.value);
          setHistoryIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className="command-input flex-1 bg-transparent text-[var(--text)] placeholder:text-[var(--mist)] placeholder:opacity-50 disabled:opacity-50 py-1 md:py-0"
        autoComplete="off"
        autoCapitalize="sentences"
        autoCorrect="on"
        spellCheck={true}
        enterKeyHint="send"
      />
      {command === "" && !disabled && !isFocused && (
        <span className="text-[var(--amber)] hidden md:inline" style={{ animation: "blink 1s step-end infinite" }}>
          _
        </span>
      )}
      {/* Mobile send button - always visible on mobile for muscle memory */}
      <button
        onClick={handleSubmit}
        disabled={disabled || processing || command.trim() === ""}
        className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--amber)] font-bold active:opacity-70 transition-all disabled:opacity-30 disabled:text-[var(--mist)]"
        aria-label="Send command"
      >
        {processing ? (
          <span className="w-4 h-4 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-xl">↵</span>
        )}
      </button>
    </div>
  );
}
