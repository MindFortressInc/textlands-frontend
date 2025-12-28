# TextLands Frontend

> **A fancy terminal for an AI text MMO.** The frontend is a display layer - all game logic lives in the backend.

## Live

| Component | URL |
|-----------|-----|
| **Play** | https://textlands.com |
| **API** | https://api.textlands.com |
| **API Docs** | https://api.textlands.com/docs |

**Deploys:** Vercel (auto-deploy on push to main)

---

## Quick Start

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Architecture: It's a Fancy Terminal

```
┌──────────────────────────────────────────────────┐
│  You enter the tavern. A fire crackles in the    │
│  corner. The bartender eyes you warily.          │
│                                                  │
│  > steal the ring from the sleeping merchant     │
│                                                  │
│  You slip the ruby ring from his finger. He      │
│  doesn't stir. But tomorrow, he'll notice...     │
├──────────────────────────────────────────────────┤
│  [Run away] [Hide the evidence] [Sell it]        │
├──────────────────────────────────────────────────┤
│  >                                               │
└──────────────────────────────────────────────────┘
```

### One Endpoint Does 90% of Gameplay

```typescript
const response = await api.doAction("steal the ring");
setNarrative(response.narrative);
setSuggestions(response.suggested_actions);
```

### Backend Handles Everything

```
Frontend sends: "steal the ring from the sleeping merchant"

Backend:
├─► Parse intent (theft)
├─► Roll mechanics (stealth check)
├─► Determine outcome (success!)
├─► Check witnesses (none)
├─► Update world state (ring missing)
├─► Schedule consequences (investigation tomorrow)
├─► Generate narrative (AI writes the scene)
└─► Return everything in ONE response
```

---

## Stack

| Component | Details |
|-----------|---------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Fonts** | System monospace (fast loading) |
| **Auth** | Clerk (optional, guest mode) |
| **Hosting** | Vercel |

---

## Project Structure

```
textlands-frontend/
├── app/
│   ├── globals.css           # Theme system + base styles
│   ├── layout.tsx            # Root layout with ThemeProvider
│   ├── page.tsx              # Main game interface (~1400 lines)
│   ├── auth/                 # Auth callback routes
│   └── billing/              # Stripe callback routes
├── components/
│   ├── game/
│   │   ├── GameLog.tsx       # Scrolling narrative log
│   │   ├── CommandInput.tsx  # Terminal input with history
│   │   ├── CharacterPanel.tsx # Stats/inventory sidebar
│   │   ├── CombatPanel.tsx   # Combat UI overlay
│   │   ├── ActiveScene.tsx   # NSFW scene UI
│   │   └── ...               # 20+ game components
│   └── ThemePicker.tsx       # Theme dropdown
├── lib/
│   ├── api.ts                # Backend API client (45 functions)
│   └── themes/
│       ├── index.ts          # 6 theme definitions
│       └── ThemeProvider.tsx
├── types/
│   └── game.ts               # TypeScript interfaces
└── docs/
    └── ENDPOINT_CONNECTION_STATUS.md
```

---

## Themes

6 built-in themes stored in localStorage:

| Theme | Description |
|-------|-------------|
| `terminal` | Clean dark mode (default) |
| `grimoire` | Atmospheric with glows/scanlines |
| `phosphor` | Classic green CRT |
| `amber_crt` | Warm amber glow |
| `parchment` | Light mode |
| `cyberpunk` | Neon magenta/cyan |

---

## API Client

All backend calls go through `lib/api.ts`:

```typescript
import * as api from "@/lib/api";

// CORE GAMEPLAY (90% of calls)
await api.doAction("look around");
await api.doAction("attack the goblin");

// SESSION
await api.startSession({ world_id, entity_id });
await api.getSession();

// WORLD BROWSING
await api.getInfiniteWorldsGrouped();
await api.getInfiniteCampfire(worldId);

// STATE POLLING
await api.getActiveCombat(characterId);
await api.getActiveScene();
await api.getCombatState(sessionId);

// BILLING
await api.getSubscription();
await api.getPlaytime();
```

---

## Environment

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.textlands.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Related Repos

| Repo | Purpose |
|------|---------|
| [textlands-backend](https://github.com/MindFortressInc/textlands-backend) | FastAPI backend, game engine, AI integration |

### Backend Docs (in textlands-backend)

| Doc | Purpose |
|-----|---------|
| `docs/FRONTEND_INTEGRATION.md` | **Start here** - TypeScript types, endpoint reference |
| `docs/FRONTEND_INTERFACES.md` | Multi-frontend architecture (web, GPT, Slack, SMS) |
| `docs/INVISIBLE_MECHANICS.md` | D&D-style mechanics behind the scenes |
| `docs/PREFERENCE_GRAPH.md` | 150+ dimensions of invisible personalization |
| `docs/MONETIZATION.md` | Billing API, pricing tiers |

---

## Local Docs

| Doc | Purpose |
|-----|---------|
| [docs/ENDPOINT_CONNECTION_STATUS.md](./docs/ENDPOINT_CONNECTION_STATUS.md) | API endpoint tracking, what's wired up |
| [CLAUDE.md](./CLAUDE.md) | AI assistant instructions |
