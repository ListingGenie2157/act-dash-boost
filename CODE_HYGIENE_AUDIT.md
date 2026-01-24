# Code Hygiene & Integrity Audit Report

**Date:** January 24, 2026  
**Auditor:** Senior QA Automation Engineer  
**Project:** Preppit ACT Prep Application

---

## Executive Summary

This audit scanned the codebase for dead weight, logical disconnects, and potential production issues. The codebase is generally well-structured with TypeScript strict mode compliance. Build passes successfully and most patterns follow React best practices.

**Critical Issues Found:** 1  
**Medium Issues Found:** 5  
**Low Issues Found:** 6

---

## 1. Database & Schema Mismatches

### Issue 1.1: Loose Type Definition for `marked_text`

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Med | `src/components/EnglishPassageLayout.tsx:26` | Replace `Record<string, any>` with a proper typed interface |

**Details:**  
The `Passage` interface uses `Record<string, any>` for `marked_text` which violates TypeScript strict mode rules and can lead to runtime errors if unexpected data shapes are received.

```typescript
// Current (line 26)
marked_text?: Record<string, any> | null;

// Should be
interface MarkedTextEntry {
  start: number;
  end: number;
  type: 'underline' | 'highlight' | 'reference';
}
marked_text?: MarkedTextEntry[] | null;
```

### Issue 1.2: Optional Fields Treated as Required

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Low | Various components | Add optional chaining and nullish coalescing |

**Analysis:** The schema defines many nullable fields (e.g., `profiles.first_name`, `study_tasks.accuracy`) that are correctly handled in most places with optional chaining (`?.`). No critical mismatches found between schema and UI usage.

---

## 2. Dead Code & Imports

### Issue 2.1: Unused npm Package

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Low | `package.json:54` | Remove `@testsprite/testsprite-mcp` from dependencies |

**Details:**  
The package `@testsprite/testsprite-mcp` is listed in dependencies but never imported anywhere in the codebase.

```bash
npm uninstall @testsprite/testsprite-mcp
```

### Issue 2.2: Unused Component - AdminCronButton

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Low | `src/components/AdminCronButton.tsx` | Delete file or integrate into admin panel |

**Details:**  
`AdminCronButton.tsx` (73 lines) is a fully functional component for manually triggering the daily cron job, but it's never imported or rendered anywhere in the application.

**Recommendation:** Either:
1. Delete the file before launch, OR
2. Add it to an admin page like `AdminImport.tsx`

### Issue 2.3: Duplicate useEffect in DiagnosticResultsComplete

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Med | `src/pages/DiagnosticResultsComplete.tsx:32-34 & 159-161` | Remove the first useEffect (lines 32-34) |

**Details:**  
There are two useEffects calling the same function:

```typescript
// Line 32-34 (REMOVE THIS ONE - missing dependency)
useEffect(() => {
  fetchAllResults();
}, []);

// Line 159-161 (KEEP THIS ONE - correct implementation)
useEffect(() => {
  fetchAllResults();
}, [fetchAllResults]);
```

The first one triggers an ESLint warning for missing dependencies. The second one is the correct implementation with `useCallback` + proper deps.

---

## 3. Logic & State Bugs

### Issue 3.1: Missing useEffect Dependencies (Multiple Files)

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Med | Multiple files | Wrap fetch functions in useCallback or add to deps |

**Affected Files:**

| File | Line | Function |
|------|------|----------|
| `src/components/ParentBanner.tsx` | 10-12 | `fetchPotentialEarnings` |
| `src/components/StudyPlanWidget.tsx` | 62-64 | `loadTodaysTasks` |
| `src/pages/LessonsLibrary.tsx` | 81-83 | `fetchLessons` |

**Pattern to fix:**

```typescript
// Before
useEffect(() => {
  fetchData();
}, []);

// After (Option A - wrap in useCallback)
const fetchData = useCallback(async () => {
  // ... fetch logic
}, [dependencies]);

useEffect(() => {
  fetchData();
}, [fetchData]);

// After (Option B - inline the function)
useEffect(() => {
  const fetchData = async () => {
    // ... fetch logic
  };
  fetchData();
}, [dependencies]);
```

**Note:** These are not currently causing bugs because the fetch functions don't use external dependencies, but they violate React best practices and will cause issues if the functions are modified later.

### Issue 3.2: Potential Race Condition - No Request Cancellation

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Low | `src/pages/DiagnosticResultsComplete.tsx` | Add AbortController for cleanup |

**Details:**  
The `fetchAllResults` function makes multiple sequential Supabase calls that could complete after component unmount. While there's a `mounted` check, using AbortController would be more robust.

---

## 4. Syntax & Wiring Issues

### Issue 4.1: Unnecessary Escape Characters in Regex

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| High | `src/lib/lessons.ts:287` | Remove unnecessary backslashes |

**Details:**  
ESLint error for unnecessary escape characters:

```typescript
// Line 287 - Current (causes ESLint error)
const re = /(?:^|\s)(\d+)[\.\-–]\s*(.+?)(?=\s+\d+[\.\-–]\s+|$)/g;

// Fixed version
const re = /(?:^|\s)(\d+)[.\-–]\s*(.+?)(?=\s+\d+[.\-–]\s+|$)/g;
```

Inside a character class `[]`, the dot `.` does not need to be escaped.

### Issue 4.2: Any Type Usage

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Med | `supabase/functions/generate-study-plan/index.ts:741` | Replace with proper type |

**Details:**  
```typescript
// Line 741 - Current
const skillIds = weakSkillResults.map((r: any) => r.skill_id);

// Should be typed properly based on the query result
interface WeakSkillResult {
  skill_id: string;
  // ... other fields
}
const skillIds = weakSkillResults.map((r: WeakSkillResult) => r.skill_id);
```

---

## 5. Build Warnings (Non-Critical)

### Issue 5.1: Large Bundle Size

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Low | Build output | Consider code splitting |

**Details:**  
Main bundle (`index-D3s5i1ec.js`) is 870KB (244KB gzipped). Consider:
- Moving Recharts to dynamic import (only needed on Analytics page)
- Code-splitting more heavy components

### Issue 5.2: Console Statements in Production Code

| **Severity** | **Location** | **The Fix** |
|--------------|--------------|-------------|
| Low | Multiple Supabase functions | Replace with proper logging |

**Count:** 33 `console.log` statements in Supabase edge functions that should use the logger utility or be removed.

---

## Summary Action Items

### Before Launch (Priority)

1. **Fix ESLint error** in `src/lib/lessons.ts:287` - Remove unnecessary escape characters
2. **Remove duplicate useEffect** in `src/pages/DiagnosticResultsComplete.tsx:32-34`
3. **Fix any type** in `src/components/EnglishPassageLayout.tsx:26`

### Recommended Cleanup

4. Remove unused package `@testsprite/testsprite-mcp` from package.json
5. Delete or integrate `src/components/AdminCronButton.tsx`
6. Add proper useCallback wrappers for fetch functions in components with missing deps

### Nice to Have

7. Add AbortController for request cancellation in async effects
8. Address console.log warnings in Supabase functions
9. Consider code-splitting to reduce main bundle size

---

## Verification Commands

```bash
# Run linter to verify fixes
npm run lint

# Type check
npm run typecheck

# Build to verify no regressions
npm run build
```

---

*Report generated by automated code hygiene scan. Manual review recommended for complex logic changes.*
