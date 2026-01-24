

# Fix Remaining Audit Findings

## Audit Analysis Summary

| Finding | Severity | Verdict | Rationale |
|---------|----------|---------|-----------|
| Hardcoded Supabase credentials | High | **NOT VALID** | Intentional Lovable architecture pattern (documented in project memories) |
| console.info in env.ts | Med | **VALID** | Should be dev-only |
| test_packages query issues | High | **ALREADY FIXED** | `getLessonBySkill` and `getFullTestPackage` were removed in previous plan |
| DiagnosticResultsComplete duplicate effects | High | **VALID** | Lines 32-34 and 159-161 both call fetchAllResults() |
| DiagnosticResultsComplete unsafe cast | High | **VALID** | Line 102 casts JSON to array without validation |
| DiagnosticResultsComplete N+1 queries | Med | **VALID** | Lines 114-118 query skills inside loop |
| EnglishPassageLayout `any` type | Med | **VALID** | Line 26 uses `Record<string, any>` |
| lessons.ts regex escape | Low | **VALID** | Line 287 has unnecessary escapes |
| generate-study-plan `any` type | Med | **VALID** | Line 741 uses `(task: any)` |
| logger.error in production | Med | **PARTIALLY VALID** | Consider sanitizing, but errors need to be logged |
| AdminQuestionGenerator console.log | Low | **VALID** | Lines 158, 179, 205 have debug logs |
| AdminLessonImport console.log | Low | **ALREADY FIXED** | Already uses dev-only `logger.debug` |
| Unused dependencies | Med | **PARTIALLY VALID** | Some are truly unused, some are type definitions |

---

## Changes to Implement

### 1. Fix DiagnosticResultsComplete.tsx (HIGH PRIORITY)

**Issue 1: Duplicate useEffect calls**
Lines 32-34 call `fetchAllResults()` directly, while lines 159-161 use the proper dependency pattern.

```typescript
// DELETE THIS (lines 32-34):
useEffect(() => {
  fetchAllResults();
}, []);

// KEEP THIS (lines 159-161):
useEffect(() => {
  fetchAllResults();
}, [fetchAllResults]);
```

**Issue 2: Unsafe JSON cast**
Line 102 casts `diag.responses` to `DiagnosticBlock[]` without validation.

```typescript
// BEFORE (line 102):
const responses = (diag.responses || []) as DiagnosticBlock[];

// AFTER:
const rawResponses = diag.responses;
const responses: DiagnosticBlock[] = Array.isArray(rawResponses) 
  ? rawResponses.filter(
      (r): r is DiagnosticBlock => 
        typeof r === 'object' && r !== null && 
        (Array.isArray(r.questions) || Array.isArray(r.answers))
    )
  : [];
```

**Issue 3: N+1 skill queries**
Lines 113-118 query skills individually inside a nested loop.

```typescript
// BEFORE: Individual query inside loop (lines 114-118)
const { data: skillData } = await supabase
  .from('skills')
  .select('name')
  .eq('id', skillId)
  .maybeSingle();

// AFTER: Batch query before loop
// Collect all unique skill IDs first
const allSkillIds = new Set<string>();
for (const diag of diagnostics) {
  const rawResponses = diag.responses;
  const responses: DiagnosticBlock[] = Array.isArray(rawResponses) 
    ? rawResponses.filter(/* validation */) 
    : [];
  for (const block of responses) {
    if (block.questions) {
      for (const q of block.questions) {
        if (q.skill_tags?.[0]) allSkillIds.add(q.skill_tags[0]);
      }
    }
  }
}

// Batch fetch all skills
const { data: skillsData } = await supabase
  .from('skills')
  .select('id, name')
  .in('id', Array.from(allSkillIds));

const skillNameMap = new Map(skillsData?.map(s => [s.id, s.name]) || []);

// Then use skillNameMap.get(skillId) in the processing loop
```

---

### 2. Fix EnglishPassageLayout.tsx (MEDIUM PRIORITY)

**Line 26: Replace `any` with proper type**

```typescript
// BEFORE:
marked_text?: Record<string, any> | null;

// AFTER (use Json type for schema alignment):
marked_text?: Record<string, unknown> | null;
```

---

### 3. Fix src/lib/lessons.ts (LOW PRIORITY)

**Line 287: Remove unnecessary regex escapes**

```typescript
// BEFORE:
const re = /(?:^|\s)(\d+)[\.\-–]\s*(.+?)(?=\s+\d+[\.\-–]\s+|$)/g;

// AFTER (escape only necessary chars - the dot inside character class, the hyphen at start/end):
const re = /(?:^|\s)(\d+)[.\-–]\s*(.+?)(?=\s+\d+[.\-–]\s+|$)/g;
```

