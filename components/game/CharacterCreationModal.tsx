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
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [physicalDescription, setPhysicalDescription] = useState("");
  const [personalityTraits, setPersonalityTraits] = useState("");
  const [backstoryHook, setBackstoryHook] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.length > 50) {
      setError("Name must be 50 characters or less");
      return;
    }

    const traits = personalityTraits
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await onSubmit({
        name: name.trim(),
        occupation: occupation.trim() || undefined,
        physical_description: physicalDescription.trim() || undefined,
        personality_traits: traits.length > 0 ? traits : undefined,
        backstory_hook: backstoryHook.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create character");
    }
  };

  const handleClose = () => {
    // Reset form
    setName("");
    setOccupation("");
    setPhysicalDescription("");
    setPersonalityTraits("");
    setBackstoryHook("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name - Required */}
          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              Name <span className="text-[var(--crimson)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter character name"
              maxLength={50}
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none transition-colors"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Occupation - Optional */}
          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              Occupation <span className="text-[var(--mist)] text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g., Blacksmith, Scholar, Thief"
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Physical Description - Optional */}
          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              Appearance <span className="text-[var(--mist)] text-xs">(optional)</span>
            </label>
            <textarea
              value={physicalDescription}
              onChange={(e) => setPhysicalDescription(e.target.value)}
              placeholder="Brief description of your appearance..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
          </div>

          {/* Personality Traits - Optional */}
          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              Personality <span className="text-[var(--mist)] text-xs">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={personalityTraits}
              onChange={(e) => setPersonalityTraits(e.target.value)}
              placeholder="e.g., Curious, Stubborn, Kind"
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Backstory Hook - Optional */}
          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              Backstory <span className="text-[var(--mist)] text-xs">(optional)</span>
            </label>
            <textarea
              value={backstoryHook}
              onChange={(e) => setBackstoryHook(e.target.value)}
              placeholder="A mysterious past, a burning goal..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-[var(--crimson)] text-sm p-2 bg-[var(--crimson)]/10 rounded">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)] flex gap-3">
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
            onClick={handleSubmit}
            className="flex-1 py-2 px-4 bg-[var(--amber-dim)] border border-[var(--amber)] rounded text-[var(--text)] hover:bg-[var(--amber)]/30 transition-colors disabled:opacity-50"
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
