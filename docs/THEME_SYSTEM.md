# UI Theme System

Portable theme system for Next.js + Tailwind applications. Copy this doc and the associated files to port to another project.

## Quick Start

```bash
# Dependencies
npm install tailwindcss@latest
```

Files to copy:
- `lib/themes/index.ts` - Theme definitions
- `lib/themes/ThemeProvider.tsx` - React context provider
- `app/globals.css` - CSS variables + Tailwind config

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Theme Definition (TypeScript)                                  │
│  lib/themes/index.ts                                            │
│  - Theme interface with semantic color names                    │
│  - Theme objects with hex values                                │
│  - applyTheme() function to set CSS variables                   │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ThemeProvider (React Context)                                  │
│  lib/themes/ThemeProvider.tsx                                   │
│  - Wraps app, provides theme context                            │
│  - Persists selection to localStorage                           │
│  - Auto-detects system preference (dark/light)                  │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  CSS Variables (Tailwind Integration)                           │
│  app/globals.css                                                │
│  - :root defines default CSS variables                          │
│  - @theme inline maps CSS vars to Tailwind colors               │
│  - Components use: bg-[var(--void)], text-[var(--text)]         │
└─────────────────────────────────────────────────────────────────┘
```

## Theme Interface

```typescript
// lib/themes/index.ts
export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    // Background scale (darkest to lightest in dark mode)
    void: string;      // Deepest background
    shadow: string;    // Secondary background
    stone: string;     // Tertiary/card background
    slate: string;     // Borders, subtle elements

    // Text
    text: string;      // Primary text
    textDim: string;   // Secondary/muted text

    // Accent colors
    amber: string;     // Primary accent (buttons, links, highlights)
    amberDim: string;  // Dimmed accent (hover states, secondary accent)
    crimson: string;   // Error/danger/destructive
    arcane: string;    // Info/special/secondary highlight
    mist: string;      // Neutral/disabled

    // Entity-specific (optional - for apps with categorized items)
    entityNpc: string;
    entityPlayer: string;
    entityLocation: string;
    entityItem: string;
  };
  font: string;
}
```

## Color Semantics

| Variable | Purpose | Usage |
|----------|---------|-------|
| `--void` | Deepest background | `body`, main container |
| `--shadow` | Secondary background | Cards, panels, dropdowns |
| `--stone` | Tertiary background | Interactive element backgrounds |
| `--slate` | Borders/dividers | All borders, separators |
| `--text` | Primary text | Body text, headings |
| `--text-dim` | Secondary text | Labels, captions, placeholders |
| `--amber` | Primary accent | Buttons, links, active states |
| `--amber-dim` | Dimmed accent | Hover states, selection highlight |
| `--crimson` | Error/danger | Error messages, destructive actions |
| `--arcane` | Info/special | Secondary highlights, info states |
| `--mist` | Neutral | Disabled states, tertiary text |

## Theme Definitions

### Terminal (Dark)

```typescript
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
}
```

### Parchment (Light)

```typescript
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
}
```

### Modern (iOS Native)

```typescript
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
    amber: "#0EA5E9",       // Note: blue accent for iOS feel
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
}
```

## CSS Variables Setup

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  /* Default colors (terminal theme) - overridden by JS */
  --void: #0a0a0a;
  --shadow: #111111;
  --stone: #1a1a1a;
  --slate: #2a2a2a;
  --text: #e5e5e5;
  --text-dim: #a3a3a3;
  --amber: #f59e0b;
  --amber-dim: #92400e;
  --crimson: #ef4444;
  --arcane: #22d3ee;
  --mist: #6b7280;
  --font: ui-monospace, 'SF Mono', Menlo, Monaco, monospace;
}

/* Tailwind v4 theme integration */
@theme inline {
  --color-void: var(--void);
  --color-shadow: var(--shadow);
  --color-stone: var(--stone);
  --color-slate: var(--slate);
  --color-amber: var(--amber);
  --color-amber-dim: var(--amber-dim);
  --color-crimson: var(--crimson);
  --color-arcane: var(--arcane);
  --color-mist: var(--mist);
}

body {
  background: var(--void);
  color: var(--text);
  font-family: var(--font);
}
```

## ThemeProvider Implementation

```tsx
// lib/themes/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { themes, defaultTheme, applyTheme, type Theme } from "./index";

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemDefaultTheme(): string {
  if (typeof window === "undefined") return defaultTheme;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "terminal" : "parchment";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(defaultTheme);
  const theme = themes[themeId] || themes[defaultTheme];

  useEffect(() => {
    // Load saved theme from localStorage
    const saved = localStorage.getItem("app-theme");
    if (saved && themes[saved]) {
      setThemeId(saved);
    } else {
      setThemeId(getSystemDefaultTheme());
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("app-theme", themeId);
  }, [theme, themeId]);

  const setTheme = (id: string) => {
    if (themes[id]) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

## Apply Theme Function

```typescript
// lib/themes/index.ts
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

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
  root.style.setProperty("--font", theme.font);

  document.body.style.fontFamily = theme.font;
}
```

## Component Styling Patterns

### Using CSS Variables in Tailwind Classes

```tsx
// Direct CSS variable reference (recommended)
<div className="bg-[var(--void)] text-[var(--text)]">
<button className="border border-[var(--slate)] hover:border-[var(--amber)]">
<span className="text-[var(--text-dim)]">

