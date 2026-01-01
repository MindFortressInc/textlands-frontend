// Theme definitions for Textlands

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    void: string;
    shadow: string;
    stone: string;
    slate: string;
    text: string;
    textDim: string;
    amber: string;
    amberDim: string;
    crimson: string;
    arcane: string;
    mist: string;
    entityNpc: string;
    entityPlayer: string;
    entityLocation: string;
    entityItem: string;
  };
  font: string;
}

export const themes: Record<string, Theme> = {
  terminal: {
    id: "terminal",
    name: "Terminal",
    description: "Dark mode",
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
      entityNpc: "#22d3ee",
      entityPlayer: "#f59e0b",
      entityLocation: "#8b8b8b",
      entityItem: "#fbbf24",
    },
    font: "ui-monospace, 'SF Mono', Menlo, Monaco, monospace",
  },

  parchment: {
    id: "parchment",
    name: "Parchment",
    description: "Light mode",
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
      entityNpc: "#1e40af",
      entityPlayer: "#92400e",
      entityLocation: "#166534",
      entityItem: "#9a3412",
    },
    font: "'Georgia', serif",
  },

  modern: {
    id: "modern",
    name: "Modern",
    description: "iOS native",
    colors: {
      void: "#FFFFFF",
      shadow: "#F9FAFB",
      stone: "#F3F4F6",
      slate: "#E5E7EB",
      text: "#1F2937",
      textDim: "#6B7280",
      amber: "#0EA5E9",
      amberDim: "#0284C7",
      crimson: "#EF4444",
      arcane: "#8B5CF6",
      mist: "#9CA3AF",
      entityNpc: "#8B5CF6",
      entityPlayer: "#0EA5E9",
      entityLocation: "#10B981",
      entityItem: "#F59E0B",
    },
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
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

  // Apply entity highlight colors
  root.style.setProperty("--entity-npc", theme.colors.entityNpc);
  root.style.setProperty("--entity-player", theme.colors.entityPlayer);
  root.style.setProperty("--entity-location", theme.colors.entityLocation);
  root.style.setProperty("--entity-item", theme.colors.entityItem);

  // Apply font
  root.style.setProperty("--font", theme.font);
  document.body.style.fontFamily = theme.font;
}
