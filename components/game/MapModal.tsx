"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { RealmMapResponse } from "@/lib/api";

interface MapModalProps {
  worldId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MapModal({ worldId, isOpen, onClose }: MapModalProps) {
  const [mapData, setMapData] = useState<RealmMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !worldId) return;
    if (mapData) return; // Already loaded

    setLoading(true);
    setError(null);

    api.getRealmMap(worldId, { width: 60, height: 20 })
      .then(setMapData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, worldId, mapData]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setMapData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--void)]/80"
      onClick={onClose}
    >
      <div
        className="bg-[var(--shadow)] border border-[var(--slate)] max-w-[90vw] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--slate)] bg-[var(--stone)]">
          <div>
            <div className="text-[var(--amber)] text-sm font-bold uppercase tracking-wider">
              Realm Map
            </div>
            {mapData && (
              <div className="text-[var(--mist)] text-xs">{mapData.realm_name}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--fog)] transition-colors px-2"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-[var(--mist)] text-sm animate-pulse py-8 text-center">
              Loading map...
            </div>
          ) : error ? (
            <div className="text-[var(--crimson)] text-sm py-8 text-center">
              {error}
            </div>
          ) : mapData ? (
            <div className="space-y-4">
              {/* ASCII Map */}
              <pre
                className="font-mono text-xs leading-tight text-[var(--fog)] bg-[var(--void)] p-3 border border-[var(--slate)] overflow-x-auto whitespace-pre"
                style={{ tabSize: 2 }}
              >
                {mapData.ascii_map}
              </pre>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-[var(--mist)] border-t border-[var(--slate)] pt-3">
                <div className="flex items-center gap-1">
                  <span className="text-[var(--amber)]">[@]</span>
                  <span>You are here</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#22c55e]">[*]</span>
                  <span>Hub/Spawn</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[var(--fog)]">[...]</span>
                  <span>Discovered</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[var(--slate)]">[???]</span>
                  <span>Undiscovered</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-[var(--mist)]">
                <div>
                  <span className="text-[var(--fog)]">{mapData.locations.filter(l => l.is_discovered).length}</span>
                  <span> discovered</span>
                </div>
                <div>
                  <span className="text-[var(--fog)]">{mapData.locations.length}</span>
                  <span> total locations</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[var(--mist)] text-sm py-8 text-center">
              No map data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