// Tailwind color names (if @theme inline configured)
<div className="bg-void text-mist">
```

### Button Patterns

```tsx
// Primary button
<button className="
  bg-[var(--stone)]
  border border-[var(--slate)]
  text-[var(--text)]
  hover:bg-[var(--slate)]
  hover:border-[var(--amber)]
  active:bg-[var(--slate)]
  transition-colors
">

// Accent button
<button className="
  bg-[var(--amber)]
  text-[var(--void)]
  hover:bg-[var(--amber-dim)]
">

// Destructive button
<button className="
  bg-[var(--crimson)]
  text-white
">
```

### Input Patterns

```tsx
<input className="
  bg-[var(--shadow)]
  border border-[var(--slate)]
  text-[var(--text)]
  placeholder:text-[var(--text-dim)]
  focus:border-[var(--amber)]
  focus:outline-none
"/>
```

### Card Patterns

```tsx
<div className="
  bg-[var(--shadow)]
  border border-[var(--slate)]
  rounded-lg
">
```

## Theme-Specific CSS Overrides

For components that need different styling per theme, use `[data-theme="X"]` selectors:

```css
/* Default (terminal) styling */
.suggestion-chip {
  background: var(--stone);
  border: 1px solid var(--slate);
}

/* Parchment theme - softer */
[data-theme="parchment"] .suggestion-chip {
  background: var(--shadow);
}

/* Modern theme - iOS-style shadows */
[data-theme="modern"] .suggestion-chip {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

To enable this, add `data-theme` attribute in ThemeProvider:

```typescript
useEffect(() => {
  applyTheme(theme);
  document.documentElement.setAttribute("data-theme", themeId);
}, [theme, themeId]);
```

## Selection Color

```css
::selection {
  background: var(--amber-dim);
  color: var(--text);
}

[data-theme="modern"] ::selection {
  background: rgba(14, 165, 233, 0.2);
  color: #1F2937;
}
```

## Scrollbar Styling

```css
* {
  scrollbar-width: thin;
  scrollbar-color: var(--slate) var(--void);
}

*::-webkit-scrollbar { width: 6px; }
*::-webkit-scrollbar-track { background: var(--void); }
*::-webkit-scrollbar-thumb { background: var(--slate); }
```

## Layout Root Setup

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Theme Picker Component

```tsx
"use client";

import { useTheme } from "@/lib/themes/ThemeProvider";

export function ThemePicker() {
  const { themeId, setTheme, availableThemes } = useTheme();

  return (
    <select
      value={themeId}
      onChange={(e) => setTheme(e.target.value)}
      className="bg-[var(--shadow)] border border-[var(--slate)] text-[var(--text)] rounded px-2 py-1"
    >
      {Object.values(availableThemes).map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.name}
        </option>
      ))}
    </select>
  );
}
```

## Accessibility

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .animate-slide-down,
  .animate-fade-in {
    animation: none;
  }

  button, .interactive {
    transition: none;
  }
}
```

### System Preference Detection

The ThemeProvider auto-detects `prefers-color-scheme` and defaults to:
- Dark mode preference → "terminal" theme
- Light mode preference → "parchment" theme

Users can override with explicit selection (persisted to localStorage).

## Adding a New Theme

1. Add theme definition in `lib/themes/index.ts`:

```typescript
export const themes: Record<string, Theme> = {
  // ... existing themes

  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue",
    colors: {
      void: "#0a1628",
      shadow: "#0f1d32",
      stone: "#1a2940",
      slate: "#2a3f5f",
      text: "#e0e8f0",
      textDim: "#8094a8",
      amber: "#38bdf8",
      amberDim: "#0284c7",
      crimson: "#f87171",
      arcane: "#a78bfa",
      mist: "#64748b",
      entityNpc: "#a78bfa",
      entityPlayer: "#38bdf8",
      entityLocation: "#4ade80",
      entityItem: "#fbbf24",
    },
    font: "ui-monospace, 'SF Mono', Menlo, Monaco, monospace",
  },
};
```

2. (Optional) Add theme-specific CSS overrides in `globals.css`:

```css
[data-theme="ocean"] .special-component {
  /* Ocean-specific styling */
}
```

## Port Checklist

When porting to a new project:

1. [ ] Copy `lib/themes/index.ts`
2. [ ] Copy `lib/themes/ThemeProvider.tsx`
3. [ ] Update localStorage key from `"textlands-theme"` to your app name
4. [ ] Copy CSS variable definitions to `globals.css`
5. [ ] Add `@theme inline` block for Tailwind integration
6. [ ] Wrap app in `<ThemeProvider>` in layout
7. [ ] Add `<ThemePicker>` component somewhere accessible
8. [ ] Update any theme-specific overrides for your components
9. [ ] Remove entity colors if not needed

## File Dependencies

```
lib/
├── themes/
│   ├── index.ts          # Theme definitions + applyTheme
│   └── ThemeProvider.tsx # React context + useTheme hook
└── errors.ts             # Optional: safeStorage wrapper for private browsing

app/
├── globals.css           # CSS variables + Tailwind config
└── layout.tsx            # ThemeProvider wrapper

components/
└── ThemePicker.tsx       # Optional: UI for theme selection
```

## Safe Storage Wrapper (Optional)

For handling private browsing mode where localStorage throws:

```typescript
// lib/errors.ts
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail in private browsing
    }
  },
};
```
