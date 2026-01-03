# TextLands API Endpoint Connection Status

**Last Updated:** 2026-01-03
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

## Nice-to-Have UI Endpoints (15 total)

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

### Player Skills
| Method | Endpoint | API Function | UI Component |
|--------|----------|--------------|--------------|
| GET | `/infinite/worlds/{id}/player/{id}/skills` | `getSkills()` | SkillsTab, SkillsPanel |

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

## Unwired Backend GET Endpoints (~50 total)

These exist in backend but have no frontend wiring. Decide: wire up or leave for backend/doAction.

### Combat & Boss (10)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /combat/paused/{character_id}` | Check for paused combat | ⚠️ Maybe - resume flow |
| `GET /group-combat/{combat_id}` | Group combat state | ❓ TBD - multiplayer feature |
| `GET /group-combat/mine` | Player's current group combat | ❓ TBD - multiplayer feature |
| `GET /group-combat/{combat_id}/npcs` | NPCs in group combat | ❓ TBD - multiplayer feature |
| `GET /world-boss/active` | List active world bosses | ❓ TBD - world events UI |
| `GET /world-boss/all` | List all world bosses | ❓ TBD - world events UI |
| `GET /world-boss/{boss_id}` | Boss details | ❓ TBD - world events UI |
| `GET /world-boss/{boss_id}/hiscores` | Boss kill leaderboard | ❓ TBD - leaderboards |
| `GET /world-boss/{boss_id}/kills/recent` | Recent kills of boss | ❓ TBD - world events UI |
| `GET /world-boss/kills/recent` | All recent boss kills | ❓ TBD - world events UI |

### Travel (3)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /travel/status` | Current journey status | ⚠️ Maybe - travel UI |
| `GET /travel/options` | Available destinations | ⚠️ Maybe - travel UI |
| `GET /travel/teleport-cost` | Teleport pricing | ⚠️ Maybe - travel UI |

### Pets (4)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /pets` | List player's pets | ⚠️ Maybe - pet panel |
| `GET /pets/{pet_id}` | Pet details | ⚠️ Maybe - pet panel |
| `GET /pets/{pet_id}/evolution` | Evolution check | ⚠️ Maybe - pet panel |
| `GET /pets/taming/chances/{creature_id}` | Taming success rate | 🔴 Skip - backend via doAction |

### Bank & Storage (8)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /bank/vault` | Vault contents | ⚠️ Maybe - bank UI |
| `GET /bank/expansion/next` | Next expansion info | ⚠️ Maybe - bank UI |
| `GET /bank/wealth` | Total wealth | ⚠️ Maybe - stats panel |
| `GET /bank/check-location` | Banking availability | 🔴 Skip - backend via doAction |
| `GET /stashes` | Hidden stashes | ⚠️ Maybe - stash UI |
| `GET /stashes/{stash_id}` | Stash contents | ⚠️ Maybe - stash UI |
| `GET /stashes/realm/{realm_id}/settings` | Realm stash settings | 🔴 Skip - backend internal |
| `GET /stashes/container-types` | Container options | 🔴 Skip - backend via doAction |

### Relationships & Intimacy (8)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /relationships` | All NPC relationships | ✅ Wired - `getRelationships()` |
| `GET /relationships/{npc_id}` | Relationship with NPC | ✅ Wired - `getRelationship()` |
| `GET /relationships/{npc_id}/history` | Relationship events | ✅ Wired - `getRelationshipHistory()` |
| `GET /relationships/{npc_id}/moments` | Special moments | ✅ Wired - `getRelationshipMoments()` |
| `GET /relationships/by-disposition/{disposition}` | NPCs by disposition | ✅ Wired - `getRelationshipsByDisposition()` |
| `GET /relationships/{npc_id}/ai-context` | AI context | 🔴 Skip - backend internal |
| `GET /intimacy/preferences` | Player intimacy prefs | ✅ Wired - `getIntimacyPreferences()` |
| `GET /intimacy/relationship/{npc_id}` | Intimacy relationship | ✅ Wired - `getIntimacyRelationship()` |

### Party (5)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /party/invites/pending` | Pending party invites | ⚠️ Maybe - party UI |
| `GET /party/{party_id}` | Party details by ID | 🔴 Skip - use /party/mine |
| `GET /party/world/{world_id}` | All parties in world | 🔴 Skip - multiplayer browser |
| `GET /party/npcs/recruit/{entity_id}/preview` | Preview NPC before recruit | ⚠️ Maybe - recruitment flow |

