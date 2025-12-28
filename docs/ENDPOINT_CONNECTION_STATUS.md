# TextLands API Endpoint Connection Status

**Last Updated:** 2025-12-27
**Purpose:** Track integration status of all backend API endpoints with frontend

## Legend
- ✅ **Connected** - Endpoint is integrated in `lib/api.ts`
- 🚀 **Actively Used in UI** - Endpoint is connected AND used in user-facing components
- ⚠️ **Partial** - Endpoint exists but not fully utilized
- ❌ **Not Connected** - Endpoint not yet integrated
- 🔍 **Needs Review** - Connection status unclear

---

## Health & Session Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/health` | ✅ | `checkHealth()` | Used in init to detect demo mode |
| GET | `/session/current` | 🚀 | `getSession()` | Loads player ID on init |
| POST | `/session/start` | ✅ | `startSession()` | Legacy curated worlds session |
| POST | `/session/claim` | ✅ | `claimGuestSession()` | Claim guest session to account |
| DELETE | `/session/guest` | ✅ | `endGuestSession()` | End guest session |
| GET | `/session/preferences` | 🚀 | `getPreferences()` | Show reasoning toggle |
| POST | `/session/preferences` | ✅ | `updatePreferences()` | Update reasoning prefs |

---

## Infinite Worlds Endpoints

### World Browsing
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/infinite/worlds` | ✅ | `getInfiniteWorlds()` | Flat world list (deprecated) |
| GET | `/infinite/worlds/grouped` | 🚀 | `getInfiniteWorldsGrouped()` | Worlds grouped by realm - used in WorldBrowser |
| GET | `/infinite/worlds/{world_id}` | ✅ | `getInfiniteWorld()` | Single world details |
| POST | `/infinite/worlds` | ❌ | - | Create new world |

### Templates
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/infinite/templates` | ✅ | `getWorldTemplates()` | List world templates |
| GET | `/infinite/templates/{slug}` | ✅ | `getWorldTemplate()` | Template details |

### Campfire (Character Selection)
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/infinite/worlds/{world_id}/campfire` | 🚀 | `getInfiniteCampfire()` | Character selection - used in InfiniteCampfireView |
| POST | `/infinite/worlds/{world_id}/campfire/create` | ✅ | `createCampfireCharacter()` | Create custom character |
| POST | `/infinite/worlds/{world_id}/campfire/claim/{character_id}` | ✅ | `claimCharacter()` | Legacy - replaced by startInfiniteSession |

### Session
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| POST | `/infinite/session/start` | 🚀 | `startInfiniteSession()` | Start game with entity - used in selectInfiniteCharacter |

### Entities
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| POST | `/infinite/worlds/{world_id}/generate` | ✅ | `generateEntity()` | Generate world entity |
| GET | `/infinite/worlds/{world_id}/entities` | ✅ | `getWorldEntities()` | List world entities |
| GET | `/infinite/entities/{entity_id}` | ✅ | `getEntity()` | Entity details |
| GET | `/infinite/entities/{entity_id}/timeline` | ✅ | `getEntityTimeline()` | Entity history |
| POST | `/infinite/entities/{entity_id}/timeline` | ✅ | `addEntityTimelineEvent()` | Add timeline event |
| PATCH | `/infinite/entities/{entity_id}/state` | ✅ | `updateEntityState()` | Update entity state |

### Location Interaction
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/infinite/entities/{entity_id}/footprints` | ✅ | `getLocationFootprints()` | Who visited location |
| POST | `/infinite/entities/{entity_id}/messages` | ✅ | `leaveLocationMessage()` | Leave message at location |
| POST | `/infinite/entities/{entity_id}/visit` | ✅ | `recordLocationVisit()` | Record location visit |

### Leaderboards & Stats
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/infinite/worlds/{world_id}/leaderboard` | ✅ | `getWorldLeaderboard()` | World trailblazer rankings |
| GET | `/infinite/leaderboard/global` | ✅ | `getGlobalLeaderboard()` | Global rankings |
| GET | `/infinite/worlds/{world_id}/player/{player_id}/stats` | ✅ | `getPlayerWorldStats()` | Player stats in world |
| GET | `/infinite/worlds/{world_id}/player/{player_id}/influence` | ✅ | `getPlayerInfluence()` | Player influence/tier |
| GET | `/infinite/worlds/{world_id}/influence-leaderboard` | ❌ | - | Influence-specific leaderboard |

### Player Preferences (NSFW)
| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/infinite/player/{player_id}/preferences` | 🚀 | `getPlayerPreferences()` | Server-side NSFW prefs - loaded on init |
| POST | `/infinite/player/{player_id}/preferences` | 🚀 | `updatePlayerPreferences()` | Update NSFW prefs - synced on toggle |
| POST | `/infinite/player/{player_id}/nsfw-prompt` | 🚀 | `handleNsfwPrompt()` | Handle age verification - synced on accept/reject |

---

## Legacy World Selection Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/worlds` | ✅ | `getWorlds()` | Legacy - worlds by genre |
| GET | `/worlds/genres` | ✅ | `getGenres()` | Legacy - genre list |
| GET | `/worlds/{world_id}/campfire` | ✅ | `getCampfire()` | Legacy curated campfire |

---

## Gameplay Action Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| POST | `/actions/do` | 🚀 | `doAction()` | Natural language actions - main gameplay |
| POST | `/actions/look` | ✅ | `look()` | Look around |
| POST | `/actions/move` | ✅ | `move()` | Move to location |
| POST | `/actions/talk/{npc_id}` | ✅ | `talk()` | Talk to NPC |
| POST | `/actions/action` | ✅ | `performAction()` | Perform action |
| POST | `/actions/rest` | ✅ | `restAction()` | Rest and recover |
| POST | `/actions/inventory` | ✅ | `inventoryAction()` | Check inventory |
| GET | `/actions/{action_id}/explain` | ✅ | `explainAction()` | Explain action outcome |

