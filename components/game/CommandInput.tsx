"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onFocusChange?: (focused: boolean) => void;
}

export function CommandInput({
  onSubmit,
  disabled = false,
  placeholder = "Enter command...",
  onFocusChange,
}: CommandInputProps) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  // Handle focus with controlled scroll behavior
  const handleFocus = useCallback(() => {
    onFocusChange?.(true);

    // On mobile, delay scroll to let keyboard animation settle
    // Then scroll the input container into view without hiding header
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && containerRef.current) {
      setTimeout(() => {
        // Use scrollIntoView with block: "end" to keep input at bottom
        // This prevents scrolling the header out of view
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 300); // Wait for keyboard animation
    }
  }, [onFocusChange]);

  const handleSubmit = () => {
    const trimmed = command.trim();
    if (trimmed && !disabled) {
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
      className="bg-[var(--shadow)] border-t border-[var(--slate)] p-3 md:p-3 flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
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
        onBlur={() => onFocusChange?.(false)}
        disabled={disabled}
        placeholder={placeholder}
        className="command-input flex-1 bg-transparent text-[var(--text)] placeholder:text-[var(--mist)] placeholder:opacity-50 disabled:opacity-50 py-1 md:py-0"
        autoComplete="off"
        autoCapitalize="sentences"
        autoCorrect="on"
        spellCheck={true}
        enterKeyHint="send"
      />
      {command === "" && !disabled && (
        <span className="text-[var(--amber)] hidden md:inline" style={{ animation: "blink 1s step-end infinite" }}>
          _
        </span>
      )}
      {/* Mobile send button */}
      {command !== "" && (
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="md:hidden text-[var(--amber)] font-bold px-2 py-1 active:opacity-70 transition-opacity"
        >
          ↵
        </button>
      )}
    </div>
  );
}
