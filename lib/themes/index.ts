// Theme definitions for Textlands

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    void: string;      // Deepest background
    shadow: string;    // Panel background
    stone: string;     // Elevated surfaces
    slate: string;     // Borders
    text: string;      // Primary text
    textDim: string;   // Secondary text
    amber: string;     // Narrative / accent
    amberDim: string;  // Muted amber
    crimson: string;   // Combat
    arcane: string;    // Dialogue / magic
    mist: string;      // System text
  };
  effects: {
    glow: boolean;         // Text glow effects
    scanlines: boolean;    // CRT scanline overlay
    vignette: boolean;     // Edge darkening
  };
  font: string;  // Font family
}

export const themes: Record<string, Theme> = {
  // Clean terminal - fast, minimal
  terminal: {
    id: "terminal",
    name: "Terminal",
    description: "Clean & fast",
    colors: {
      void: "#0a0a0a",
      shadow: "#111111",
      stone: "#1a1a1a",
      slate: "#2a2a2a",
      text: "#e5e5e5",
      textDim: "#a3a3a3",
      amber: "#f59e0b",
      amberDim: "#92400e",
      crimson: "#ef4444",
      arcane: "#22d3ee",
      mist: "#6b7280",
    },
    effects: { glow: false, scanlines: false, vignette: false },
    font: "ui-monospace, 'SF Mono', Menlo, Monaco, monospace",
  },

  // Grimoire - fancy with glows
  grimoire: {
    id: "grimoire",
    name: "Grimoire",
    description: "Arcane & atmospheric",
    colors: {
      void: "#050505",
      shadow: "#0a0a0a",
      stone: "#111111",
      slate: "#1a1a1a",
      text: "#e5e5e5",
      textDim: "#a3a3a3",
      amber: "#fbbf24",
      amberDim: "#92400e",
      crimson: "#f87171",
      arcane: "#67e8f9",
      mist: "#9ca3af",
    },
    effects: { glow: true, scanlines: true, vignette: true },
    font: "'JetBrains Mono', monospace",
  },

  // Phosphor - green classic terminal
  phosphor: {
    id: "phosphor",
    name: "Phosphor",
    description: "Classic green CRT",
    colors: {
      void: "#0a0f0a",
      shadow: "#0f140f",
      stone: "#141a14",
      slate: "#1f2a1f",
      text: "#33ff33",
      textDim: "#22aa22",
      amber: "#33ff33",
      amberDim: "#1a8a1a",
      crimson: "#ff6633",
      arcane: "#33ffff",
      mist: "#559955",
    },
    effects: { glow: true, scanlines: true, vignette: true },
    font: "ui-monospace, monospace",
  },

  // Amber - classic amber terminal
  amber_crt: {
    id: "amber_crt",
    name: "Amber CRT",
    description: "Warm amber glow",
    colors: {
      void: "#0f0a05",
      shadow: "#14100a",
      stone: "#1a150f",
      slate: "#2a2015",
      text: "#ffbb33",
      textDim: "#aa8822",
      amber: "#ffcc44",
      amberDim: "#885511",
      crimson: "#ff6644",
      arcane: "#44ddff",
      mist: "#998855",
    },
    effects: { glow: true, scanlines: true, vignette: true },
    font: "ui-monospace, monospace",
  },

  // Parchment - light mode for the heathens
  parchment: {
    id: "parchment",
    name: "Parchment",
    description: "Light & readable",
    colors: {
      void: "#f5f0e6",
      shadow: "#ebe6dc",
      stone: "#e0dbd1",
      slate: "#c5c0b6",
      text: "#2a2520",
      textDim: "#5a554a",
      amber: "#b45309",
      amberDim: "#92400e",
      crimson: "#dc2626",
      arcane: "#0891b2",
      mist: "#78716c",
    },
    effects: { glow: false, scanlines: false, vignette: false },
    font: "'Georgia', serif",
  },

  // Cyberpunk - neon future
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon nights",
    colors: {
      void: "#0a0a12",
      shadow: "#0f0f1a",
      stone: "#141422",
      slate: "#252538",
      text: "#e0e0ff",
      textDim: "#8888aa",
      amber: "#ff00ff",
      amberDim: "#880088",
      crimson: "#ff0044",
      arcane: "#00ffff",
      mist: "#6666aa",
    },
    effects: { glow: true, scanlines: true, vignette: true },
    font: "ui-monospace, monospace",
  },
};

export const defaultTheme = "terminal";

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  // Apply colors
  root.style.setProperty("--void", theme.colors.void);
  root.style.setProperty("--shadow", theme.colors.shadow);
  root.style.setProperty("--stone", theme.colors.stone);
  root.style.setProperty("--slate", theme.colors.slate);
  root.style.setProperty("--text", theme.colors.text);
  root.style.setProperty("--text-dim", theme.colors.textDim);
  root.style.setProperty("--amber", theme.colors.amber);
  root.style.setProperty("--amber-dim", theme.colors.amberDim);
  root.style.setProperty("--crimson", theme.colors.crimson);
  root.style.setProperty("--arcane", theme.colors.arcane);
  root.style.setProperty("--mist", theme.colors.mist);

  // Apply font
  root.style.setProperty("--font", theme.font);
  document.body.style.fontFamily = theme.font;

  // Apply effects via classes
  document.body.classList.toggle("theme-glow", theme.effects.glow);
  document.body.classList.toggle("theme-scanlines", theme.effects.scanlines);
  document.body.classList.toggle("theme-vignette", theme.effects.vignette);
}
