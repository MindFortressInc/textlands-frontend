"use client";

import { useState } from "react";
import type { CreateCharacterRequest } from "@/lib/api";

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateCharacterRequest) => Promise<void>;
  worldName: string;
  loading: boolean;
}

export function CharacterCreationModal({
  isOpen,
  onClose,
  onSubmit,
  worldName,
  loading,
}: CharacterCreationModalProps) {
  const [concept, setConcept] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!concept.trim()) {
      setError("Please describe your character concept");
      return;
    }

    if (concept.length < 10) {
      setError("Add a bit more detail to your concept");
      return;
    }

    try {
      await onSubmit({ concept: concept.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create character");
    }
  };

  const handleClose = () => {
    setConcept("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <div>
            <h2 className="text-[var(--amber)] font-bold tracking-wider">CREATE CHARACTER</h2>
            <p className="text-[var(--mist)] text-xs mt-1">{worldName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-[var(--text)] text-sm mb-2">
              Describe your character
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="A scarred mercenary seeking redemption, haunted by past failures..."
              rows={4}
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none transition-colors resize-none"
              disabled={loading}
              autoFocus
            />
            <p className="text-[var(--text-dim)] text-xs mt-2">
              The AI will flesh out your concept into a complete character.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-[var(--crimson)] text-sm p-2 bg-[var(--crimson)]/10 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-[var(--amber-dim)] border border-[var(--amber)] rounded text-[var(--text)] hover:bg-[var(--amber)]/30 transition-colors disabled:opacity-50"
              disabled={loading || !concept.trim()}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
