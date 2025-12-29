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

## Architecture: Fancy Terminal

**This is NOT a typical web app.** It's a text-based MMO where AI handles all game logic.

```
┌──────────────────────────────────────────────────┐
│  You enter the tavern. A fire crackles...        │
│                                                  │
│  > steal the ring from the sleeping merchant     │
│                                                  │
│  You slip the ruby ring from his finger...       │
├──────────────────────────────────────────────────┤
│  [Run away] [Hide the evidence] [Sell it]        │
└──────────────────────────────────────────────────┘
```

### One Endpoint Does Everything

```typescript
// 90% of gameplay
const result = await api.doAction("steal the ring");
setNarrative(result.narrative);
setSuggestions(result.suggested_actions);
```

Backend handles: parsing intent, rolling mechanics, checking witnesses, updating world state, scheduling consequences, generating narrative.

## API Client

All backend calls go through `lib/api.ts`:

```typescript
import * as api from "@/lib/api";

// CORE GAMEPLAY - all through doAction()
await api.doAction("look around");
await api.doAction("go north");
await api.doAction("talk to the bartender");
await api.doAction("attack the goblin");
await api.doAction("kiss her passionately");

// SESSION
await api.startSession({ world_id, entity_id });

// STATE POLLING (read-only)
await api.getActiveCombat(characterId);
await api.getActiveScene(characterId);
await api.getCombatState(sessionId);

// WORLD BROWSING
await api.getInfiniteWorldsGrouped();
await api.getInfiniteCampfire(worldId);

// BILLING
await api.getSubscription();
await api.getPlaytime();
```

### State Changes Are Deltas

```typescript
// response.state_changes values are ADD/SUBTRACT, not absolute
if (result.state_changes.hp) {
  character.hp += result.state_changes.hp;  // +10 heals, -5 damages
}
```

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

## Demo Mode

Works without backend - falls back to canned responses. Good for UI development.

## Environment

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.textlands.com
```

## Related

- **Backend:** /Users/mattrhodes/Coding/textlands-backend
- **Backend Docs:** /Users/mattrhodes/Coding/textlands-backend/docs/FRONTEND_INTEGRATION.md
