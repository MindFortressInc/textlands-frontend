# Textlands Frontend - Claude Instructions

## Quick Start

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

## Live

- **Production:** https://textlands.com
- **Vercel:** mind-fortress/textlands-frontend (auto-deploys on push)
- **Backend API:** https://api.textlands.com

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- System monospace fonts (fast loading)

## Project Structure

```
textlands-frontend/
├── app/
│   ├── globals.css      # Theme system + base styles
│   ├── layout.tsx       # Root layout with ThemeProvider
│   └── page.tsx         # Main game interface
├── components/
│   ├── game/
│   │   ├── GameLog.tsx       # Scrolling text log
│   │   ├── CommandInput.tsx  # Terminal input with history
│   │   └── CharacterPanel.tsx # Stats sidebar
│   └── ThemePicker.tsx       # Theme dropdown
├── lib/
│   ├── api.ts           # Backend API client
│   └── themes/
│       ├── index.ts     # Theme definitions
│       └── ThemeProvider.tsx
└── types/
    └── game.ts          # TypeScript types
```

## Themes

6 built-in themes stored in localStorage:

| Theme | Description |
|-------|-------------|
| `terminal` | Clean & fast (default) |
| `grimoire` | Atmospheric with glows/scanlines |
| `phosphor` | Classic green CRT |
| `amber_crt` | Warm amber glow |
| `parchment` | Light mode |
| `cyberpunk` | Neon magenta/cyan |

Add new themes in `lib/themes/index.ts`.

## API Client

All backend calls go through `lib/api.ts`:

```typescript
import * as api from "@/lib/api";

// Character
await api.createCharacter({ name, race, class });
await api.listCharacters();

// Actions
await api.look(characterId);
await api.move(characterId, "north");
await api.talk(characterId, npcId);
await api.performAction(characterId, "search the room");

// Combat
await api.startCombat(characterId, enemyIds);
await api.combatAction(sessionId, characterId, "attack", targetId);
```

## Demo Mode

Works without backend - falls back to canned responses. Good for UI development.

## Environment

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.textlands.com
```

## Related

- **Backend:** [Matt-Sandbox/side-projects/world-forge/api](https://github.com/mattrhodes77/Matt-Sandbox/tree/main/side-projects/world-forge/api)
- **Planning:** [Matt-Sandbox/side-projects/world-forge/PLANNING.md](https://github.com/mattrhodes77/Matt-Sandbox/blob/main/side-projects/world-forge/PLANNING.md)
