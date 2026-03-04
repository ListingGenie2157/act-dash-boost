

## QA-010: Study Plan Generation + Task Completion — Issues Found

### Bug 1: Task Index Mismatch (BLOCKER)

**Plan.tsx** filters out SIM tasks before rendering:
```js
const tasks = allTasks.filter(t => t.type !== 'SIM');
```
Then uses the **filtered** array index in the link: `/task/${plan.the_date}/${taskIdx}`.

**TaskLauncher** reads the **unfiltered** `tasks_json` array and uses the raw index `i`. If `tasks_json = [LEARN, SIM, DRILL]`, Plan shows `[LEARN, DRILL]` with indices 0 and 1. Clicking DRILL sends index 1, but TaskLauncher reads `tasks_json[1]` which is SIM — wrong task.

**Fix:** Instead of using the filtered index, use the **original** index from `allTasks`. Change Plan.tsx to track each task's original position in `tasks_json` and pass that as the URL index.

### Bug 2: DrillRunner Creates Duplicate Tasks Instead of Using Plan Task

When launched via `/task/:date/:idx` → TaskLauncher → `/drill/:subject?...`, the DrillRunner always creates a **new** `study_tasks` row (line 175-185). The original plan task is never updated, so the plan never shows completion.

**Fix:** TaskLauncher should pass the existing `study_tasks` ID (looked up by `user_id + the_date + type + skill_id`) or a task reference via URL params. DrillRunner should accept an optional `taskId` param and skip creating a new task if one is provided.

### Bug 3: No Completion Checkmarks on Plan Page

Plan.tsx renders tasks from `tasks_json` but never cross-references `study_tasks` for completion status. There's no visual indication of which tasks have been completed.

**Fix:** Fetch `study_tasks` for the 7-day range and match by `(the_date, type, skill_id)`. Show a checkmark or completed state on cards where `status = 'DONE'` or `'COMPLETED'`.

### Bug 4: DrillRunner Bypasses complete-task Edge Function

DrillRunner does a direct client-side `.update()` on `study_tasks` (line 291-298) instead of calling the `complete-task` edge function. This means:
- Mastery/progress tables aren't updated
- Review queue isn't updated via the spaced repetition logic
- Error bank atomic increment isn't triggered through the server path

**Fix:** After drill completion, call `supabase.functions.invoke('complete-task', ...)` with the task data, similar to how it's defined in `src/lib/supabase-client.ts`. Remove the direct client-side update.

### Implementation Plan

**Files to edit:**

1. **`src/pages/Plan.tsx`** — Fix task index to use original `tasks_json` position; fetch `study_tasks` completion status and show checkmarks on completed task cards.

2. **`src/pages/TaskLauncher.tsx`** — Look up matching `study_tasks` row by `(user_id, the_date, type, skill_id)` and pass its ID as a URL param (`taskId`) to drill/quiz/lesson routes.

3. **`src/pages/DrillRunner.tsx`** — Accept optional `taskId` from URL params; skip creating a new task if provided; call `complete-task` edge function instead of direct client-side update on completion.

### Technical Details

- Plan.tsx index fix: Map filtered tasks back to their original indices via `.map()` before filtering, preserving `originalIdx`.
- TaskLauncher task lookup: Query `study_tasks` table with `eq('the_date', date).eq('type', type).eq('skill_id', skillId)` to find the matching row.
- DrillRunner completion: Use the `completeTask()` helper from `src/lib/supabase-client.ts` which already wraps the edge function call.
- Completion status: Add a `completedTasks` state in Plan.tsx populated from `study_tasks` where `status IN ('DONE', 'COMPLETED')`.

