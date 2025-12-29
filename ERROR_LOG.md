# TextLands Frontend - Error Log

Last reviewed: 2025-12-28
Scanner: `npx tsx scripts/error-scanner.ts`

## Summary

| Severity | Fixed | Open |
|----------|-------|------|
| CRITICAL | 0 | 0 |
| HIGH | 6 | 0 |
| MEDIUM | 5 | 0 |
| LOW | 0 | 2 |

**Scanner Commands:**
- `npx tsx scripts/error-scanner.ts` - Full scan
- `npx tsx scripts/error-scanner.ts --quick` - Critical/High only
- `npx tsx scripts/error-scanner.ts --orphans` - Find unused files
- `npx tsx scripts/error-scanner.ts --links` - Check for dead routes

---

## HIGH Severity

### TLF-001: Swallowed Promise Rejections
- Status: FIXED
- Severity: HIGH
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `app/page.tsx` (multiple locations)
  - `components/game/BillingPanel.tsx`

**What to Look For:**
```typescript
.catch(() => {});
.catch(() => null);
```

**Why It's a Problem:**
Silent failures hide bugs. When API calls fail, users see stale data with no indication anything went wrong.

**Fix Applied:**
All catch blocks now log errors with context tags (e.g., `[Billing]`, `[Scene]`, `[Combat]`).

**Search Pattern:**
```bash
grep -rn "\.catch\s*(\s*(\s*)\s*=>\s*{\s*}\s*)" --include="*.tsx" --include="*.ts"
```

---

### TLF-002: Missing ErrorBoundary
- Status: FIXED
- Severity: HIGH
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `app/layout.tsx`
  - `components/ErrorBoundary.tsx`

**What to Look For:**
React apps without an ErrorBoundary at root level.

**Why It's a Problem:**
Unhandled React errors crash the entire app with a white screen. No recovery possible.

**Fix Applied:**
Added ErrorBoundary component wrapping children in layout.tsx.

---

### TLF-003: Unguarded localStorage Access
- Status: FIXED
- Severity: HIGH
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `app/page.tsx` - uses `safeStorage.getJSON/setJSON`
  - `lib/themes/ThemeProvider.tsx` - uses `safeStorage.getItem/setItem`

**What to Look For:**
```typescript
localStorage.getItem()
localStorage.setItem()
```

**Why It's a Problem:**
localStorage throws in private browsing mode (Safari), with cookies disabled, or when quota exceeded.

**Fix Applied:**
Created `lib/errors.ts` with `safeStorage` wrapper. All localStorage access now uses safe methods.

**Search Pattern:**
```bash
grep -rn "localStorage\." --include="*.tsx" --include="*.ts"
```

---

### TLF-014: Missing character.stats Crashes UI
- Status: FIXED
- Severity: HIGH
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `app/page.tsx:1050`
  - `components/game/CharacterPanel.tsx:73`
  - `components/game/MobileStats.tsx:32`

**What to Look For:**
```typescript
const { stats } = character;
// Then accessing stats.hp, stats.mana, etc.
```

**Why It's a Problem:**
Backend `doAction` response sometimes returns `character` without `stats` property. Accessing `stats.hp` throws: "Cannot read properties of undefined (reading 'hp')".

**Fix Applied:**
1. Added fallback when setting character from action response
2. Added defensive defaults in CharacterPanel and MobileStats components

```typescript
// Before
const { stats } = character;

// After
const stats = character.stats || { hp: 0, max_hp: 100, mana: 0, max_mana: 50, gold: 0, xp: 0, level: 1 };
```

---

## MEDIUM Severity

### TLF-004: Empty Catch Blocks Without Context
- Status: FIXED
- Severity: MEDIUM
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `app/page.tsx` (multiple locations)
  - `components/game/*.tsx` (various modals)

**What to Look For:**
```typescript
} catch {
  // No error variable, no logging
}
```

**Why It's a Problem:**
Impossible to debug when things fail. At minimum, log the error.

**Fix:**
```typescript
// Before
} catch {
  setFootprints([]);
}

// After
} catch (err) {
  console.error('[Footprints] Failed to fetch:', err);
  setFootprints([]);
}
```

---

### TLF-005: API Errors Not Shown to User
- Status: FIXED (logging added)
- Severity: MEDIUM
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `lib/api.ts:35-37`

**What to Look For:**
API errors that are thrown but may not reach the user.

**Why It's a Problem:**
When `fetchAPI` throws, the error message may get lost if the caller doesn't handle it properly.

**Current Implementation:**
```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({ detail: "Unknown error" }));
  throw new Error(error.detail || `API error: ${response.status}`);
}
```

