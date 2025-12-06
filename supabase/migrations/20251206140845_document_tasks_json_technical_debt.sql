-- =============================================================================
-- Migration: Document tasks_json technical debt
-- Purpose: Add documentation about data duplication between tasks_json and study_tasks
-- =============================================================================

-- TECHNICAL DEBT DOCUMENTATION:
-- 
-- The study_plan_days.tasks_json column duplicates data from the study_tasks table:
--
-- study_plan_days.tasks_json (JSONB):
--   [{type: 'LEARN', skill_id: '...', size: 3, estimated_mins: 12, title: '...'}]
--
-- study_tasks (normalized table):
--   user_id, the_date, type, skill_id, size, status, accuracy, median_time_ms, ...
--
-- CURRENT BEHAVIOR:
-- - generate-study-plan writes to BOTH tasks_json AND study_tasks
-- - Frontend reads from tasks_json for display (faster, pre-computed)
-- - study_tasks is used for status tracking and completion
--
-- RECOMMENDED FIX (future refactor):
-- 1. Deprecate tasks_json column
-- 2. Update frontend to query study_tasks joined with skills for display data
-- 3. Remove tasks_json from generate-study-plan writes
--
-- RISK ASSESSMENT:
-- - Medium: Data drift if writes fail to one but not the other
-- - Low: No cascade issues (JSONB is denormalized by nature)
--
-- WHY WE'RE NOT FIXING NOW:
-- - 27 references to tasks_json in frontend code
-- - Requires significant frontend refactor
-- - tasks_json provides faster reads (no JOIN needed)

COMMENT ON COLUMN study_plan_days.tasks_json IS 
  'TECHNICAL DEBT: This JSONB duplicates study_tasks table. Used for fast frontend reads. 
   See migration 20251206140845 for details. Future: migrate to study_tasks-only reads.';

-- Add index on study_tasks for the future normalized query pattern
CREATE INDEX IF NOT EXISTS idx_study_tasks_user_date_type 
  ON study_tasks(user_id, the_date, type);

-- This index will support queries like:
-- SELECT st.*, s.name as skill_name 
-- FROM study_tasks st 
-- LEFT JOIN skills s ON st.skill_id = s.id 
-- WHERE st.user_id = $1 AND st.the_date = $2
-- ORDER BY st.created_at;
