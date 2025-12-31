"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { EntityReference, EntityType } from "@/types/game";

interface EntityHoverLinkProps {
  entity: EntityReference;
  children: React.ReactNode;
}

const entityTypeClass: Record<EntityType, string> = {
  npc: "entity-npc",
  player: "entity-player",
  location: "entity-location",
  item: "entity-item",
};

export function EntityHoverLink({ entity, children }: EntityHoverLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const linkRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTouchDevice = useRef(false);

  // No link for null entity_id - just render plain text
  if (entity.entity_id === null) {
    return <span>{children}</span>;
  }

  const colorClass = entityTypeClass[entity.entity_type] || "entity-npc";

  // Calculate tooltip position
  const updatePosition = useCallback(() => {
    if (!linkRef.current || !tooltipRef.current) return;

    const linkRect = linkRef.current.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const spaceAbove = linkRect.top;
    const minSpaceNeeded = tooltipHeight + 8;

    setPosition(spaceAbove >= minSpaceNeeded ? "above" : "below");
  }, []);

  // Handle mouse enter with delay
  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice.current) return;

    hoverTimeout.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    if (!isTouchDevice.current) {
      setShowTooltip(false);
    }
  }, []);

  // Handle touch tap
  const handleTouchStart = useCallback(() => {
    isTouchDevice.current = true;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice.current) {
      e.preventDefault();
      setShowTooltip((prev) => !prev);
    }
  }, []);

  // Close tooltip when clicking outside (mobile)
  useEffect(() => {
    if (!showTooltip || !isTouchDevice.current) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        linkRef.current &&
        !linkRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showTooltip]);

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (showTooltip) {
      updatePosition();
    }
  }, [showTooltip, updatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  // Tooltip positioning styles
  const tooltipStyle: React.CSSProperties = {
    left: "50%",
    transform: "translateX(-50%)",
    ...(position === "above"
      ? { bottom: "100%", marginBottom: "6px" }
      : { top: "100%", marginTop: "6px" }),
  };

  const hasDetails = entity.met_at || entity.relationship;
  const hasMemory = entity.memory;

  return (
    <span
      ref={linkRef}
      className={`entity-link ${colorClass} relative inline`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-describedby={showTooltip ? `tooltip-${entity.entity_id}` : undefined}
    >
      {children}

      {showTooltip && (
        <div
          ref={tooltipRef}
          id={`tooltip-${entity.entity_id}`}
          className="entity-tooltip"
          style={tooltipStyle}
          role="tooltip"
        >
          {/* Name */}
          <div className={`entity-tooltip-name ${colorClass}`}>
            {entity.name}
          </div>

          {/* Role */}
          {entity.role && (
            <div className="entity-tooltip-role">{entity.role}</div>
          )}

          {/* Details section */}
          {hasDetails && (
            <>
              <div className="entity-tooltip-divider" />
              {entity.met_at && (
                <div className="entity-tooltip-detail">
                  Met: <span>{entity.met_at}</span>
                </div>
              )}
              {entity.relationship && (
                <div className="entity-tooltip-detail">
                  Relationship: <span>{entity.relationship}</span>
                </div>
              )}
            </>
          )}

          {/* Memory quote */}
          {hasMemory && (
            <>
              {hasDetails && <div className="entity-tooltip-divider" />}
              <div className="entity-tooltip-memory">"{entity.memory}"</div>
            </>
          )}

          {/* Stranger fallback */}
          {!entity.role && !hasDetails && !hasMemory && (
            <div className="entity-tooltip-detail">
              You haven't met this {entity.entity_type}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
