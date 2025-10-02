# Priority Fixes - Ordered by Impact

## 🔴 CRITICAL (Do These First)

### 1. Fix Sim* Pages Question Type Mismatch (~60 errors)
**Files**: SimEnglish.tsx, SimMath.tsx, SimReading.tsx, SimScience.tsx

**Problem**: Database returns nullable fields but Question type expects non-nullable.

**Fix Pattern**:
```typescript
// Current (WRONG):
const { data: questionsData } = await supabase.from('questions').select('*')...
setQuestions(questionsData || []); // Type error!

// Fixed (RIGHT):
const { data: questionsData } = await supabase
  .from('questions')
  .select('id, stem, choice_a, choice_b, choice_c, choice_d, answer, passage_id, passage_title, passage_text')
  .eq('section', 'English')
  .limit(75);

// Map and provide defaults for nullable fields
setQuestions(
  (questionsData ?? []).map((q) => ({
    id: q.id ?? '',
    stem: q.stem ?? '',
    choice_a: q.choice_a ?? '',
    choice_b: q.choice_b ?? '',
    choice_c: q.choice_c ?? '',
    choice_d: q.choice_d ?? '',
    answer: q.answer ?? 'A',
    passage_id: q.passage_id,
    passage_title: q.passage_title,
    passage_text: q.passage_text,
  }))
);
```

**Estimated Time**: 2 hours  
**Impact**: Removes ~60 TypeScript errors

---

### 2. Fix DiagnosticTest.tsx (~40 errors)
**File**: src/pages/DiagnosticTest.tsx

**Problems**:
- `form_id` is `string | undefined` but needs `string`
- `question.ord` is `number | null` but used without check
- `section` parameter is `string | undefined`
- Attempts insert fails due to undefined form_id

**Fix Approach**:
```typescript
// Add guards at the top:
const { section, form } = useParams<{ section?: string; form?: string }>();
if (!section || !form) {
  return <div>Invalid test parameters</div>;
}

// Use constants:
const formId: string = form;
const sectionId: string = section;

// Guard all nullable accesses:
const questionIndex = question.ord ?? 0;

// Fix insert:
await supabase.from('attempts').insert(
  responses.map((r, idx) => ({
    question_id: r.questionId,
    choice_order: r.choiceOrder,
    correct_idx: r.correctIdx,
    selected_idx: r.selectedIdx,
    question_ord: idx + 1,
    user_id: userId,
    form_id: formId, // Now guaranteed to be string
  }))
);
```

**Estimated Time**: 1.5 hours  
**Impact**: Removes ~40 TypeScript errors

---

### 3. Diagnostic.tsx Cleanup (~15 errors)
**File**: src/pages/Diagnostic.tsx

**Problems**:
- `section` parameter is `string | undefined`
- Unused variables/imports
- Unused interfaces

**Fix**:
```typescript
const { section } = useParams<{ section?: string }>();
if (!section) {
  navigate('/diagnostic-test');
  return null;
}

// Use section as string safely below
```

Remove unused:
- `DiagnosticQuestion` interface
- `DiagnosticAnswer` interface
- `useEffect` import
- `previousScores` variable
- `setIsReviewing` setter

**Estimated Time**: 30 minutes  
**Impact**: Removes ~15 errors

---

## 🟡 HIGH PRIORITY

### 4. StudyNow.tsx Type Fixes (~20 errors)
**File**: src/components/StudyNow.tsx

**Problems**:
- Skill type has `description: string | null` but setState expects `string`
- Questions have `explanation: string | null`
- Unused variables

**Fix**:
```typescript
// When setting skill:
if (skillData) {
  setSkill({
    ...skillData,
    description: skillData.description ?? '', // Provide default
  });
}

// When setting questions:
setQuestions(
  (questionsData || []).map((q) => ({
    ...q,
    explanation: q.explanation ?? '', // Provide default
  }))
);
```

Remove unused:
- `setBaseTimeLimit`
- `questionTime`

**Estimated Time**: 45 minutes  
**Impact**: Removes ~20 errors

---

### 5. AdminImport.tsx Type Fix (~5 errors)
**File**: src/pages/AdminImport.tsx

**Problem**:
```typescript
interface ImportRecord {
  passage_id?: string; // Current
}

// But DB returns:
type DBRecord = {
  passage_id: string | null; // Actual
}
```

**Fix**:
```typescript
interface ImportRecord {
  passage_id?: string | null; // Allow null
}
```

**Estimated Time**: 15 minutes  
**Impact**: Removes ~5 errors

---

### 6. Sanitize Cheatsheet Pages
**Files**: 
- src/pages/Cheatsheets/Math.tsx
- src/pages/Cheatsheets/English.tsx
- src/pages/Cheatsheets/Science.tsx
- src/pages/Cheatsheets/Reading.tsx
- src/pages/SimEnglish.tsx (has inline style)

**Problem**: Using `dangerouslySetInnerHTML` without sanitization

