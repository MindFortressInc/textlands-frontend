"use client";

import { useState, useRef, useEffect } from "react";
import * as api from "@/lib/api";
import { useUIStrings } from "@/contexts/UIStringsContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (entityId: string) => void;
  worldId: string;
  worldName: string;
  playerId?: string;
}

export function CharacterCreationModal({
  isOpen,
  onClose,
  onComplete,
  worldId,
  worldName,
  playerId,
}: CharacterCreationModalProps) {
  const { t } = useUIStrings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<api.CharacterPreview | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [phase, setPhase] = useState<string>("concept");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setMessages([]);
      setInput("");
      setSessionId(null);
      setPreview(null);
      setSuggestions([]);
      setPhase("concept");
      setError(null);

      // Show initial AI message
      setMessages([{
        role: "assistant",
        content: t("welcome_to_world").replace("{world}", worldName)
      }]);
      setSuggestions([
        t("character_suggestion_1"),
        t("character_suggestion_2"),
        t("character_suggestion_3")
      ]);

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, worldName]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    setError(null);
    setMessages(prev => [...prev, { role: "user", content: message }]);
    setInput("");
    setSuggestions([]);
    setLoading(true);

    try {
      const response = await api.createCharacterIterative(worldId, {
        message: message.trim(),
        session_id: sessionId,
        player_id: playerId,
      });

      setSessionId(response.session_id);
      setPhase(response.phase);
      setPreview(response.character_preview);
      setSuggestions(response.suggested_responses);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.ai_message
      }]);

      if (response.done && response.entity_id) {
        // Character is ready
        setTimeout(() => onComplete(response.entity_id!), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed_to_create_character"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClose = () => {
    setMessages([]);
    setSessionId(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-2xl h-[80vh] max-h-[600px] bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)] shrink-0">
          <div>
            <h2 className="text-[var(--amber)] font-bold tracking-wider">CREATE CHARACTER</h2>
            <p className="text-[var(--mist)] text-xs mt-1">
              {worldName} · {phase}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${
                    msg.role === "user"
                      ? "text-[var(--fog)] pl-4 border-l-2 border-[var(--slate)]"
                      : "text-[var(--amber)]"
                  }`}
                >
                  {msg.role === "user" && (
                    <span className="text-[var(--mist)] mr-2">&gt;</span>
                  )}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              ))}

              {loading && (
                <div className="text-[var(--mist)] animate-pulse">
                  Thinking...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 text-sm bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--fog)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 pb-2 text-[var(--crimson)] text-sm">
                {error}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--slate)] shrink-0">
              <div className="flex gap-2">
                <span className="text-[var(--amber)] py-2">&gt;</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("describe_your_character")}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text)] placeholder-[var(--mist)]"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-[var(--amber-dim)] border border-[var(--amber)] rounded text-[var(--text)] hover:bg-[var(--amber)]/30 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Character preview sidebar */}
          {preview && (preview.name || preview.occupation || preview.species) && (
            <div className="w-48 border-l border-[var(--slate)] p-3 overflow-y-auto shrink-0 hidden md:block">
              <h3 className="text-[var(--mist)] text-xs uppercase tracking-wider mb-3">Preview</h3>

              {preview.name && (
                <div className="mb-2">
                  <div className="text-[var(--amber)] font-bold">{preview.name}</div>
                </div>
              )}

              {(preview.species || preview.occupation) && (
                <div className="text-[var(--fog)] text-sm mb-2">
                  {[preview.species, preview.occupation].filter(Boolean).join(" · ")}
                </div>
              )}

              {preview.physical_description && (
                <div className="text-[var(--mist)] text-xs mb-2">
                  {preview.physical_description}
                </div>
              )}

              {preview.personality_traits && preview.personality_traits.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {preview.personality_traits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-xs bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--fog)]"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}

              {preview.backstory_summary && (
                <div className="text-[var(--mist)] text-xs italic">
                  {preview.backstory_summary}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
