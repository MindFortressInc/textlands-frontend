"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "@/lib/api";
import type { InventoryResponse, InventoryItem } from "@/lib/api";

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIER_COLORS: Record<string, string> = {
  common: "var(--mist)",
  uncommon: "#22c55e",
  rare: "var(--arcane)",
  epic: "#a855f7",
  legendary: "var(--amber)",
};

const TIER_GLOW: Record<string, string> = {
  common: "none",
  uncommon: "0 0 4px #22c55e40",
  rare: "0 0 8px var(--arcane), 0 0 12px var(--arcane)",
  epic: "0 0 8px #a855f7, 0 0 16px #a855f780",
  legendary: "0 0 10px var(--amber), 0 0 20px var(--amber), 0 0 30px var(--amber-dim)",
};

const SLOT_LABELS: Record<string, string> = {
  weapon: "WPN",
  offhand: "OFF",
  head: "HEAD",
  chest: "BODY",
  legs: "LEGS",
  feet: "FEET",
  hands: "HAND",
  accessory: "ACC",
};

const SLOT_ORDER = ["weapon", "offhand", "head", "chest", "hands", "legs", "feet", "accessory"];

const TYPE_ICONS: Record<string, string> = {
  weapon: "⚔",
  armor: "◊",
  accessory: "◈",
  consumable: "◉",
  quest: "★",
  material: "◆",
  misc: "○",
};

function ItemRow({
  item,
  onClick,
  selected,
  index,
}: {
  item: InventoryItem;
  onClick: () => void;
  selected: boolean;
  index: number;
}) {
  const tier = item.item.tier;
  const isGlowing = ["rare", "epic", "legendary"].includes(tier);

  return (
    <button
      onClick={onClick}
      data-index={index}
      className={`w-full text-left px-2 py-1 flex items-center gap-2 transition-all duration-150 font-mono text-sm
        ${selected
          ? "bg-[var(--stone)] border-l-2 border-[var(--amber)]"
          : "border-l-2 border-transparent hover:bg-[var(--shadow)] hover:border-[var(--slate)]"
        }`}
    >
      <span className="text-[var(--mist)] w-4">{TYPE_ICONS[item.item.item_type] || "○"}</span>
      <span
        className={`flex-1 truncate ${isGlowing ? "animate-pulse-subtle" : ""}`}
        style={{
          color: TIER_COLORS[tier] || "var(--text)",
          textShadow: TIER_GLOW[tier] || "none",
        }}
      >
        {item.item.name}
        {item.quantity > 1 && (
          <span className="text-[var(--mist)]"> ×{item.quantity}</span>
        )}
      </span>
      {item.is_equipped && (
        <span className="text-xs text-[var(--amber)] font-bold">[E]</span>
      )}
    </button>
  );
}