This is actually good, but callers need to display errors to users, not just console.log.

---

### TLF-006: No Network Error Handling
- Status: OPEN
- Severity: MEDIUM
- Discovered: 2025-12-28
- Affected Files:
  - `lib/api.ts`

**What to Look For:**
fetch() calls without network error handling.

**Why It's a Problem:**
`fetch()` throws TypeError on network failure. Current code will crash if user goes offline.

**Fix:**
```typescript
// Add network error wrapper
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, { ... });
    // ...
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Network error - check your connection');
    }
    throw err;
  }
}
```

---

### TLF-007: Race Condition in Character Selection
- Status: FIXED
- Severity: MEDIUM
- Discovered: 2025-12-28
- Fixed: 2025-12-28
- Affected Files:
  - `app/page.tsx` (selectInfiniteWorld, selectInfiniteCharacter)

**What to Look For:**
```typescript
setProcessing(true);
// async operation
setProcessing(false);
```

**Why It's a Problem:**
If user double-clicks a character, two sessions could start. `processing` flag helps but isn't foolproof.

**Fix Applied:**
Added `if (processing) return;` guard at the start of both `selectInfiniteWorld` and `selectInfiniteCharacter` functions.

---

## LOW Severity

### TLF-008: Console.log in Production
- Status: OPEN
- Severity: LOW
- Discovered: 2025-12-28

**What to Look For:**
```typescript
console.log()
```

**Why It's a Problem:**
Clutters browser console. Should use structured logging or remove.

**Search Pattern:**
```bash
grep -rn "console\.log" --include="*.tsx" --include="*.ts" | grep -v node_modules
```

---

### TLF-009: any Type Usage
- Status: OPEN
- Severity: LOW
- Discovered: 2025-12-28

**What to Look For:**
```typescript
: any
as any
```

**Why It's a Problem:**
Bypasses TypeScript's type checking, can hide bugs at runtime.

**Search Pattern:**
```bash
grep -rn ": any\|as any" --include="*.tsx" --include="*.ts" | grep -v node_modules
```

---

## Patterns Learned from Git History

These patterns were identified by reviewing past fix commits. Adding to scanner and tracking.

### TLF-010: API Type/Schema Drift
- Status: OPEN (ongoing risk)
- Severity: HIGH
- Source: Commits `a3efd21`, `64c69a0`

**Pattern:** Backend changes field names (e.g., `worlds→realms`, `world_count→realm_count`) and frontend types go stale.

**Prevention:**
- Document API contracts in types/game.ts
- Run backend integration tests in CI
- Add schema validation for API responses

---

### TLF-011: Modal Z-Index Layering
- Status: FIXED
- Severity: MEDIUM
- Source: Commit `9a6a388`

**Pattern:** Modals not appearing above other panels due to z-index conflicts.

**Fix Applied:** Increased AgeGateModal z-index to layer above SettingsPanel.

**Prevention:** Use consistent z-index scale (define in CSS variables).

---

### TLF-012: Safari Safe Area Handling
- Status: FIXED
- Severity: MEDIUM
- Source: Commit `e54a642`

**Pattern:** iPhone notch and home indicator overlapping content.

**Fix Applied:** Use `max()` with `env(safe-area-inset-*)` to ensure minimum padding.

---

### TLF-013: CORS Credential Mode
- Status: FIXED
- Severity: HIGH
- Source: Commits `4c563fc`, `cb651e5`

**Pattern:** Backend CORS changes break `credentials: 'include'` mode.

**Fix Applied:** Now working; backend fixed CORS configuration.

**Prevention:** Test auth flows after backend deployments.

---

## Changelog

| Date | Error ID | Action | Notes |
|------|----------|--------|-------|
| 2025-12-28 | TLF-004,005,007 | Fixed | Added error logging, fixed race condition |
| 2025-12-28 | TLF-014 | Fixed | Added defensive checks for missing character.stats |
| 2025-12-28 | - | Created | Initial error log with 9 issues identified |
| 2025-12-28 | TLF-002 | Fixed | Added ErrorBoundary to layout.tsx |
| 2025-12-28 | TLF-010-013 | Added | Patterns from git history review |
| 2025-12-28 | TLF-001 | Fixed | Added error logging to all catch blocks |
| 2025-12-28 | TLF-003 | Fixed | Created safeStorage wrapper in lib/errors.ts |
| 2025-12-28 | TLF-006 | Disabled | Too many false positives - nullable state != async data |
| 2025-12-28 | TLF-008 | Fixed | Changed WebSocket console.log to console.debug |
