# TextLands API Endpoint Connection Status

**Last Updated:** 2025-12-28
**Purpose:** Track integration status of all backend API endpoints with frontend

## Architecture Note

TextLands is a "fancy terminal" - the frontend is basically a display layer. **90% of gameplay goes through `POST /actions/do`**. Most other endpoints exist for:
- Multi-frontend support (GPT, Slack, SMS, Discord, CLI)
- Backend-internal admin tools
- Optional UI enhancements

## Legend
- 🚀 **Core Frontend** - Essential for web frontend operation
- ✅ **Nice-to-Have UI** - Connected with UI, but not core gameplay
- 🗑️ **Removed** - Deleted from api.ts (legacy/backend-internal)

---

## Core Frontend Endpoints (27 total)

These are the endpoints the web frontend actually needs.

### Session Flow (7)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| GET | `/health` | `checkHealth()` | 🚀 Demo mode detection |
| GET | `/session/current` | `getSession()` | 🚀 Load player + content_settings |
| POST | `/session/start` | `startSession()` | 🚀 Legacy curated (still works) |
| POST | `/session/claim` | `claimGuestSession()` | 🚀 Claim guest to account |
| DELETE | `/session/guest` | `endGuestSession()` | 🚀 End guest session |
| GET | `/session/preferences` | `getPreferences()` | 🚀 Reasoning toggle |
| POST | `/session/preferences` | `updatePreferences()` | 🚀 Save reasoning pref |

### World Browsing (4)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| GET | `/infinite/worlds/grouped` | `getInfiniteWorldsGrouped()` | 🚀 Main world browser |
| GET | `/infinite/worlds/{id}` | `getInfiniteWorld()` | 🚀 World details |
| POST | `/infinite/worlds` | `createWorld()` | 🚀 User world creation |
| GET | `/infinite/worlds/{id}/campfire` | `getInfiniteCampfire()` | 🚀 Character selection |

### Session Start (2)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| POST | `/infinite/session/start` | `startInfiniteSession()` | 🚀 Start game with entity |
| POST | `/infinite/worlds/{id}/campfire/create` | `createCampfireCharacter()` | 🚀 Custom character creation |

### Core Gameplay (2)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| POST | `/actions/do` | `doAction()` | 🚀 **THE main endpoint (90%)** |
| GET | `/actions/{id}/explain` | `explainAction()` | 🚀 On-demand reasoning |

### Combat Flow (2)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| GET | `/combat/{session_id}` | `getCombatState()` | 🚀 CombatPanel state |
| GET | `/combat/active/{character_id}` | `getActiveCombat()` | 🚀 Check active combat |

### Scene Flow (5)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| GET | `/intimacy/active` | `getActiveScene()` | 🚀 Check active scene |
| POST | `/intimacy/scene/negotiate` | `negotiateScene()` | 🚀 SceneNegotiation |
| POST | `/intimacy/scene/action` | `sceneAction()` | 🚀 ActiveScene |
| POST | `/intimacy/scene/safeword` | `invokeSafeword()` | 🚀 Safety exit |
| POST | `/intimacy/scene/complete` | `completeScene()` | 🚀 End scene |

### NSFW Preferences (2)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| POST | `/infinite/player/{id}/preferences` | `updatePlayerPreferences()` | 🚀 Toggle NSFW (settings) |
| POST | `/infinite/player/{id}/nsfw-prompt` | `handleNsfwPrompt()` | 🚀 Age verification |

> **Note:** NSFW state on init now comes from `session.content_settings` (bundled in `/session/current`).
> `getPlayerPreferences()` still exists but is no longer called on app load.

### Billing (12)
| Method | Endpoint | API Function | Status |
|--------|----------|--------------|--------|
| GET | `/billing/subscription` | `getSubscription()` | 🚀 Check subscription |
| POST | `/billing/subscription/create` | `createSubscription()` | 🚀 Start checkout |
| POST | `/billing/subscription/cancel` | `cancelSubscription()` | 🚀 Cancel subscription |
| GET | `/billing/tokens` | `getTokenBalance()` | 🚀 Token balance |
| POST | `/billing/tokens/purchase` | `purchaseTokens()` | 🚀 Buy tokens |
| GET | `/billing/playtime` | `getPlaytime()` | 🚀 Playtime remaining |
| GET | `/billing/free-uses` | `getFreeUses()` | 🚀 Free uses remaining |
| GET | `/billing/usage` | `getUsage()` | 🚀 Monthly usage |
| POST | `/billing/unlock/nsfw` | `unlockNsfw()` | 🚀 Unlock NSFW |
| POST | `/billing/unlock/death-recovery` | `unlockDeathRecovery()` | 🚀 Unlock death recovery |
| POST | `/billing/unlock/fate-reroll` | `unlockFateReroll()` | 🚀 Unlock fate reroll |
| POST | `/billing/unlock/playtime` | `unlockPlaytime()` | 🚀 Unlock extra playtime |

---

## Nice-to-Have UI Endpoints (14 total)

These have UI but aren't core gameplay. Could be removed to simplify.

