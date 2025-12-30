# Frontend Cleanup Plan

**Created:** 2024-12-29
**Status:** In Progress

## Progress

### Completed (Phase 1: String Migration)
- [x] Audit hardcoded strings in page.tsx
- [x] Migrate page.tsx strings to t() (LoadingView, ErrorView, LandingView, CharacterSelectView, etc.)
- [x] Audit component strings
- [x] Migrate SettingsPanel strings
- [x] Migrate AuthModal strings
- [x] Migrate CombatPanel strings
- [x] Migrate ChatPanel strings
- [x] Migrate LeaderboardModal strings
- [x] Migrate EntityTimelineModal strings
- [x] Migrate WorldTemplatesModal strings
- [x] Migrate ActiveScene strings
- [x] Migrate CharacterCreationModal strings
- [x] Migrate BillingPanel strings
- [x] Migrate AccountRequiredModal strings
- [x] Migrate WorldCreationModal strings
- [x] Migrate PlayerStatsModal strings

**UIStringsContext now has 100+ keys covering all game-facing text.**

### Completed (Phase 2: Context Refactor)
- [x] Create GameContext (character, entries, zoneName, processing, suggestions, footprints)
- [x] Create SessionContext (phase, landGroups, selectedWorld, playerId, isGuest, roster, influence)
- [x] Create SettingsContext (NSFW settings, age gate, showReasoning)
- [x] Create CombatContext (activeCombat, combatNarrative, activeScene, negotiating)
- [x] Wire contexts into layout.tsx provider hierarchy
- [x] Refactor page.tsx to use context hooks instead of 40+ useState calls
- [x] Remove duplicate localStorage effects (moved to SettingsContext)
- [x] Remove duplicate functions (addLog, requestAgeVerification)

### Completed (Phase 3: View Extraction)
- [x] Extract LoadingView to components/views/
- [x] Extract ErrorView to components/views/
- [x] Extract LandingView to components/views/
- [x] Extract CharacterSelectView to components/views/
- [x] Extract WorldBrowser to components/views/
- [x] Extract InfiniteCampfireView to components/views/
- [x] Create components/views/index.ts barrel file
- [x] Remove unused imports (useRef, UI, calcDropdownPosition, DropdownDirection)

**page.tsx: 2,166 → 1,547 lines (-619 lines, 29% reduction)**

### Pending (Phase 4: Future Work)
- [ ] Split page.tsx into actual routes (landing, select, play)
- [ ] Split api.ts into domain modules (1,501 lines)

---

## Problems

### 1. ~~`app/page.tsx` was 2,166 lines~~ NOW 1,547 lines (29% reduction)
- ~~Single file handles 7 phases~~ View components extracted to components/views/
- ~~Impossible to maintain or test in isolation~~ Views now testable separately
- ~~Props drilling through nested components~~ FIXED via contexts

### 2. ~~Hardcoded strings bypass UIStrings system~~ FIXED
- ~~Backend is source of truth for game text~~
- ~~Divergent frontend strings cause inconsistent UX~~
- ~~`UIStringsContext` exists but isn't used consistently~~
- All user-facing strings now use `t()` with fallbacks

### 3. `lib/api.ts` is 1,501 lines (LOW PRIORITY)
- All API calls in one file
- No domain separation
- Hard to find specific endpoints

---

## Solution

### Phase 1: Extract State into Contexts (Foundation)

Create dedicated contexts to eliminate props drilling and enable component splitting:

```
contexts/
├── AuthContext.tsx        # EXISTS - auth state
├── UIStringsContext.tsx   # EXISTS - translations
├── GameContext.tsx        # NEW - character, entries, zone, processing
├── SessionContext.tsx     # NEW - phase, world, campfire, roster
├── SettingsContext.tsx    # NEW - nsfw, preferences, modals
└── CombatContext.tsx      # NEW - combat, scene, negotiation
```

**GameContext** will hold:
- character, entries, zoneName, processing, suggestions
- addLog(), doAction() handlers

**SessionContext** will hold:
- phase, landGroups, selectedWorld, infiniteCampfire
- playerId, isGuest, roster
- phase transition functions

**SettingsContext** will hold:
- nsfwEnabled, nsfwVerified, showReasoning
- settingsOpen, billingOpen, leaderboardOpen
- all modal open/close states

**CombatContext** will hold:
- activeCombat, combatNarrative
- activeScene, negotiating

### Phase 2: Split page.tsx by Phase

After contexts exist, split into route-based pages:

```
app/
├── page.tsx                    # Landing only (slim)
├── select/page.tsx             # Character select (roster picker)
├── lands/page.tsx              # Land browser
├── campfire/[worldId]/page.tsx # Campfire view
└── play/page.tsx               # Game loop
```

Each page imports shared contexts from a provider wrapper.

### Phase 3: Migrate Hardcoded Strings

Audit all user-facing strings and migrate to `t()`:

**Priority strings (game-breaking if wrong):**
- Action prompts ("What do you do?")
- Error messages
- State descriptions
- Button labels

**Lower priority:**
- Decorative text
- Section headers

Add missing keys to `DEFAULT_STRINGS` in UIStringsContext as fallbacks.

### Phase 4: Split api.ts by Domain

```
lib/api/
├── index.ts      # Re-exports all
├── session.ts    # getSession, startSession, endSession
├── gameplay.ts   # doAction, explainAction
├── worlds.ts     # getInfiniteWorldsGrouped, getCampfire
├── social.ts     # friends, chat, DMs
├── billing.ts    # subscription, playtime, unlocks
└── combat.ts     # getCombatState, getActiveCombat
```

---

## Execution Order

| Step | Task | Depends On | Risk |
|------|------|------------|------|
| 1 | Create GameContext | - | Low |
| 2 | Create SessionContext | - | Low |
| 3 | Create SettingsContext | - | Low |
| 4 | Create CombatContext | - | Low |
| 5 | Wire contexts into page.tsx | 1-4 | Medium |
| 6 | Audit hardcoded strings | - | Low |
| 7 | Migrate strings to t() | 6 | Low |
| 8 | Split page.tsx into routes | 5 | High |
| 9 | Split api.ts into modules | - | Low |

**Recommended approach:** Do 1-5, then 6-7, then 8-9. Contexts enable everything else.

---

## String Migration Checklist

Strings to add to backend `ui_strings` endpoint:

- [ ] `select_character` - "Select a character..."
- [ ] `choose_character` - "Choose your character"
- [ ] `no_characters` - "No characters available."
- [ ] `adventure_begins` - "Your adventure begins..."
- [ ] `what_do_you_do` - "What do you do?" (may exist)
- [ ] `connection_error` - "CONNECTION ERROR"
- [ ] `connecting` - "Connecting..."
- [ ] `try_again` - "Try Again"
- [ ] `describe_character` - "Describe a character concept"
- [ ] `your_progress_saved` - "Your progress has been saved to your account."
- [ ] `return_to_world` - "You return to {world_name}..."

---

## Files to Create

```
contexts/GameContext.tsx
contexts/SessionContext.tsx
contexts/SettingsContext.tsx
contexts/CombatContext.tsx
lib/api/index.ts
lib/api/session.ts
lib/api/gameplay.ts
lib/api/worlds.ts
lib/api/social.ts
lib/api/billing.ts
lib/api/combat.ts
```

---

## Success Criteria

1. `page.tsx` under 500 lines
2. No useState calls in page components (all in contexts)
3. All user-facing strings use `t()` with fallbacks
4. Each api module under 300 lines
5. No props drilling deeper than 2 levels
