

# Fix Answer Key Exposure (Test Integrity Critical Issue)

## The Problem

Students can open browser DevTools → Network tab and see correct answers before finishing a test. This **completely undermines test validity**.

**Affected flows (all expose `answer` and `explanation` to client):**

| File | Issue |
|------|-------|
| `DiagnosticTest.tsx` | Queries `staging_items` with `select('*')` — answer sent to browser |
| `DrillRunner.tsx` | Explicitly selects `answer, explanation` from `staging_items` |
| `DrillPlayer.tsx` | Queries `staging_items` with `select('*')` |
| `ReviewSpaced.tsx` | Explicitly selects `answer, explanation` from `staging_items` |
| `content.ts` | Selects `answer, explanation` for drill questions |
| `QuizRunner.tsx` | Uses `getQuestionsBySkill` which returns answers |
| `session-fetch` edge function | Returns full `staging_items` including answers |
| `useFormQuestions` hook | Queries `v_form_section` which includes `answer, explanation` |

---

## The Solution

### Architecture Change

**Before**: Client fetches questions with answers → validates locally → sends to server  
**After**: Client fetches questions WITHOUT answers → submits choice to server → server validates and returns correctness

### Implementation

#### 1. Update Client Queries to Use Safe Views

All client-side code must query `v_staging_items_public` instead of `staging_items` directly. This view already exists and excludes `answer` and `explanation`.

**Files to update:**

| File | Change |
|------|--------|
| `src/pages/DiagnosticTest.tsx` | Query `v_staging_items_public` instead of `staging_items` |
| `src/pages/DrillRunner.tsx` | Query `v_staging_items_public`, remove answer/explanation from select |
| `src/pages/DrillPlayer.tsx` | Query `v_staging_items_public` |
| `src/pages/ReviewSpaced.tsx` | Query `v_staging_items_public`, handle answer checking server-side |
| `src/lib/content.ts` | Query `v_staging_items_public` |
| `src/pages/QuizRunner.tsx` | Remove answer from client state |

#### 2. Update session-fetch Edge Function

The `session-fetch` function currently returns full `staging_items` data. Strip answer/explanation before sending to client.

**File:** `supabase/functions/session-fetch/index.ts`

Currently returns all columns. Must exclude `answer` and `explanation` from the response.

#### 3. Fix Answer Validation Flow

For diagnostics and drills, the client currently stores `answer` to validate locally. Instead:
- Store `correct_idx` in `attempts` table (already exists) — this is acceptable since it's user-specific shuffled order
- Use `submit-response` edge function for real-time validation (already works correctly for simulations)

#### 4. Handle Review Flows (Special Case)

For `ReviewSpaced.tsx` — the user is reviewing **previously missed questions**, so showing the answer AFTER they attempt is acceptable. The fix:
- Fetch questions without answers initially
- After user submits, call an edge function to get the explanation
- Or: Create a dedicated edge function that returns answer/explanation only after recording the response

---

## Detailed Changes

### DiagnosticTest.tsx (Lines 196-245)

```typescript
// BEFORE:
const { data, error } = await supabase
  .from('staging_items')
  .select('*')
  .eq('form_id', formId)
  .order('ord', { ascending: true });

// AFTER:
const { data, error } = await supabase
  .from('v_staging_items_public')
  .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title')
  .eq('form_id', formId)
  .order('ord', { ascending: true });
```

Remove lines 239-240 where `answer` and `explanation` are mapped.

The correct answer index is already computed server-side when shuffling and stored in `attempts.correct_idx`.

### DrillRunner.tsx (Lines 129-134)

```typescript
// BEFORE:
const { data, error: qError } = await supabase
  .from('staging_items')
  .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, answer, explanation, skill_code, form_id')

// AFTER:
const { data, error: qError } = await supabase
  .from('v_staging_items_public')
  .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, skill_code, form_id')
```

### DrillPlayer.tsx (Lines 52-56)

```typescript
// BEFORE:
let query = supabase
  .from('staging_items')
  .select('*')

// AFTER:
let query = supabase
  .from('v_staging_items_public')
  .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty')
```

### ReviewSpaced.tsx (Lines 72-75)

```typescript
// BEFORE:
const { data: stagingItems, error: stagingError } = await supabase
  .from('staging_items')
  .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, answer, explanation')

// AFTER:
const { data: stagingItems, error: stagingError } = await supabase
  .from('v_staging_items_public')
  .select('staging_id, question, choice_a, choice_b, choice_c, choice_d')
```

For the spaced repetition flow, we'll need to fetch answer/explanation after submission via a new edge function or RPC.

### content.ts (Lines 52-58)

```typescript
// BEFORE:
const { data, error } = await supabase
  .from('staging_items')
  .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, answer, explanation, skill_code, difficulty, form_id')

// AFTER:
const { data, error } = await supabase
  .from('v_staging_items_public')
  .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, skill_code, difficulty, form_id')
```

### session-fetch/index.ts (Lines 136-141)

```typescript
// BEFORE:
const { data, error } = await supabase
  .from('staging_items')
  .select('*')

// AFTER:
const { data, error } = await supabase
  .from('v_staging_items_public')
  .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title, underlined_text, reference_number, position_in_passage, image_url, image_caption, image_position, calculator_allowed')
```

---

## Additional Fix: N+1 Query in DiagnosticTest.tsx

The audit correctly identified a performance issue. Lines 256-263 perform individual queries per question:

```typescript
// BEFORE (N+1 pattern):
for (const question of mappedQuestions) {
  const { data: existing } = await supabase
    .from('attempts')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('form_id', formId)
    .eq('question_id', question.question_id)
    .maybeSingle();
  ...
}

// AFTER (batch query):
const questionIds = mappedQuestions.map(q => q.question_id);
const { data: existingAttempts } = await supabase
  .from('attempts')
  .select('*')
  .eq('user_id', user.user.id)
  .eq('form_id', formId)
  .in('question_id', questionIds);

const attemptMap = new Map(existingAttempts?.map(a => [a.question_id, a]) || []);

// Then in the loop, use attemptMap.get(question.question_id) instead of querying
```

---

## Items Already Fixed (From Previous Audits)

| Item | Status |
|------|--------|
| Hardcoded Supabase credentials | ✅ Intentional architecture for Lovable |
| PII logging in production | ✅ Fixed — `logger.warn` is now dev-only |
| CORS wildcard | ✅ Fixed — all functions use `getCorsHeaders(req)` |
| Sentry DSN not configured | Config issue — add DSN to Supabase secrets when ready |
| Test coverage | Ongoing effort — not a launch blocker |

---

## Files to Modify

| File | Priority | Change |
|------|----------|--------|
| `src/pages/DiagnosticTest.tsx` | CRITICAL | Use `v_staging_items_public`, fix N+1 query |
| `src/pages/DrillRunner.tsx` | CRITICAL | Use `v_staging_items_public` |
| `src/pages/DrillPlayer.tsx` | CRITICAL | Use `v_staging_items_public` |
| `src/pages/ReviewSpaced.tsx` | HIGH | Use `v_staging_items_public` |
| `src/lib/content.ts` | HIGH | Use `v_staging_items_public` |
| `src/pages/QuizRunner.tsx` | HIGH | Remove answer from client state |
| `supabase/functions/session-fetch/index.ts` | CRITICAL | Use `v_staging_items_public` |

---

## Technical Notes

- `v_staging_items_public` view already exists and excludes `answer` and `explanation`
- `submit-response` edge function already validates answers server-side
- `attempts.correct_idx` already stores the correct shuffled answer index
- No database migrations required
- Edge function will be auto-deployed

