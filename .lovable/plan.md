

## QA-009: Diagnostic Test End-to-End Flow — Issues Found

### Bug 1: ONB 'Mixed' Section Fails Server Validation (BLOCKER)

The client sends `section: 'Mixed'` for ONB diagnostics (line 131 of DiagnosticTest.tsx), but the `finish-diagnostic` edge function validates with `z.enum(['English', 'Math', 'Reading', 'Science'])` (line 25 of index.ts). This means **every ONB quick diagnostic submission returns a 400 error**.

**Fix:** Add `'Mixed'` to the Zod enum in `finish-diagnostic/index.ts`:
```
section: z.enum(['English', 'Math', 'Reading', 'Science', 'Mixed'])
```

### Bug 2: DiagnosticResults Page Never Receives State (Navigation Gap)

After submitting a thorough diagnostic section (D2EN/D2MA/D2RD/D2SC), the client navigates back to `/diagnostic` (line 187). It never navigates to `/diagnostic-results/:formId` with results state. The `DiagnosticResults` page expects `location.state` containing `results` and `formId`, but nothing in the flow provides this.

For ONB, the client navigates directly to `/diagnostic-results-complete` (line 185), also without passing state.

**Fix:** After the `finish-diagnostic` edge function call, capture the response data and either:
- For thorough: navigate to `/diagnostic` as before (individual section results are viewed on the complete page)
- For ONB: already goes to `/diagnostic-results-complete` which fetches from DB — this path works

The edge function response includes `predicted_section_score`, `top_5_weak_skills`, and `diagnostic_id`, but the client discards this data (`const { error } = await supabase.functions.invoke(...)` — only destructures `error`). We should capture the response `data` and optionally pass it as navigation state.

**Fix:** Change to `const { data: responseData, error }` and for thorough diagnostics, store section results in localStorage so the orchestrator page can show per-section scores as they complete.

### Bug 3: DiagnosticResultsComplete Section Label Mismatch

`getSectionLabel()` in DiagnosticResultsComplete.tsx (line 222) maps abbreviations (`EN`, `MA`, `RD`, `SCI`) but the `diagnostics` table now stores full names (`English`, `Math`, `Reading`, `Science`, `Mixed`). So the labels will fall through to the raw string, which actually works — but the function is dead code. Minor cleanup.

### Bug 4: Thorough Diagnostic Never Marks `diagnostic_completed` on Profile

When completing the thorough flow, the user clicks "View Complete Results" on `/diagnostic` (line 60 of Diagnostic.tsx), which calls `handleContinue()`. This marks `diagnostic_completed: true` on the profile. However, if the user navigates directly to `/diagnostic-results-complete` or refreshes, the flag may not be set, causing the dashboard to keep showing the diagnostic CTA.

**Fix:** Have `DiagnosticResultsComplete` also set `diagnostic_completed: true` when it loads and finds completed diagnostics.

### Implementation Plan

1. **Fix `finish-diagnostic` edge function** — Add `'Mixed'` to the section enum
2. **Fix `DiagnosticTest.tsx` submit handler** — Capture response data from edge function; for thorough diagnostics, store last section result in localStorage
3. **Fix `DiagnosticResultsComplete.tsx`** — Update `getSectionLabel` to handle full section names; set `diagnostic_completed: true` on profile load
4. **Update `finish-diagnostic/test.ts`** — Add test for 'Mixed' section validation

### Files to Edit
- `supabase/functions/finish-diagnostic/index.ts` (add 'Mixed' to enum)
- `src/pages/DiagnosticTest.tsx` (capture response data)
- `src/pages/DiagnosticResultsComplete.tsx` (fix labels, set profile flag)
- `supabase/functions/finish-diagnostic/test.ts` (add enum test)