### World Info (9)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /infinite/worlds/{world_id}/map` | ASCII realm map | ✅ Wired - `getRealmMap()` + MapModal |
| `GET /infinite/worlds/{world_id}/entities` | World entities | 🔴 Skip - backend internal |
| `GET /infinite/worlds/{world_id}/calendar` | World calendar | ⚠️ Maybe - world info |
| `GET /infinite/worlds/{world_id}/summary/offline` | Offline catch-up | ⚠️ Maybe - return player flow |
| `GET /infinite/worlds/{world_id}/events/recent` | Recent world events | ⚠️ Maybe - world feed |
| `GET /infinite/worlds/{world_id}/deaths/recent` | Recent deaths | ⚠️ Maybe - world feed |
| `GET /infinite/lands/stats` | Land population stats | ⚠️ Maybe - land browser |
| `GET /infinite/desire-options` | Available desire options | ⚠️ Maybe - settings |
| `GET /infinite/worlds/{world_id}/player/{player_id}/exploration` | Discovery stats | ⚠️ Maybe - stats panel |

### Bounties & Infractions (3)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /infinite/worlds/{world_id}/bounties` | Active bounties | ⚠️ Maybe - bounty board |
| `GET /infinite/worlds/{world_id}/bounties/player/{player_id}` | Player bounties | ⚠️ Maybe - player profile |
| `GET /infinite/worlds/{world_id}/infractions/player/{player_id}` | Player infractions | ⚠️ Maybe - player profile |

### Hiscores (1)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /infinite/hiscores/lands/{land}/tycoons` | Wealth hiscores per land | ⚠️ Maybe - leaderboards |

### Wiki & Content (4)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /wiki/search` | Cross-category search | ✅ Wire up - wiki search |
| `GET /wiki/{land_key}/realms` | List realms | ✅ Wire up - wiki |
| `GET /wiki/{land_key}/realms/{realm_id}` | Realm details | ✅ Wire up - wiki |

### Drafts (3)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /drafts/constants` | Draft creation constants | ⚠️ Maybe - content creation |
| `GET /drafts` | Player's drafts | ⚠️ Maybe - content creation |
| `GET /drafts/{draft_id}` | Draft detail | ⚠️ Maybe - content creation |

### Auth & Account (4)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /auth/preferences` | Auth preferences | 🔴 Skip - use /session/preferences |
| `GET /auth/cli/token` | CLI token | 🔴 Skip - CLI only |
| `GET /auth/cli/authorize` | CLI authorization | 🔴 Skip - CLI only |
| `GET /invites/code/{code}` | Invite code info | ⚠️ Maybe - invite landing |

### Characters (2)
| Endpoint | Purpose | Recommendation |
|----------|---------|----------------|
| `GET /characters` | List all characters | 🔴 Skip - use /characters/roster |
| `GET /characters/{character_id}` | Character details | 🔴 Skip - use /characters/me/profile |

### Recommendation Key
- ✅ **Wire up** - Should add to frontend
- ⚠️ **Maybe** - Depends on feature priority
- ❓ **TBD** - Needs design decision
- 🔴 **Skip** - Leave for backend/doAction or other clients

---

## Summary Statistics

| Category | Count |
|----------|-------|
| 🚀 Core Frontend | 27 |
| ✅ Nice-to-Have UI | 15 |
| 🗑️ Removed | 18 |
| ❓ Unwired (review pending) | ~50 |
| **Total in api.ts** | **42** |

### Unwired Breakdown
| Recommendation | Count |
|----------------|-------|
| ✅ Wired | 8 |
| ⚠️ Maybe | 27 |
| ❓ TBD | 8 |
| 🔴 Skip | 15 |

---

## Notes

- Service file: `lib/api.ts`
- All endpoints require cookie-based session auth
- Demo mode falls back to canned responses when API unavailable
- NSFW state bundled in `session.content_settings` - no separate fetch needed
- Backend pre-filters worlds based on content_settings - no client-side filtering

## Decision Log

| Date | Endpoint(s) | Decision | Reason |
|------|-------------|----------|--------|
| 2026-01-03 | Chat paths | Fixed | Wrong prefix (`/chat/` -> `/realtime/chat/`) |
| 2026-01-03 | Relationships (5) | Wired | NPC relationship panel support |
| 2026-01-03 | Intimacy (2) | Wired | Intimacy prefs + relationship status |
| 2026-01-03 | Relationships UI | Added | RelationshipsSection in Profile tab |
| 2026-01-03 | Realm Map | Wired | `getRealmMap()` + MapModal component |
| 2026-01-03 | Player Skills | Fixed | `getSkills()` - fixed worldId prop source, type mismatch |