---

## Combat Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| POST | `/combat/start` | ✅ | `startCombat()` | Start combat |
| GET | `/combat/{session_id}` | 🚀 | `getCombatState()` | Get combat state - used in CombatPanel |
| POST | `/combat/{session_id}/action` | 🚀 | `combatAction()` | Combat action - used in CombatPanel |
| GET | `/combat/active/{character_id}` | ✅ | `getActiveCombat()` | Check for active combat |

---

## Intimacy/Scene Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/intimacy/relationship/{npc_id}` | ✅ | `getRelationshipStatus()` | NPC relationship |
| GET | `/intimacy/preferences` | ✅ | `getIntimacyPreferences()` | Player intimacy prefs |
| POST | `/intimacy/scene/start` | ✅ | `startScene()` | Start intimate scene |
| POST | `/intimacy/scene/negotiate` | 🚀 | `negotiateScene()` | Scene negotiation - SceneNegotiation component |
| POST | `/intimacy/scene/action` | 🚀 | `sceneAction()` | Scene action - ActiveScene component |
| POST | `/intimacy/scene/safeword` | 🚀 | `invokeSafeword()` | Invoke safeword |
| POST | `/intimacy/scene/complete` | 🚀 | `completeScene()` | Complete scene |
| GET | `/intimacy/active` | ✅ | `getActiveScene()` | Check for active scene |

---

## Character Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/characters` | ✅ | `listCharacters()` | List characters |
| POST | `/characters` | ✅ | `createCharacter()` | Create character |
| GET | `/characters/{character_id}` | ✅ | `getCharacter()` | Get character |

---

## Billing Endpoints

| Method | Endpoint | Status | API Function | Notes |
|--------|----------|--------|--------------|-------|
| GET | `/billing/subscription` | 🚀 | `getSubscription()` | Subscription status - BillingPanel |
| POST | `/billing/subscription/create` | 🚀 | `createSubscription()` | Start checkout |
| POST | `/billing/subscription/cancel` | 🚀 | `cancelSubscription()` | Cancel subscription |
| GET | `/billing/tokens` | 🚀 | `getTokenBalance()` | Token balance |
| POST | `/billing/tokens/purchase` | 🚀 | `purchaseTokens()` | Buy tokens |
| GET | `/billing/playtime` | 🚀 | `getPlaytime()` | Playtime remaining |
| GET | `/billing/free-uses` | 🚀 | `getFreeUses()` | Free uses remaining |
| GET | `/billing/usage` | 🚀 | `getUsage()` | Monthly usage |
| POST | `/billing/unlock/nsfw` | ✅ | `unlockNsfw()` | Unlock NSFW |
| POST | `/billing/unlock/death-recovery` | ✅ | `unlockDeathRecovery()` | Unlock death recovery |
| POST | `/billing/unlock/fate-reroll` | ✅ | `unlockFateReroll()` | Unlock fate reroll |
| POST | `/billing/unlock/playtime` | ✅ | `unlockPlaytime()` | Unlock extra playtime |

---

## Summary Statistics

### By Status
| Status | Count | Percentage |
|--------|-------|------------|
| 🚀 Actively Used in UI | 24 | 31% |
| ✅ Connected | 48 | 62% |
| ❌ Not Connected | 2 | 3% |
| ⚠️ Partial | 0 | 0% |

### By Category
| Category | Endpoints | Actively Used |
|----------|-----------|---------------|
| Health & Session | 7 | 3 |
| Infinite Worlds | 26 | 6 |
| Legacy Worlds | 3 | 0 |
| Gameplay Actions | 8 | 1 |
| Combat | 4 | 2 |
| Intimacy/Scenes | 8 | 4 |
| Characters | 3 | 0 |
| Billing | 12 | 8 |

**Total Endpoints:** 74 documented
**Connected:** 72 (97%)
**Actively Used:** 24 (32%)

---

## Not Connected - Priority

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| ~~POST `/infinite/worlds`~~ | Create new world | ✅ `createWorld()` + WorldCreationModal |
| ~~GET `.../influence-leaderboard`~~ | Influence rankings | ✅ `getInfluenceLeaderboard()` |

**All endpoints now connected!**

---

## UI Gaps - Have API but No UI

These endpoints are connected but have no user-facing UI:

1. ~~**Leaderboards**~~ - `getWorldLeaderboard()`, `getGlobalLeaderboard()`, `getPlayerWorldStats()` ✅ LeaderboardModal exists
2. ~~**Location Interaction**~~ - `getLocationFootprints()`, `leaveLocationMessage()`, `recordLocationVisit()` ✅ CharacterPanel footprints section
3. ~~**Entity Timeline**~~ - `getEntityTimeline()`, `addEntityTimelineEvent()` ✅ EntityTimelineModal + QuickActions trigger
4. ~~**Custom Character**~~ - `createCampfireCharacter()` ✅ CharacterCreationModal exists
5. ~~**Entity Generation**~~ - `generateEntity()`, `getWorldEntities()` ✅ EntityGenerationModal with Forge button
6. ~~**World Templates**~~ - `getWorldTemplates()`, `getWorldTemplate()` ✅ WorldTemplatesModal + WorldBrowser button
7. ~~**Player Influence**~~ - `getPlayerInfluence()` ✅ CharacterPanel influence + PlayerStatsModal

---

## Notes

- Service file: `lib/api.ts`
- All endpoints require cookie-based session auth
- Demo mode falls back to canned responses when API unavailable
- NSFW preferences sync to server but cache locally for offline fallback