**Fix Pattern**:
```typescript
import { sanitizeHTML, sanitizeCSS } from '@/lib/sanitize';

// For HTML content:
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />

// For inline styles:
<style dangerouslySetInnerHTML={{ __html: sanitizeCSS(cssString) }} />
```

**Estimated Time**: 1 hour  
**Impact**: Closes security vulnerability

---

## 🟢 MEDIUM PRIORITY

### 7. Fix ESLint Warnings (~24 warnings)

**A. React Hooks exhaustive-deps (8 warnings)**
```typescript
// Before:
useEffect(() => {
  someFunction();
}, [dependency]); // Missing someFunction

// Fix Option 1 - Add to deps:
useEffect(() => {
  someFunction();
}, [dependency, someFunction]);

// Fix Option 2 - Wrap in useCallback:
const someFunction = useCallback(() => {
  // ...
}, [deps]);
```

**B. Console statements (16 warnings)**
```typescript
// Replace:
console.log('debug info'); 

// With:
// console.log('debug info'); // Commented for production

// OR use proper logging:
if (import.meta.env.DEV) {
  console.log('debug info');
}
```

**Estimated Time**: 1 hour  
**Impact**: Clean lint output

---

### 8. Remove Unused Variables (~50 instances)

**Pattern**:
```typescript
// Before:
const [unused, setUnused] = useState(null);
{items.map((item, index) => ...)} // index unused

// Fix:
// Remove unused state OR prefix with _:
const [_unused, setUnused] = useState(null);
{items.map((item) => ...)} // Remove unused param
```

**Files**: Dashboard.tsx, PassageLayout.tsx, QuizComponent.tsx, many others

**Estimated Time**: 1.5 hours  
**Impact**: Clean typecheck output

---

### 9. Fix Remaining ui/* Component Exports
**Files**: button.tsx, form.tsx, navigation-menu.tsx, sidebar.tsx, sonner.tsx, toggle.tsx

**Warning**: `Fast refresh only works when a file only exports components`

**Fix**: Extract constants/utilities to separate files
```typescript
// Before (button.tsx):
export const buttonVariants = cva(...)
export const Button = ...

// After:
// Create button-variants.ts:
export const buttonVariants = cva(...)

// button.tsx:
import { buttonVariants } from './button-variants';
export const Button = ...
```

**Estimated Time**: 45 minutes  
**Impact**: Better dev experience (HMR)

---

## 🔵 LOW PRIORITY (Polish)

### 10. Add Missing User Scoping Audits
Review all `.from()` calls in:
- CountdownHeader.tsx
- Simulation.tsx
- Analytics.tsx
- Index.tsx

Ensure user_id filtering where applicable.

**Estimated Time**: 1 hour

---

### 11. Add Accessibility Features
- ARIA labels on buttons/links
- Alt text on images
- Focus management in modals
- Keyboard navigation tests

**Estimated Time**: 3 hours

---

### 12. Performance Optimizations
- React.lazy for route components
- Memo expensive components
- Virtualize question lists
- Code split vendor bundles

**Estimated Time**: 4 hours

---

### 13. Add Tests
```bash
# Unit tests:
- TaskLauncher.test.ts (routing logic)
- Plan.test.ts (date filtering)
- sanitize.test.ts (XSS prevention)

# E2E tests:
- smoke.spec.ts (happy path)
```

**Estimated Time**: 6 hours

---

## 📈 PROGRESS TRACKER

| Priority | Task | Errors Fixed | Time | Status |
|----------|------|--------------|------|--------|
| 🔴 | Sim* pages | ~60 | 2h | ⬜ TODO |
| 🔴 | DiagnosticTest | ~40 | 1.5h | ⬜ TODO |
| 🔴 | Diagnostic | ~15 | 0.5h | ⬜ TODO |
| 🟡 | StudyNow | ~20 | 0.75h | ⬜ TODO |
| 🟡 | AdminImport | ~5 | 0.25h | ⬜ TODO |
| 🟡 | Sanitize | 0 | 1h | ⬜ TODO |
| 🟢 | ESLint warnings | 0 | 1h | ⬜ TODO |
| 🟢 | Unused vars | ~50 | 1.5h | ⬜ TODO |
| 🟢 | UI exports | 0 | 0.75h | ⬜ TODO |

**Total Estimated Time to Zero Errors**: ~9-10 hours

---

## 🎯 GOAL

**Target**: Zero TypeScript errors, Zero ESLint errors, All security holes closed

**Current**: ~315 TS errors, 24 ESLint warnings, 5 unsanitized HTML renders

**Path**: Follow priorities 1-9 in order, should eliminate ~190 errors and close security gaps

---

## 💡 TIPS

1. **Run typecheck after each file**: `npm run typecheck | grep filename`
2. **Use explicit types**: Don't rely on inference for DB rows
3. **Guard undefined params**: Always check useParams results
4. **Prefer `??` over `||`**: Handles empty strings correctly
5. **Test builds frequently**: `npm run build` to catch regressions
6. **Use void for async**: `void fetchData()` in useEffect

---

**Last Updated**: October 2, 2025  
**Next Review**: After completing priorities 1-3
