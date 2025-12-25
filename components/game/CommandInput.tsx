"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CommandInput({
  onSubmit,
  disabled = false,
  placeholder = "Enter command...",
}: CommandInputProps) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

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
    <div className="bg-[var(--shadow)] border-t border-[var(--slate)] p-3 flex items-center gap-2">
      <span className="text-[var(--amber)] font-bold">&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={command}
        onChange={(e) => {
          setCommand(e.target.value);
          setHistoryIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="command-input flex-1 bg-transparent text-[var(--text)] placeholder:text-[var(--mist)] placeholder:opacity-50 disabled:opacity-50"
        autoComplete="off"
        spellCheck={false}
      />
      {command === "" && !disabled && (
        <span className="text-[var(--amber)]" style={{ animation: "blink 1s step-end infinite" }}>
          _
        </span>
      )}
    </div>
  );
}
