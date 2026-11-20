-- Study plan v2: target score, plan summary, per-question timing, SIM form id,
-- AP Chemistry removal (archived first), duplicate cron removal.

-- 1. Profile fields used by the planner
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_score integer CHECK (target_score BETWEEN 1 AND 36),
  ADD COLUMN IF NOT EXISTS plan_summary jsonb,
  ADD COLUMN IF NOT EXISTS plan_summary_at timestamptz;

-- Backfill target from the old free-text note ("Target composite: 28")
UPDATE public.profiles p
SET target_score = t.target
FROM (
  SELECT DISTINCT ON (user_id) user_id,
         (regexp_match(notes, 'Target composite: (\d+)'))[1]::int AS target
  FROM public.diagnostics
  WHERE notes ~ 'Target composite: \d+'
  ORDER BY user_id, completed_at DESC NULLS LAST
) t
WHERE p.id = t.user_id AND p.target_score IS NULL AND t.target BETWEEN 1 AND 36;

-- 2. Time spent per question
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS time_ms integer CHECK (time_ms >= 0);

-- 3. Practice-test tasks name their form (skill_id must reference skills)
ALTER TABLE public.study_tasks
  ADD COLUMN IF NOT EXISTS form_id text;

-- 4. Remove AP Chemistry (archive copies kept in schema "archive")
CREATE SCHEMA IF NOT EXISTS archive;
REVOKE ALL ON SCHEMA archive FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS archive.apchem_lesson_content AS
  SELECT * FROM public.lesson_content WHERE skill_code LIKE 'APCHEM%' OR skill_id LIKE 'APCHEM%';
CREATE TABLE IF NOT EXISTS archive.apchem_skills AS
  SELECT * FROM public.skills WHERE id LIKE 'APCHEM%';

DELETE FROM public.study_tasks WHERE skill_id LIKE 'APCHEM%';
DELETE FROM public.mastery WHERE skill_id LIKE 'APCHEM%';
DELETE FROM public.progress WHERE skill_id LIKE 'APCHEM%';
UPDATE public.staging_items SET lesson_code = NULL WHERE lesson_code LIKE 'APCHEM%';
DELETE FROM public.questions WHERE skill_id LIKE 'APCHEM%';
DELETE FROM public.lesson_content WHERE skill_code LIKE 'APCHEM%' OR skill_id LIKE 'APCHEM%';
UPDATE public.study_plan_days d
SET tasks_json = (
  SELECT coalesce(jsonb_agg(t), '[]'::jsonb)
  FROM jsonb_array_elements(d.tasks_json) t
  WHERE coalesce(t->>'skill_id', '') NOT LIKE 'APCHEM%'
)
WHERE d.tasks_json::text LIKE '%APCHEM%';
DELETE FROM public.skills WHERE id LIKE 'APCHEM%';

-- 5. One nightly plan job (the 2am job used the anon key; keep the cron-secret job)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'regenerate-study-plans-daily') THEN
    PERFORM cron.unschedule('regenerate-study-plans-daily');
  END IF;
END $$;
