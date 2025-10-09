# Code Cleanup & Review Status

## COMPLETED ✅

### 1. Setup & Configuration
- ✅ Added `typecheck` script to package.json (`tsc --noEmit`)
- ✅ Enabled strict TypeScript mode in tsconfig.json:
  - `"strict": true`
  - `"noImplicitAny": true`
  - `"strictNullChecks": true`
  - `"noImplicitOverride": true`
  - `"noUnusedLocals": true`
  - `"noUnusedParameters": true`
- ✅ Build passes (vite build succeeds)

### 2. Type System Improvements
- ✅ Created proper type definitions in `/src/types/index.ts`:
  - `Question` interface aligned with DB schema
  - `StudyPlanTask` interface for tasks_json structure
  - `StudyPlanDay` interface for study_plan_days table
  - `StudyTask` interface with proper nullable fields
  - `Skill` interface matching skills table

### 3. Hot-Spot Fixes (Primary Requirements)

#### Plan.tsx ✅
- ✅ Fixed wrong types (replaced `any[]` with `StudyPlanDay[]`)
- ✅ Properly typed `tasks_json` as `StudyPlanTask[]`
- ✅ Limited date range to 7 days (`lte` filter added)
- ✅ Added explicit column selection (no `*`)
- ✅ User scoping with `.eq('user_id', user.id)`
- ✅ Proper error narrowing (unknown → Error check)

#### TaskLauncher.tsx ✅
- ✅ Validated date format with regex (`/^\d{4}-\d{2}-\d{2}$/`)
- ✅ Validated idx as integer with range check
- ✅ Filtered study_plan_days by `user_id`
- ✅ Used `navigate(..., { replace: true })` for all redirects
- ✅ Explicit SIM route (`/sim-english`)
- ✅ Proper type casting for tasks_json
- ✅ Added authentication check

#### DrillRunner.tsx ✅
- ✅ Fixed `getQuestionsBySkill` to return `{ data, error }`
- ✅ Set `questions = data ?? []` (no type casting to array)
- ✅ Imported `Question` type from `@/types`
- ✅ Removed `(q as any).answer` cast
- ✅ Added null check for question before processing
- ✅ Added `void` prefix for async useEffect

#### QuizRunner.tsx ✅
- ✅ Fixed `getQuestionsBySkill` to return `{ data, error }`
- ✅ Set `questions = data ?? []`
- ✅ Imported `Question` type from `@/types`
- ✅ Removed `(q as any).answer` cast
- ✅ Added null check for question before processing
- ✅ Added `void` prefix for async useEffect

#### LessonViewer.tsx ✅
- ✅ Already using `getLessonBySkill` (singular) correctly
- ✅ Added proper Lesson interface
- ✅ Imported and applied `sanitizeHTML` from DOMPurify
- ✅ Proper error handling with type narrowing

### 4. Content Library (lib/content.ts) ✅
- ✅ Fixed table name: no `lessons` table exists, using `skills` instead
- ✅ Changed `skill_code` to `skill_id` in questions query (matches DB schema)
- ✅ Explicit column selection (no `*`)
- ✅ Proper return shape normalization: `{ data, error }`
- ✅ Added Database types import

### 5. Security & Sanitization
- ✅ Installed DOMPurify: `npm install dompurify @types/dompurify`
- ✅ Created `/src/lib/sanitize.ts` with `sanitizeHTML()` utility
- ✅ Applied sanitization in LessonViewer.tsx
- ⚠️ Need to apply to: Math.tsx, English.tsx, Science.tsx, Reading.tsx, SimEnglish.tsx cheatsheets

### 6. Data Access & RLS Safety
- ✅ No `SERVICE_ROLE` found in client code (grep confirmed)
- ✅ Dashboard.tsx: scoped study_tasks by `user_id`
- ✅ Plan.tsx: scoped study_plan_days by `user_id`
- ✅ TaskLauncher.tsx: scoped study_plan_days by `user_id`
- ✅ Explicit column selections added (no `select('*')` in client)

### 7. Removed Unused Imports
- ✅ Dashboard.tsx: Removed unused `AlertCircle`, `CheckCircle`, `Brain`, `Progress`, `navigate`, `diagnosticResults`
- ✅ Removed standalone `import React` from:
  - Cheatsheets/Math.tsx
  - Cheatsheets/English.tsx
  - Cheatsheets/Science.tsx
  - Cheatsheets/Reading.tsx
  - DiagnosticResults.tsx
  - CountdownHeader.tsx
  - StudyNow.tsx
  - SimReading.tsx
  - SimScience.tsx
  - SimMath.tsx
  - SimEnglish.tsx
  - DiagnosticTest.tsx
  - Onboarding.tsx

### 8. Query Consistency
- ✅ DrillRunner & QuizRunner: standardized `{ data, error }` handling
- ✅ Plan.tsx: standardized error handling
- ✅ TaskLauncher.tsx: proper null checks

---

## IN PROGRESS 🚧

### Type Pass (Remaining ~315 TypeScript errors)
Major categories still needing fixes:

#### Unused Variables/Parameters
- Multiple files with unused function parameters (mapped indices)
- Unused state setters in several components
- Declared but unused interfaces/types

