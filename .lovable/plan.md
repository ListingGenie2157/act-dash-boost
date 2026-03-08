

# Bug Fix Plan: ChatGPT Audit Findings

This plan addresses the 6 actionable bugs found during testing. Each is a concrete code fix.

---

## Bug 1: Study Plan Wizard "Next" button stuck on Step 1

**Root cause**: `canProceedStep1` requires `form.testDate !== null`. The "I don't know my test date yet" button sets the date but doesn't advance the step, so the user has to click Next separately. However, the real reported issue is that when a plan already exists, the wizard still opens but the Next button never enables.

**Investigation**: The wizard component itself has no awareness of whether a plan exists. The `canProceedStep1` check is purely `form.testDate !== null`. The "I don't know" button sets a date, which should enable Next. This likely works on a fresh state but may fail if there's a stale state issue.

**Fix**: Make the "I don't know my test date yet" button also advance to step 2 automatically. Additionally, on the Dashboard, when a plan already exists, change the "Create Study Plan" button to "Update Study Plan" or add a "Reset Plan" option.

**Files**: `src/components/StudyPlanWizard.tsx`, `src/pages/Dashboard.tsx`

---

## Bug 2: Analytics baseline scores showing 2500%, 2000%

**Root cause**: Line 151 in Analytics.tsx: `const baseline = (first.score || 0) * 100`. The `diagnostics.score` field stores ACT scale scores (e.g., 25, 20 out of 36), not decimals. Multiplying by 100 produces 2500%.

**Fix**: Display `score` directly as a raw score (out of 36) instead of multiplying by 100. Change the display to show "/36" instead of "%".

**Files**: `src/pages/Analytics.tsx`

---

## Bug 3: Mastery Tracker links to "/" instead of a real page

**Root cause**: In `AppSidebar.tsx` line 32: `{ title: 'Mastery Tracker', url: '/', icon: Target, end: true }` — it points to the dashboard root.

**Fix**: Point to `/analytics` (which already has mastery cluster data) or create a dedicated route. Since `MasteryDashboard` component already exists and renders on the dashboard, the simplest fix is to link to `/analytics` and rename it, or remove the sidebar item to avoid confusion.

**Files**: `src/components/AppSidebar.tsx`

---

## Bug 4: Diagnostic shows "No questions found"

**Root cause**: The diagnostic test pulls questions from `staging_items` or `form_questions`. The ONB form likely has no questions loaded in the database.

**Fix**: This is a data issue, not a code issue. However, we should add a better empty state that tells users to contact support or try the thorough diagnostic, rather than showing a dead end. Also verify that form IDs used by the diagnostic (ONB, D2EN, etc.) exist in staging_items.

**Files**: `src/pages/DiagnosticTest.tsx` (improve empty state messaging)

---

## Bug 5: Dashboard progress bar showing 77% with no activity

**Root cause**: The `MasteryDashboard` component likely calculates progress based on existing data that may include stale or pre-seeded values.

**Investigation needed**: Check what drives the progress percentage on the dashboard.

**Fix**: Ensure progress shows 0% when no study tasks or responses exist.

**Files**: `src/components/MasteryDashboard.tsx`

---

## Bug 6: Parent Portal duplicate rule on create

**Root cause**: Likely an optimistic UI update combined with a successful server response causing double rendering. When "Create Rule" is clicked, the UI adds the rule optimistically, then the refetch adds it again.

**Files**: `src/pages/ParentPortal.tsx`

---

## Implementation Priority (ordered by user impact)

1. **Analytics baseline scores** — Simple math fix, highest credibility impact
2. **Study Plan Wizard step 1** — Blocks core onboarding flow  
3. **Mastery Tracker sidebar link** — Points to wrong page
4. **Diagnostic empty state** — Better error messaging
5. **Dashboard progress bar** — Misleading data
6. **Parent Portal duplicate** — Minor UX annoyance

---

## Technical Details

### Analytics fix (Bug 2)
```
// Before:
const baseline = (first.score || 0) * 100;
const latest = (last.score || 0) * 100;

// After: scores are already on 1-36 ACT scale
const baseline = first.score || 0;
const latest = last.score || 0;
```
Display will change from "2500%" to "25/36".

### Wizard fix (Bug 1)  
- "I don't know" button: set date AND advance step
- Add ability to regenerate plan when one already exists (reset wizard state on open)

### Sidebar fix (Bug 3)
- Change Mastery Tracker URL from `'/'` to `'/analytics'` or remove it

