-- Question bank + locked forms: make staging_items the single source of questions.
--
-- Model:
--   DR_*            question bank (drills, lesson quizzes, lesson practice)
--   FA_/FB_/FC_*    3 locked full simulations
--   C1_..C5_*       5 locked coach-mode exams
--   D2*, ONB        diagnostics
-- Students read questions only through v_staging_items_public (no answers).
-- Locked-form answers are graded server-side by edge functions (service role).
-- Bank answers are revealed per question via get_bank_answers().

-- Safety: the column type changes below are only safe because these tables are empty.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.attempts) OR EXISTS (SELECT 1 FROM public.review_queue) THEN
    RAISE EXCEPTION 'attempts/review_queue are not empty; migration needs a data-preserving path';
  END IF;
END $$;

-- 1. attempts / review_queue point at staging_items instead of the unused questions table
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_question_id_fkey;
ALTER TABLE public.attempts ALTER COLUMN question_id TYPE bigint USING NULL;
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES public.staging_items(staging_id) ON DELETE CASCADE;

ALTER TABLE public.review_queue DROP CONSTRAINT IF EXISTS review_queue_question_id_fkey;
ALTER TABLE public.review_queue ALTER COLUMN question_id TYPE bigint USING NULL;
ALTER TABLE public.review_queue
  ADD CONSTRAINT review_queue_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES public.staging_items(staging_id) ON DELETE CASCADE;

-- Simulation responses store staging_id (as text); existing 27 rows keep their uuid text.
ALTER TABLE public.responses ALTER COLUMN question_id TYPE text USING question_id::text;

-- 2. Register every form id that has (or will have) questions
INSERT INTO public.forms (id, label, is_active) VALUES
  ('D2SC',  'Diagnostic – Science', true),
  ('DR_EN', 'Question Bank – English', true),
  ('DR_MA', 'Question Bank – Math', true),
  ('DR_RD', 'Question Bank – Reading', true),
  ('DR_SC', 'Question Bank – Science', true),
  ('FA_SC', 'Full ACT Form A – Science', true),
  ('FB_SC', 'Full ACT Form B – Science', true),
  ('FC_SC', 'Full ACT Form C – Science', true),
  ('FD_EN', 'FD_EN (unassigned)', false),
  ('FD_MA', 'FD_MA (unassigned)', false),
  ('FE_EN', 'FE_EN (unassigned)', false),
  ('FE_MA', 'FE_MA (unassigned)', false),
  ('FE_SC', 'FE_SC (unassigned)', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forms (id, label, is_active)
SELECT 'C' || n || '_' || s, 'Coach Exam ' || n || ' – ' || name, true
FROM generate_series(1, 5) AS n
CROSS JOIN (VALUES ('EN','English'), ('MA','Math'), ('RD','Reading'), ('SC','Science')) AS sec(s, name)
ON CONFLICT (id) DO NOTHING;

-- 3. The public view becomes the student read path. It runs as its owner so RLS on
-- staging_items does not hide diagnostic/coach rows; it never exposes answers.
-- (Removing students' direct staging_items access is a follow-up migration, applied
-- once the frontend no longer reads staging_items directly.)
CREATE OR REPLACE VIEW public.v_staging_items_public
WITH (security_invoker = false) AS
SELECT staging_id, form_id, section, ord, skill_code, question,
       choice_a, choice_b, choice_c, choice_d, difficulty,
       passage_id, passage_text, passage_title, underlined_text,
       reference_number, position_in_passage, image_url, image_caption,
       image_position, calculator_allowed, lesson_code
FROM public.staging_items
WHERE form_id LIKE 'DR\_%'
   OR form_id LIKE 'FA\_%' OR form_id LIKE 'FB\_%' OR form_id LIKE 'FC\_%'
   OR form_id ~ '^C[1-5]_'
   OR form_id LIKE 'D2%'
   OR form_id LIKE 'ONB%';

REVOKE ALL ON public.v_staging_items_public FROM anon, public;
GRANT SELECT ON public.v_staging_items_public TO authenticated, service_role;

-- 4. Reveal answers for question-bank items only (after the student answers)
CREATE OR REPLACE FUNCTION public.get_bank_answers(p_ids bigint[])
RETURNS TABLE (staging_id bigint, answer text, explanation text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.staging_id, s.answer, s.explanation
  FROM public.staging_items s
  WHERE auth.uid() IS NOT NULL
    AND s.staging_id = ANY (p_ids[1:100])
    AND s.form_id LIKE 'DR\_%';
$$;

REVOKE ALL ON FUNCTION public.get_bank_answers(bigint[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_bank_answers(bigint[]) TO authenticated;
