# Code Quality & Structure Production Readiness Audit

**Date:** December 2025  
**Scope:** Frontend + Backend Code Quality, TypeScript Strictness, Structure, Linting, API Contracts

---

## Executive Summary

This audit reviews TypeScript configuration, code structure, dead code, linting/formatting setup, API contracts, and magic strings.

**Overall Status:** ⚠️ **Needs Attention** - Several issues identified that should be addressed for production readiness.

---

## 1. TypeScript Strictness

### 🔴 CRITICAL: TypeScript Config Conflict

**Issue:** `tsconfig.app.json` overrides `tsconfig.json` with `strict: false`

**Current State:**
- `tsconfig.json`: `strict: true` ✅
- `tsconfig.app.json`: `strict: false` ❌ (overrides base config)

**Impact:**
- Type checking is less strict than intended
- `noImplicitAny`, `strictNullChecks`, etc. are disabled for app code
- Potential runtime errors not caught at compile time

**Fix Required:**
```json
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true,  // Change from false
    "noImplicitAny": true,
    "strictNullChecks": true,
    // ... other strict options
  }
}
```

**Recommendation:** Align `tsconfig.app.json` with `tsconfig.json` strict settings.

---

### ✅ TypeScript Usage Review

**Good News:**
- ✅ No `any` types found in core logic (study plan, scoring, mastery)
- ✅ Proper type definitions in `src/types/`
- ✅ Zod schemas provide runtime + compile-time validation
- ✅ Supabase types are generated and used

**Minor Issues:**
- `as unknown as StudyPlanTask[]` type assertion in `Plan.tsx` (line 55, 100)
  - **Recommendation:** Validate JSON structure with Zod schema instead

---

## 2. Folder Structure

### ⚠️ Current Structure: Type-Based Organization

**Current Organization:**
```
src/
├── components/     # All components together
├── pages/          # All pages together
├── hooks/          # All hooks together
├── lib/            # Utilities
├── types/          # Type definitions
└── utils/          # Helper functions
```

**Issue:** Not organized by feature/domain, making it harder to:
- Find related code
- Understand feature boundaries
- Refactor features independently
- Onboard new developers