function ItemDetail({ item }: { item: InventoryItem }) {
  const { item: itemData } = item;
  const tier = itemData.tier;
  const isGlowing = ["rare", "epic", "legendary"].includes(tier);

  return (
    <div className="p-3 space-y-3 font-mono text-sm">
      {/* Item Name with ASCII frame */}
      <div className="border border-[var(--slate)] p-2 bg-[var(--void)]">
        <div
          className={`font-bold text-center ${isGlowing ? "animate-pulse-subtle" : ""}`}
          style={{
            color: TIER_COLORS[tier],
            textShadow: TIER_GLOW[tier],
          }}
        >
          {TYPE_ICONS[itemData.item_type] || "○"} {itemData.name}
        </div>
        <div className="text-xs text-[var(--mist)] text-center mt-1">
          [{tier.toUpperCase()}] {itemData.item_type}
          {itemData.slot && ` • ${itemData.slot}`}
        </div>
      </div>

      {/* Description */}
      <div className="text-[var(--fog)] text-xs leading-relaxed border-l-2 border-[var(--slate)] pl-2">
        {itemData.description || "No description."}
      </div>

      {/* Stats Block */}
      {Object.keys(itemData.stats).length > 0 && (
        <div className="border border-[var(--slate)] bg-[var(--void)]">
          <div className="text-xs text-[var(--mist)] px-2 py-1 border-b border-[var(--slate)] bg-[var(--shadow)]">
            ┌─ STATS ─┐
          </div>
          <div className="p-2 space-y-1">
            {Object.entries(itemData.stats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between text-xs">
                <span className="text-[var(--fog)] uppercase tracking-wide">{stat}</span>
                <span className="text-[var(--amber)]">+{value as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-xs text-[var(--mist)] space-y-1 pt-2 border-t border-[var(--slate)]">
        <div className="flex justify-between">
          <span>VALUE</span>
          <span className="text-[var(--amber)]">{itemData.base_value}g</span>
        </div>
        {itemData.level_required > 1 && (
          <div className="flex justify-between">
            <span>REQ LV</span>
            <span className="text-[var(--crimson)]">{itemData.level_required}</span>
          </div>
        )}
        {item.acquired_from && (
          <div className="flex justify-between">
            <span>SOURCE</span>
            <span className="text-[var(--fog)]">{item.acquired_from}</span>
          </div>
        )}
        {item.is_equipped && (
          <div className="text-[var(--amber)] text-center mt-2 animate-pulse">
            ◆ EQUIPPED ◆
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentSlot({
  slot,
  item,
  selected,
  onClick
}: {
  slot: string;
  item?: InventoryItem;
  selected: boolean;
  onClick: () => void;
}) {
  const tier = item?.item.tier || "common";

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-left transition-all duration-150 border border-transparent
        ${selected ? "bg-[var(--stone)] border-[var(--amber)]" : "hover:bg-[var(--shadow)] hover:border-[var(--slate)]"}
        ${!item ? "opacity-50" : ""}`}
    >
      <span className="text-[var(--mist)] text-[10px] font-bold tracking-wider">
        {SLOT_LABELS[slot]}
      </span>
      <div
        className="text-xs truncate mt-0.5"
        style={{
          color: item ? TIER_COLORS[tier] : "var(--slate)",
          textShadow: item ? TIER_GLOW[tier] : "none",
        }}
      >
        {item ? item.item.name : "- empty -"}
      </div>
    </button>
  );
}

export function InventoryPanel({ isOpen, onClose }: InventoryPanelProps) {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch inventory on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setSelectedItem(null);
      setSelectedIndex(0);
      api
        .getInventory()
        .then((data) => {
          setInventory(data);
          if (data.items.length > 0) {
            setSelectedItem(data.items[0]);
          }
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!inventory || !isOpen) return;

    const items = inventory.items;
    if (items.length === 0) return;

    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, items.length - 1);
      setSelectedIndex(newIndex);
      setSelectedItem(items[newIndex]);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(newIndex);
      setSelectedItem(items[newIndex]);
    }
  }, [inventory, isOpen, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && inventory) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex, inventory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with scanlines */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          )`,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-[var(--void)] border-2 border-[var(--slate)] w-full max-w-2xl max-h-[80vh] flex flex-col font-mono shadow-2xl"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* CRT screen effect overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(255,255,255,0.1) 1px,
              rgba(255,255,255,0.1) 2px
            )`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-[var(--slate)] bg-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--amber)] font-bold tracking-wider">◆ INVENTORY ◆</span>
            {inventory && (
              <span className="text-[var(--mist)] text-xs">
                [{inventory.total_items} items]
              </span>
            )}
            {inventory?.encumbrance && (
              <span className={`text-xs ${
                inventory.encumbrance.encumbrance_level === "overloaded" ? "text-[var(--crimson)]" :
                inventory.encumbrance.encumbrance_level === "encumbered" ? "text-[var(--crimson)]" :
                inventory.encumbrance.encumbrance_level === "burdened" ? "text-[var(--amber)]" :
                "text-[var(--mist)]"
              }`}>
                {inventory.encumbrance.current_load.toFixed(1)} kg / {inventory.encumbrance.total_capacity.toFixed(1)} kg
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--mist)] text-xs hidden sm:block">
              ↑↓/jk navigate • ESC close
            </span>
            <button
              onClick={onClose}
              className="text-[var(--mist)] hover:text-[var(--crimson)] transition-colors font-bold"
            >
              [×]
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[var(--amber)] animate-pulse">◌ LOADING ◌</div>
            <div className="text-[var(--mist)] text-xs mt-2">Accessing inventory...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-[var(--crimson)]">⚠ ERROR</div>
            <div className="text-[var(--mist)] text-xs mt-2">{error}</div>
          </div>
        ) : !inventory ? (
          <div className="p-8 text-center text-[var(--mist)]">No inventory data</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Equipment + Items */}
            <div className="flex-1 overflow-hidden flex flex-col border-r-2 border-[var(--slate)]">
              {/* Equipment Grid */}
              <div className="p-3 border-b border-[var(--slate)] bg-[var(--shadow)]">
                <div className="text-[10px] text-[var(--mist)] mb-2 tracking-widest">┌─ EQUIPPED ─┐</div>
                <div className="grid grid-cols-4 gap-1">
                  {SLOT_ORDER.map((slot) => {
                    const equipped = inventory.equipped[slot];
                    return (
                      <EquipmentSlot
                        key={slot}
                        slot={slot}
                        item={equipped}
                        selected={selectedItem?.id === equipped?.id}
                        onClick={() => equipped && setSelectedItem(equipped)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Item List */}
              <div className="flex-1 overflow-y-auto" ref={listRef}>
                <div className="p-3">
                  <div className="text-[10px] text-[var(--mist)] mb-2 flex justify-between tracking-widest">
                    <span>┌─ ITEMS ─┐</span>
                    <span className="text-[var(--amber)]">{inventory.total_value}g TOTAL</span>
                  </div>
                  {inventory.items.length === 0 ? (
                    <div className="text-[var(--mist)] text-sm py-8 text-center border border-dashed border-[var(--slate)]">
                      ∅ Your pack is empty
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {inventory.items.map((item, idx) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          index={idx}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedIndex(idx);
                          }}
                          selected={selectedItem?.id === item.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Item Detail */}
            <div className="w-64 bg-[var(--shadow)] overflow-y-auto">
              {selectedItem ? (
                <ItemDetail item={selectedItem} />
              ) : (
                <div className="p-4 text-center text-[var(--mist)] text-xs h-full flex items-center justify-center">
                  <div>
                    <div className="text-2xl mb-2 opacity-30">◇</div>
                    <div>Select an item</div>
                    <div>to view details</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-1.5 border-t-2 border-[var(--slate)] bg-[var(--shadow)] text-[10px] text-[var(--mist)] flex justify-between">
          <span>TEXTLANDS v1.0</span>
          <span>◆ INV SYSTEM ◆</span>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
