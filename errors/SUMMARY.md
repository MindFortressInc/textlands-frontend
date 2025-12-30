# Error Summary

> Auto-generated from `errors/errors.yaml` on 2025-12-30
> **Total:** 17 errors | **Fixed:** 14 | **Open:** 3

## Quick Reference

| ID | Error | Severity | Status |
|----|-------|----------|--------|
| TLF-001 | Swallowed Promise Rejections | HIGH | **FIXED** |
| TLF-002 | Missing ErrorBoundary | HIGH | **FIXED** |
| TLF-003 | Unguarded localStorage Access | HIGH | **FIXED** |
| TLF-004 | Empty Catch Blocks Without Context | MEDIUM | **FIXED** |
| TLF-005 | API Errors Not Shown to User | MEDIUM | **FIXED** |
| TLF-006 | No Network Error Handling | MEDIUM | OPEN |
| TLF-007 | Race Condition in Character Selection | MEDIUM | **FIXED** |
| TLF-008 | Console.log in Production | LOW | OPEN |
| TLF-009 | any Type Usage | LOW | OPEN |
| TLF-010 | API Type/Schema Drift | HIGH | OPEN |
| TLF-011 | Modal Z-Index Layering | MEDIUM | **FIXED** |
| TLF-012 | Safari Safe Area Handling | MEDIUM | **FIXED** |
| TLF-013 | CORS Credential Mode | HIGH | **FIXED** |
| TLF-014 | Missing character.stats Crashes UI | HIGH | **FIXED** |
| TLF-015 | Props Drilling Through Component Tree | MEDIUM | **FIXED** |
| TLF-016 | Monolithic page.tsx | MEDIUM | **FIXED** |
| TLF-017 | Hardcoded Strings Bypass Localization | MEDIUM | **FIXED** |

## By Severity

### CRITICAL (0)
None

### HIGH (6)
- TLF-001: Swallowed Promise Rejections - **FIXED**
- TLF-002: Missing ErrorBoundary - **FIXED**
- TLF-003: Unguarded localStorage Access - **FIXED**
- TLF-010: API Type/Schema Drift - OPEN
- TLF-013: CORS Credential Mode - **FIXED**
- TLF-014: Missing character.stats Crashes UI - **FIXED**

### MEDIUM (8)
- TLF-004: Empty Catch Blocks - **FIXED**
- TLF-005: API Errors Not Shown - **FIXED**
- TLF-006: No Network Error Handling - OPEN
- TLF-007: Race Condition - **FIXED**
- TLF-011: Modal Z-Index - **FIXED**
- TLF-012: Safari Safe Area - **FIXED**
- TLF-015: Props Drilling - **FIXED**
- TLF-016: Monolithic page.tsx - **FIXED**
- TLF-017: Hardcoded Strings - **FIXED**

### LOW (3)
- TLF-008: Console.log in Production - OPEN
- TLF-009: any Type Usage - OPEN

## Usage

```bash
npx tsx scripts/error-scanner.ts          # Full scan
npx tsx scripts/error-scanner.ts --quick  # Critical/High only
npx tsx scripts/error-scanner.ts --list   # List all errors
npx tsx scripts/error-scanner.ts --err TLF-001  # Check specific
```

## Source

Error definitions: `errors/errors.yaml`