### World Templates
| Method | Endpoint | API Function | UI Component |
|--------|----------|--------------|--------------|
| GET | `/infinite/templates` | `getWorldTemplates()` | WorldTemplatesModal |
| GET | `/infinite/templates/{slug}` | `getWorldTemplate()` | WorldTemplatesModal |

### Leaderboards & Stats
| Method | Endpoint | API Function | UI Component |
|--------|----------|--------------|--------------|
| GET | `/infinite/worlds/{id}/leaderboard` | `getWorldLeaderboard()` | LeaderboardModal |
| GET | `/infinite/leaderboard/global` | `getGlobalLeaderboard()` | LeaderboardModal |
| GET | `/infinite/worlds/{id}/player/{id}/stats` | `getPlayerWorldStats()` | PlayerStatsModal |
| GET | `/infinite/worlds/{id}/player/{id}/influence` | `getPlayerInfluence()` | CharacterPanel |
| GET | `/infinite/worlds/{id}/influence-leaderboard` | `getInfluenceLeaderboard()` | LeaderboardModal |

### Entity Timeline & Location
| Method | Endpoint | API Function | UI Component |
|--------|----------|--------------|--------------|
| GET | `/infinite/entities/{id}/timeline` | `getEntityTimeline()` | EntityTimelineModal |
| POST | `/infinite/entities/{id}/timeline` | `addEntityTimelineEvent()` | EntityTimelineModal |
| PATCH | `/infinite/entities/{id}/state` | `updateEntityState()` | Admin only |
| GET | `/infinite/entities/{id}/footprints` | `getLocationFootprints()` | CharacterPanel |
| POST | `/infinite/entities/{id}/messages` | `leaveLocationMessage()` | CharacterPanel |
| POST | `/infinite/entities/{id}/visit` | `recordLocationVisit()` | Auto by backend |

---

## Removed from api.ts (18 functions)

These were deleted in the Dec 2025 cleanup.

### Entity Forge UI (3)
| Endpoint | Old Function | Reason |
|----------|--------------|--------|
| `POST /infinite/worlds/{id}/generate` | `generateEntity()` | 🗑️ Violates "fancy terminal" architecture |
| `GET /infinite/worlds/{id}/entities` | `getWorldEntities()` | 🗑️ Violates "fancy terminal" architecture |
| `GET /infinite/entities/{id}` | `getEntity()` | 🗑️ Violates "fancy terminal" architecture |

### Legacy Curated World (3)
| Endpoint | Old Function | Reason |
|----------|--------------|--------|
| `GET /worlds/genres` | `getGenres()` | 🗑️ Legacy curated system |
| `GET /worlds` | `getWorlds()` | 🗑️ Legacy curated system |
| `GET /worlds/{id}/campfire` | `getCampfire()` | 🗑️ Legacy curated system |

### Deprecated (2)
| Endpoint | Old Function | Reason |
|----------|--------------|--------|
| `GET /infinite/worlds` | `getInfiniteWorlds()` | 🗑️ Use `/grouped` instead |
| `POST /infinite/worlds/{id}/campfire/claim/{char_id}` | `claimCharacter()` | 🗑️ Use `startInfiniteSession()` |

### Legacy Character (3)
| Endpoint | Old Function | Reason |
|----------|--------------|--------|
| `POST /characters` | `createCharacter()` | 🗑️ Use campfire/create |
| `GET /characters` | `listCharacters()` | 🗑️ Legacy system |
| `GET /characters/{id}` | `getCharacter()` | 🗑️ Legacy system |

### Consequence System (7)
| Endpoint | Old Function | Reason |
|----------|--------------|--------|
| `GET /worlds/{id}/bounties` | `getWorldBounties()` | 🗑️ Backend handles via doAction |
| `GET /worlds/{id}/bounties/player/{id}` | `getPlayerBounties()` | 🗑️ Backend handles via doAction |
| `POST /bounties/{id}/claim` | `claimBounty()` | 🗑️ Backend handles via doAction |
| `POST /bounties/{id}/pay-off` | `payOffBounty()` | 🗑️ Backend handles via doAction |
| `GET /worlds/{id}/infractions/player/{id}` | `getPlayerInfractions()` | 🗑️ Backend handles via doAction |
| `GET /worlds/{id}/deaths/recent` | `getRecentDeaths()` | 🗑️ Backend handles via doAction |
| `POST /worlds/{id}/process-respawns` | `processRespawns()` | 🗑️ Admin/debug only |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| 🚀 Core Frontend | 27 |
| ✅ Nice-to-Have UI | 14 |
| 🗑️ Removed | 18 |
| **Total in api.ts** | **41** |

### Before/After
| Metric | Before | After |
|--------|--------|-------|
| Functions in api.ts | 60 | 42 |
| Types imported | 27 | 10 |
| Lines of code | ~755 | ~620 |

---

## Notes

- Service file: `lib/api.ts`
- All endpoints require cookie-based session auth
- Demo mode falls back to canned responses when API unavailable
- NSFW state bundled in `session.content_settings` - no separate fetch needed
- Backend pre-filters worlds based on content_settings - no client-side filtering