#### Null Safety Issues
- SimEnglish/Math/Reading/Science.tsx: DB row types with nulls not matching Question interface
- DiagnosticTest.tsx: Multiple null property access issues
- StudyNow.tsx: Skill and Question types have nullable fields
- ParentPortal.tsx: undefined params not handled

#### Type Mismatches
- Dashboard.tsx: StudyTask.skill_id mismatch (string | null vs string)
- StudyNow.tsx: Skill.description null vs string
- AdminImport.tsx: ImportRecord type mismatch with passage_id
- Onboarding.tsx: diagnostic section parameter potentially undefined

---

## TODO 📋

### High Priority

1. **Complete Type Pass**
   - [ ] Fix all nullable field type mismatches in Question interfaces
   - [ ] Add proper null guards in Sim* pages
   - [ ] Fix DiagnosticTest.tsx form_id, section, ord null handling
   - [ ] Update AdminImport.tsx ImportRecord type
   - [ ] Fix ParentPortal param handling

2. **Sanitization Pass**
   - [ ] Apply sanitizeHTML to Cheatsheets (Math, English, Science, Reading)
   - [ ] Apply sanitizeCSS to inline `<style>` blocks in cheatsheets
   - [ ] Verify no other dangerouslySetInnerHTML without sanitization

3. **RLS Safety Audit**
   - [ ] Review all `.from()` calls for user_id scoping
   - [ ] Audit insert/update operations for auth.uid() binding
   - [ ] Check review_queue, attempts, accommodations, preferences writes
   - [ ] Verify no .select('*') remains

4. **Accessibility Pass**
   - [ ] Add ARIA labels to all interactive elements
   - [ ] Verify focus trap in modals/dialogs
   - [ ] Test keyboard navigation paths
   - [ ] Add alt text to images
   - [ ] Ensure no color-only semantics
   - [ ] Test with reduced motion preference

5. **Performance Pass**
   - [ ] Add route-level code splitting (React.lazy)
   - [ ] Memo components with stable props
   - [ ] Virtualize long lists (review history, question lists)
   - [ ] Remove dead code
   - [ ] Audit and remove unused dependencies

6. **PWA/Offline**
   - [ ] Ensure write-queue has idempotent keys
   - [ ] Service worker: only cache GET requests
   - [ ] Add update prompt for SW updates
   - [ ] Never cache auth tokens

7. **Tests**
   - [ ] Unit test: TaskLauncher routing logic
   - [ ] Unit test: Plan fetch and date filtering
   - [ ] Unit test: Drill/Quiz record persistence
   - [ ] E2E: auth → onboarding → plan → task → summary (Playwright)

8. **Edge Functions Review**
   - [ ] Verify generate-study-plan output matches StudyPlanTask interface
   - [ ] Check cron-daily idempotency
   - [ ] Confirm service role has persistSession: false

### ESLint Configuration Improvements
- [ ] Add `@typescript-eslint/consistent-type-imports`
- [ ] Add `@typescript-eslint/explicit-module-boundary-types`
- [ ] Add `import/order` plugin
- [ ] Add `no-restricted-imports` rule to block bare `@integrations/...`
- [ ] Enable `no-floating-promises`

### Code Style
- [ ] Run Prettier on all modified files
- [ ] Verify single quotes in TS/JS, double in JSX
- [ ] Check trailing commas, semicolons, 100 col width

---

## BLOCKED / NEEDS DECISION ⚠️

1. **Lessons Table Missing**: There's no `lessons` table in the database schema, only `skills`.
   - **Current solution**: Using skills table as lesson source
   - **Decision needed**: Should we create a lessons table or is skills sufficient?

2. **Question Schema Mismatch**: The `questions` table uses `skill_id` but some code expected `skill_code`.
   - **Fixed**: Updated lib/content.ts to use skill_id
   - **Verify**: Check if any other places use skill_code incorrectly

3. **Database Type Generation**: Some table columns are nullable in DB but app expects non-null.
   - **Options**:
     a. Update DB schema to add NOT NULL constraints
     b. Update app types to handle nulls everywhere
     c. Add runtime validation/transformation layer
   - **Current approach**: Handling nulls in app with `??` operators

---

## METRICS

- **TypeScript Errors**: ~315 (down from ~400+)
- **ESLint Errors**: Not measured yet
- **Build Status**: ✅ Passing
- **Test Coverage**: Not measured yet
- **Files Modified**: 20+
- **Files Remaining**: ~30-40 need type fixes

---

## NOTES

- All imports use `@/integrations/supabase/client` (correct alias)
- No `any` types remain in hot-spot files
- DOMPurify integrated and ready for use
- Strict mode enabled - all new errors are now visible
- Auth checks added where user scoping is critical

---

## NEXT STEPS (Priority Order)

1. Fix nullable type issues in Sim* pages (4 files)
2. Fix DiagnosticTest.tsx (highest error count)
3. Complete sanitization for cheatsheet pages
4. Add comprehensive RLS audit
5. Run lint and fix all ESLint errors
6. Add unit tests for critical paths
7. Run e2e smoke test
8. Final build & typecheck validation
