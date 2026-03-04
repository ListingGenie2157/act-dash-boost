

## QA-008: Diagnostic Score Calculation Integrity — Issues Found

### Bug 1: Shuffled Index Not De-shuffled Before Submission (CRITICAL)

The client stores `selected_idx` as the position within the **shuffled** choice order, not the original A/B/C/D index. When submitting, it sends `attempt.selected_idx?.toString()` directly (line 144 of DiagnosticTest.tsx).

The server receives this numeric string, converts it via `IDX_TO_LETTER[numIdx]` (0→A, 1→B, 2→C, 3→D), and compares against the real answer from `staging_items`.

**Problem:** If `choice_order = [2, 0, 3, 1]` and the user taps position 0 (which displays choice C), the server converts `0 → A` instead of `0 → C`. This means scoring is essentially random when choices are shuffled.

**Fix:** In `handleSubmit`, map `selected_idx` through `choice_order` to recover the original choice index before sending:
```
selectedAnswer: IDX_TO_LETTER[attempt.choice_order[attempt.selected_idx]]
```
This converts the shuffled position back to the original letter (A/B/C/D) so the server comparison works correctly.

### Bug 2: Questions/Answers Index Mismatch

The server matches questions to answers by array index (`block.questions[i]` paired with `block.answers[i]`). But the client builds these arrays differently:
- `questions` array: built from `questions.map(...)` — ordered by question ord
- `answers` array: built from `Object.entries(attempts).map(...)` — ordered by object key insertion order (questionId strings)

These two arrays may not be in the same order, causing skill tags to be attributed to the wrong answers.

**Fix:** Build the answers array by iterating over `questions` (same order as the questions array) instead of `Object.entries(attempts)`.

### Bug 3: ONB Section Mapping

`ONB` maps to `'English'` in `SECTION_MAP`, but ONB is a mixed-section diagnostic. This means all ONB results get stored as section "English" in the diagnostics table, which corrupts the results-complete page that groups by section. This is a minor issue compared to the scoring bugs.

### Implementation Plan

1. **Fix DiagnosticTest.tsx `handleSubmit`** — Two changes:
   - Map `selected_idx` through `choice_order` to get original letter
   - Build answers array by iterating `questions` array (not `Object.entries(attempts)`) to maintain index alignment

2. **No server changes needed** — The server's `IDX_TO_LETTER` conversion and index-based matching will work correctly once the client sends properly de-shuffled letters and aligned arrays.

3. **Update finish-diagnostic test** — Add a test case verifying that shuffled-then-de-shuffled indices produce correct letter mapping.

### Files to Edit
- `src/pages/DiagnosticTest.tsx` (handleSubmit function)
- `supabase/functions/finish-diagnostic/test.ts` (add shuffle de-mapping test)

