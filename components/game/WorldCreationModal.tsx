"use client";

import { useState, useEffect } from "react";
import type { WorldTemplate } from "@/types/game";
import * as api from "@/lib/api";

interface WorldCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldCreated?: (worldId: string) => void;
  selectedTemplate?: WorldTemplate | null;
}

export function WorldCreationModal({
  isOpen,
  onClose,
  onWorldCreated,
  selectedTemplate,
}: WorldCreationModalProps) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setName(selectedTemplate?.name ? `${selectedTemplate.name} World` : "");
      setDescription(selectedTemplate?.description || "");
      setIsNsfw(false);
    }
  }, [isOpen, selectedTemplate]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("World name is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await api.createWorld({
        name: name.trim(),
        description: description.trim() || undefined,
        template_slug: selectedTemplate?.slug,
        is_nsfw: isNsfw,
      });

      if (result.success && onWorldCreated) {
        onWorldCreated(result.world.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create world");
    }

    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <div>
            <h2 className="text-[var(--amber)] font-bold tracking-wider">CREATE WORLD</h2>
            {selectedTemplate && (
              <p className="text-[var(--mist)] text-xs mt-1">From: {selectedTemplate.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
            disabled={creating}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              World Name <span className="text-[var(--crimson)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Shattered Kingdoms"
              maxLength={100}
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
              disabled={creating}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[var(--text)] text-sm mb-1">
              Describe your world
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A grimdark fantasy realm where fallen empires war over ancient magic. Technology is medieval, magic is dangerous and costly..."
              rows={4}
              className="w-full px-3 py-2 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none resize-none"
              disabled={creating}
            />
            <p className="text-[var(--text-dim)] text-xs mt-1">
              The AI will generate rules, tone, and lore from your description.
            </p>
          </div>

          {/* NSFW Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isNsfw}
              onChange={(e) => setIsNsfw(e.target.checked)}
              className="sr-only peer"
              disabled={creating}
            />
            <div className="w-10 h-6 bg-[var(--stone)] rounded-full peer-checked:bg-[var(--crimson)] transition-colors relative">
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--text)] rounded-full transition-transform ${isNsfw ? "translate-x-4" : ""}`} />
            </div>
            <div>
              <div className="text-[var(--text)] text-sm">Adult Content (18+)</div>
              <div className="text-[var(--mist)] text-xs">Enable mature themes</div>
            </div>
          </label>

          {error && (
            <div className="text-[var(--crimson)] text-sm p-2 bg-[var(--crimson)]/10 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 py-2 px-4 bg-[var(--amber)] text-[var(--void)] rounded font-medium hover:bg-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "Creating..." : "Create World"}
          </button>
        </div>
      </div>
    </div>
  );
}
