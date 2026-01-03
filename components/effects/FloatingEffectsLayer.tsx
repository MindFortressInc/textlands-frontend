"use client";

import { useFloatingEffects } from "@/contexts/FloatingEffectsContext";
import { DamageFloater } from "./DamageFloater";
import { GoldFloater } from "./GoldFloater";
import { LocationBanner } from "./LocationBanner";
import { LootToast } from "./LootToast";

export function FloatingEffectsLayer() {
  const { effects, removeEffect } = useFloatingEffects();

  // Separate effects by type for different positioning
  const hpEffects = effects.filter((e) => e.type === "damage" || e.type === "heal");
  const goldEffects = effects.filter((e) => e.type === "gold");
  const locationEffects = effects.filter((e) => e.type === "location");
  const lootEffects = effects.filter((e) => e.type === "loot");

  return (
    <>
      {/* HP Floaters - near HP bar on right side (desktop) / top (mobile) */}
      <div className="fixed z-50 pointer-events-none
        top-4 right-4 md:top-auto md:right-64 md:bottom-1/2
        flex flex-col items-end gap-1"
      >
        {hpEffects.map((effect) => (
          <DamageFloater
            key={effect.id}
            effect={effect}
            onComplete={() => removeEffect(effect.id)}
          />
        ))}
      </div>

      {/* Gold Floaters - near gold display */}
      <div className="fixed z-50 pointer-events-none
        top-4 right-16 md:top-auto md:right-64 md:bottom-[45%]
        flex flex-col items-end gap-1"
      >
        {goldEffects.map((effect) => (
          <GoldFloater
            key={effect.id}
            effect={effect}
            onComplete={() => removeEffect(effect.id)}
          />
        ))}
      </div>

      {/* Location Banner - center of screen */}
      <div className="fixed z-50 pointer-events-none inset-0 flex items-center justify-center">
        {locationEffects.map((effect) => (
          <LocationBanner
            key={effect.id}
            effect={effect}
            onComplete={() => removeEffect(effect.id)}
          />
        ))}
      </div>

      {/* Loot Toasts - right side, stacked */}
      <div className="fixed z-50 pointer-events-none
        bottom-24 right-4 md:bottom-20 md:right-60
        flex flex-col-reverse gap-2"
      >
        {lootEffects.slice(0, 4).map((effect) => (
          <LootToast
            key={effect.id}
            effect={effect}
            onComplete={() => removeEffect(effect.id)}
          />
        ))}
      </div>
    </>
  );
}