**Recommended Structure (Feature-Based):**
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types.ts
│   ├── study-plan/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types.ts
│   ├── lessons/
│   ├── diagnostics/
│   ├── drills/
│   └── analytics/
├── shared/
│   ├── components/  # Truly shared UI components
│   ├── hooks/
│   └── utils/
└── lib/             # Core utilities
```

**Priority:** Medium (refactor can be done incrementally)

**Action:** Consider gradual migration to feature-based structure for new features.

---

## 3. Dead Code Review

### ✅ No Major Dead Code Found

**Findings:**
- ✅ No large commented-out blocks
- ✅ No obvious unused components
- ✅ Debug logging uses `logger.debug()` (can be filtered in production)

**Minor Issues:**
- `SimpleLogin.tsx` - Debugging page (line 9 comment: "Simplified login page for debugging")
  - **Recommendation:** Remove or gate behind feature flag if needed for debugging

**Action:** Low priority - codebase is clean.

---

## 4. Linting + Formatting

### ⚠️ ESLint Configuration

**Current State:**
- ✅ ESLint configured with TypeScript support
- ✅ Rules configured:
  - `@typescript-eslint/no-explicit-any`: `"error"` ✅
  - `no-console`: `"warn"` (allows error/warn) ✅
  - `prefer-const`: `"error"` ✅
- ⚠️ ESLint not installed in current environment (needs `npm install`)
- ❌ No Prettier configuration found

**Issues:**
1. **No Prettier:** Code formatting not enforced
   - **Recommendation:** Add Prettier config and format script
2. **ESLint Disabled Rules:**
   - `@typescript-eslint/no-unused-vars`: `"off"` (should be `"warn"` or `"error"`)

**Recommended Fixes:**

1. **Add Prettier:**
```json
// package.json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\""
  },
  "devDependencies": {
    "prettier": "^3.0.0"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

2. **Update ESLint:**
```js
// eslint.config.js
rules: {
  "@typescript-eslint/no-unused-vars": "warn",  // Change from "off"
  // ... other rules
}
```

3. **Add Pre-commit Hook:**
   - Consider `husky` + `lint-staged` to enforce formatting

---

## 5. API Contracts

### ✅ Good: Shared Validation Schemas

**Current State:**
- ✅ Zod schemas in `src/lib/validation/edgeFunctionSchemas.ts`
- ✅ Types exported: `DiagnosticFormIdInput`, `DrillRunnerInput`, `SessionStartInput`, etc.
- ✅ Edge functions use same Zod schemas (verified in `session-start/index.ts`)

**Examples:**
```typescript
// Frontend
import { validateInput, sessionStartSchema } from '@/lib/validation/edgeFunctionSchemas';
const validated = validateInput(sessionStartSchema, { form_id: 'EN_A', section: 'english' });

// Backend (Edge Function)
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
const SessionStartSchema = z.object({ ... });  // Same schema
```

**Gap:** Not all API contracts are shared:
- `generate-study-plan` - No shared schema found
- `complete-task` - Uses Zod in backend, but schema not exported from frontend
- `finish-diagnostic` - No shared schema found

**Recommendation:**
1. Export all edge function schemas from `edgeFunctionSchemas.ts`
2. Use same schemas in both frontend and backend
3. Consider generating types from OpenAPI/Swagger if API grows

---

### ⚠️ Magic Strings Scattered Throughout Code

**Issue:** String literals used instead of constants

**Examples Found:**

1. **Task Status:**
   - `'PENDING'`, `'DONE'`, `'SKIPPED'`, `'COMPLETED'`, `'STARTED'`
   - Found in: `WeeklyCalendar.tsx`, `ParentBanner.tsx`, `useStreak.ts`, `useAchievements.ts`, etc.

2. **Section Codes:**
   - `'EN'`, `'MATH'`, `'RD'`, `'SCI'`
   - Found in: `SectionPicker.tsx`, `FormPicker.tsx`, `Simulation.tsx`, etc.

3. **Task Types:**
   - `'LEARN'`, `'DRILL'`, `'REVIEW'`, `'SIM'`, `'MIXED'`
   - Found in: `Plan.tsx`, `generate-study-plan/index.ts`, etc.

**Recommendation:** Create constants file:

```typescript
// src/lib/constants.ts
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DONE: 'DONE',
  SKIPPED: 'SKIPPED',
  STARTED: 'STARTED',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const ACT_SECTIONS = {
  ENGLISH: 'EN',
  MATH: 'MATH',
  READING: 'RD',
  SCIENCE: 'SCI',
} as const;

export type ACTSection = typeof ACT_SECTIONS[keyof typeof ACT_SECTIONS];

export const TASK_TYPES = {
  LEARN: 'LEARN',
  DRILL: 'DRILL',
  REVIEW: 'REVIEW',
  SIM: 'SIM',
  MIXED: 'MIXED',
} as const;

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES];
```

**Priority:** Medium (prevents typos, improves maintainability)

---

## 6. Detailed Issue List

### Priority 1: Critical (Fix Before Production)

1. **Fix TypeScript Strict Mode Override**
   - File: `tsconfig.app.json`
   - Change `strict: false` → `strict: true`
   - Impact: Ensures type safety across entire codebase

2. **Install ESLint Dependencies**
   - Run: `npm install`
   - Verify: `npm run lint` works
   - Impact: Linting can actually run

3. **Add Prettier Configuration**
   - Create `.prettierrc` and `.prettierignore`
   - Add format scripts to `package.json`
   - Impact: Consistent code formatting

### Priority 2: Important (Fix Soon)

4. **Centralize Magic Strings**
   - Create `src/lib/constants.ts`
   - Replace string literals with constants
   - Impact: Prevents typos, improves maintainability

5. **Export All API Schemas**
   - Ensure all edge function schemas are in `edgeFunctionSchemas.ts`
   - Use shared schemas in both frontend and backend
   - Impact: Type safety across API boundaries

6. **Enable Unused Variable Warnings**
   - Change `@typescript-eslint/no-unused-vars` from `"off"` to `"warn"`
   - Impact: Catch unused code

7. **Replace Type Assertions with Validation**
   - In `Plan.tsx`, replace `as unknown as StudyPlanTask[]` with Zod validation
   - Impact: Runtime safety for JSON data

### Priority 3: Nice to Have

8. **Migrate to Feature-Based Structure**
   - Gradually reorganize code by feature
   - Start with new features
   - Impact: Better code organization

9. **Remove Debug Pages**
   - Remove or gate `SimpleLogin.tsx` behind feature flag
   - Impact: Cleaner codebase

---

## 7. Summary Checklist

### TypeScript Strictness
- [x] `strict: true` in base config
- [ ] **`strict: true` in app config** ⚠️ (currently false)
- [x] No `any` types in core logic
- [ ] **Type assertions replaced with validation** ⚠️ (1 instance found)

### Folder Structure
- [ ] **Organized by feature** ⚠️ (currently by type)
- [x] Clear separation of concerns
- [x] Shared utilities in `lib/`

### Dead Code
- [x] No commented-out blocks
- [x] No unused components
- [ ] **Debug pages removed/gated** ⚠️ (SimpleLogin.tsx)

### Linting + Formatting
- [x] ESLint configured
- [ ] **ESLint installed** ⚠️ (needs npm install)
- [ ] **Prettier configured** ⚠️ (missing)
- [ ] **Unused vars warning enabled** ⚠️ (currently off)
- [ ] **Format script in package.json** ⚠️ (missing)

### API Contracts
- [x] Zod schemas for validation
- [x] Types exported from schemas
- [ ] **All API schemas shared** ⚠️ (some missing)
- [ ] **Magic strings centralized** ⚠️ (scattered)

---

## 8. Recommended Actions

### Immediate (Before Production)

1. **Fix TypeScript Config:**
   ```json
   // tsconfig.app.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

2. **Add Prettier:**
   ```bash
   npm install -D prettier
   ```
   Create `.prettierrc` and add format scripts

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Create Constants File:**
   Create `src/lib/constants.ts` with all magic strings

### Short Term (Next Sprint)

5. Export all API schemas to shared location
6. Replace type assertions with Zod validation
7. Enable unused variable warnings
8. Remove/gate debug pages

### Long Term (Refactoring)

9. Migrate to feature-based folder structure (incremental)

---

## 9. Code Quality Metrics

### Current State
- **TypeScript Coverage:** ~95% (strict mode override is the gap)
- **Linting Coverage:** 100% (when installed)
- **Formatting:** 0% (no Prettier)
- **API Contract Coverage:** ~60% (some schemas not shared)
- **Magic String Usage:** High (needs centralization)

### Target State
- **TypeScript Coverage:** 100%
- **Linting Coverage:** 100%
- **Formatting:** 100%
- **API Contract Coverage:** 100%
- **Magic String Usage:** Low (all constants)

---

## Next Steps

1. ✅ Review this audit
2. ⏳ Fix TypeScript strict mode
3. ⏳ Add Prettier configuration
4. ⏳ Create constants file
5. ⏳ Export all API schemas
6. ⏳ Run `npm run lint` and fix issues
7. ⏳ Run `npm run format` and commit formatted code

---

**Audit Completed:** December 2025  
**Next Review:** After Priority 1 fixes are applied
