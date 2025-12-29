"use client";

import { useState, useEffect } from "react";
import type { TimelineEvent } from "@/lib/api";
import * as api from "@/lib/api";

interface EntityTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  entityName?: string;
}

const eventTypeStyles: Record<string, { color: string; icon: string }> = {
  creation: { color: "--amber", icon: "+" },
  discovery: { color: "--arcane", icon: "o" },
  interaction: { color: "--fog", icon: "*" },
  modification: { color: "--text", icon: "~" },
  destruction: { color: "--crimson", icon: "x" },
  default: { color: "--mist", icon: "-" },
};

export function EntityTimelineModal({
  isOpen,
  onClose,
  entityId,
  entityName,
}: EntityTimelineModalProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !entityId) return;

    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const data = await api.getEntityTimeline(entityId);
        setEvents(data);
      } catch (err) {
        console.error("[Timeline] Failed to fetch:", err);
      }
      setLoading(false);
    };

    fetchTimeline();
  }, [isOpen, entityId]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventStyle = (eventType: string) => {
    return eventTypeStyles[eventType.toLowerCase()] || eventTypeStyles.default;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">
            {entityName ? `TIMELINE: ${entityName}` : "ENTITY TIMELINE"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--mist)] animate-pulse">
              Loading...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-[var(--mist)]">
              <p>No recorded history</p>
              <p className="text-sm mt-2">This entity has no timeline events yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const style = getEventStyle(event.event_type);
                return (
                  <div
                    key={event.id}
                    className="relative pl-6 pb-4 border-l border-[var(--slate)] last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                      style={{
                        borderColor: `var(${style.color})`,
                        color: `var(${style.color})`,
                        backgroundColor: "var(--void)",
                      }}
                    >
                      {style.icon}
                    </div>

                    {/* Event content */}
                    <div className="ml-2">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{ color: `var(${style.color})` }}
                        >
                          {event.event_type}
                        </span>
                        <span className="text-[var(--mist)] text-xs whitespace-nowrap">
                          {formatDate(event.occurred_at)}
                        </span>
                      </div>
                      <p className="text-[var(--text)] text-sm mt-1">
                        {event.description}
                      </p>
                      {event.caused_by_player_id && (
                        <p className="text-[var(--mist)] text-xs mt-1">
                          by player
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)]">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