Note: Inside character classes `[]`, the dot `.` doesn't need escaping (it's literal). The hyphen `-` should be at start or end to be literal.

---

### 4. Fix generate-study-plan Edge Function (MEDIUM PRIORITY)

**Line 741: Type the task properly**

```typescript
// BEFORE (line 741):
specialTasks.forEach((task: any) => {

// AFTER:
interface SpecialTask {
  type: string;
  skill_id?: string | null;
  size: number;
  estimated_mins?: number;
}

specialTasks.forEach((task: SpecialTask) => {
```

---

### 5. Fix src/lib/env.ts Logging (MEDIUM PRIORITY)

**Line 25-28: Make logSupabaseConfigStatus dev-only**

```typescript
// BEFORE:
export const logSupabaseConfigStatus = (): void => {
  if (!isBrowser) return;
  console.info('[env] Supabase config: ✓ URL and anon key configured');
};

// AFTER:
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logSupabaseConfigStatus = (): void => {
  if (!isBrowser || !isDev) return;
  console.info('[env] Supabase config: ✓ URL and anon key configured');
};
```

---

### 6. Fix AdminQuestionGenerator.tsx Logging (LOW PRIORITY)

**Lines 158, 179, 205: Remove/replace console.log calls**

```typescript
// Line 158: Remove or use logger
console.error("Generation error:", error);  // Keep - errors are important

// Line 179: Remove debug log
console.log(`Inserting ${approvedQuestions.length} questions via edge function...`);
// REMOVE THIS LINE

// Line 205: Remove debug log
console.log("Insert response:", data);
// REMOVE THIS LINE
```

---

### 7. Sanitize logger.error for Production (MEDIUM PRIORITY)

**File: src/lib/logger.ts**

The current `logger.error` always logs in production. While errors should be logged, we should sanitize to avoid exposing sensitive data.

```typescript
// BEFORE (lines 22-25):
error: (...args: unknown[]) => {
  // Always log errors, even in production
  console.error(...args);
}

// AFTER:
error: (...args: unknown[]) => {
  if (isDev) {
    // Full error details in development
    console.error(...args);
  } else {
    // Sanitized error in production - only message, no stack/headers
    const sanitized = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message;
      }
      if (typeof arg === 'object' && arg !== null) {
        // Don't log full objects in production
        return '[object]';
      }
      return arg;
    });
    console.error(...sanitized);
  }
}
```

---

### 8. Clean Up Unused Dependencies (LOW PRIORITY)

Based on search verification, these packages are truly unused:

| Package | Status | Action |
|---------|--------|--------|
| `@hookform/resolvers` | Unused | Remove |
| `@radix-ui/react-switch` | Custom impl used | Remove |
| `@testing-library/user-event` | Not imported | Move to devDependencies or remove |
| `@testsprite/testsprite-mcp` | Not imported | Remove |
| `@types/canvas-confetti` | **IN USE** | Keep (canvas-confetti is used) |
| `@types/dompurify` | **IN USE** | Keep (dompurify is used in sanitize.ts) |
| `@vitest/ui` | **IN USE** | Keep (vitest tooling) |
| `vite-plugin-pwa` | Not configured | Remove |

**Note:** Dependency cleanup should be done carefully and tested. I recommend leaving this for a separate PR.

---

## Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `src/pages/DiagnosticResultsComplete.tsx` | HIGH | Remove duplicate effect, validate JSON, batch skill queries |
| `src/components/EnglishPassageLayout.tsx` | MEDIUM | Replace `any` with `unknown` |
| `src/lib/lessons.ts` | LOW | Fix regex escapes |
| `supabase/functions/generate-study-plan/index.ts` | MEDIUM | Type task properly |
| `src/lib/env.ts` | MEDIUM | Make logging dev-only |
| `src/pages/AdminQuestionGenerator.tsx` | LOW | Remove console.log calls |
| `src/lib/logger.ts` | MEDIUM | Sanitize production error logs |

---

## Not Changing (By Design)

| Item | Reason |
|------|--------|
| Hardcoded Supabase URL/anon key | Correct Lovable architecture pattern - documented in memories |
| `src/lib/content.ts` issues | Already fixed in previous plan |
| `AdminLessonImport.tsx` logging | Already uses dev-only `logger.debug` |
| Package.json dependencies | Recommend separate PR for thorough testing |

---

## Technical Notes

- DiagnosticResultsComplete fix eliminates duplicate API calls and prevents potential race conditions
- N+1 query fix could improve page load by 10-50x for users with many diagnostic responses
- Type safety improvements in edge functions help catch bugs at build time
- Logger sanitization prevents accidental PII exposure in production logs

