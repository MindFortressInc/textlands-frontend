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

type TooltipPosition = {
  vertical: "above" | "below";
  horizontal: "left" | "center" | "right";
};

export function EntityHoverLink({ entity, children }: EntityHoverLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    vertical: "above",
    horizontal: "center",
  });
  const [isMobile, setIsMobile] = useState(false);
  const linkRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTouchDevice = useRef(false);

  // No link for null entity_id - just render plain text
  if (entity.entity_id === null) {
    return <span>{children}</span>;
  }

  const colorClass = entityTypeClass[entity.entity_type] || "entity-npc";

  // Calculate tooltip position with viewport awareness
  const updatePosition = useCallback(() => {
    if (!linkRef.current || !tooltipRef.current) return;

    const linkRect = linkRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12; // Min distance from viewport edge

    // Vertical positioning
    const spaceAbove = linkRect.top;
    const spaceBelow = viewportHeight - linkRect.bottom;
    const vertical: "above" | "below" =
      spaceAbove >= tooltipHeight + padding ? "above" : "below";

    // Horizontal positioning - check if centered tooltip would overflow
    const linkCenterX = linkRect.left + linkRect.width / 2;
    const halfTooltip = tooltipWidth / 2;

    let horizontal: "left" | "center" | "right" = "center";

    if (linkCenterX - halfTooltip < padding) {
      // Too close to left edge - align left
      horizontal = "left";
    } else if (linkCenterX + halfTooltip > viewportWidth - padding) {
      // Too close to right edge - align right
      horizontal = "right";
    }

    setPosition({ vertical, horizontal });
    setIsMobile(viewportWidth < 640);
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
      e.stopPropagation();
      setShowTooltip((prev) => !prev);
    }
  }, []);

  // Close tooltip
  const closeTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Close tooltip when clicking outside (mobile)
  useEffect(() => {
    if (!showTooltip || !isTouchDevice.current) return;

    const handleClickOutside = (e: TouchEvent | MouseEvent) => {
      const target = e.target as Node;
      if (
        linkRef.current &&
        !linkRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setShowTooltip(false);
      }
    };

    // Use touchend for mobile - more reliable than click
    document.addEventListener("touchend", handleClickOutside);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("touchend", handleClickOutside);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showTooltip]);

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (showTooltip) {
      // Small delay to let tooltip render before measuring
      requestAnimationFrame(updatePosition);
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
  const getTooltipStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    // Vertical
    if (position.vertical === "above") {
      style.bottom = "100%";
      style.marginBottom = "8px";
    } else {
      style.top = "100%";
      style.marginTop = "8px";
    }

    // Horizontal
    switch (position.horizontal) {
      case "left":
        style.left = "0";
        style.transform = "none";
        break;
      case "right":
        style.right = "0";
        style.transform = "none";
        break;
      case "center":
      default:
        style.left = "50%";
        style.transform = "translateX(-50%)";
        break;
    }

    return style;
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
          className={`entity-tooltip ${isMobile ? "entity-tooltip-mobile" : ""}`}
          style={getTooltipStyle()}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile close button */}
          {isMobile && (
            <button
              className="entity-tooltip-close"
              onClick={closeTooltip}
              aria-label="Close tooltip"
            >
              ×
            </button>
          )}

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
