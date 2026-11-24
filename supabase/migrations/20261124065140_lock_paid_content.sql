-- Audit H1, H4, M4: paid content readable only with paid access.

-- lesson_content: was readable by everyone, including logged-out visitors.
DROP POLICY IF EXISTS lesson_content_read_all ON public.lesson_content;
CREATE POLICY lesson_content_paid_read ON public.lesson_content
  FOR SELECT TO authenticated
  USING (public.has_active_access((SELECT auth.uid())));
REVOKE ALL ON public.lesson_content FROM anon;

-- passages: edge functions read these with the service role (unaffected).
DROP POLICY IF EXISTS passages_public_read ON public.passages;
CREATE POLICY passages_paid_read ON public.passages
  FOR SELECT TO authenticated
  USING (public.has_active_access((SELECT auth.uid())));
REVOKE ALL ON public.passages FROM anon;

-- v_staging_items_public: same columns and forms as before. Diagnostic and
-- onboarding forms (D2*, ONB*) stay readable by any signed-in user because the
-- diagnostic is free (DiagnosticTest.tsx); every other form needs paid access.
CREATE OR REPLACE VIEW public.v_staging_items_public AS
 SELECT staging_id, form_id, section, ord, skill_code, question,
    choice_a, choice_b, choice_c, choice_d, difficulty,
    passage_id, passage_text, passage_title, underlined_text, reference_number,
    position_in_passage, image_url, image_caption, image_position,
    calculator_allowed, lesson_code
   FROM public.staging_items
  WHERE (form_id ~~ 'DR\_%'::text OR form_id ~~ 'FA\_%'::text OR form_id ~~ 'FB\_%'::text
      OR form_id ~~ 'FC\_%'::text OR form_id ~ '^C[1-5]_'::text OR form_id ~~ 'D2%'::text OR form_id ~~ 'ONB%'::text)
    AND (form_id ~~ 'D2%'::text OR form_id ~~ 'ONB%'::text
      OR public.has_active_access((SELECT auth.uid())));
REVOKE ALL ON public.v_staging_items_public FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.v_staging_items_public FROM authenticated;
GRANT SELECT ON public.v_staging_items_public TO authenticated;

COMMENT ON VIEW public.v_staging_items_public IS
  'Intentionally runs with owner rights (security_invoker=false): staging_items is admin-only under RLS, and this view is the one student read path. It omits answer/explanation and filters rows itself: diagnostic/onboarding forms for any signed-in user, all other forms only when has_active_access(auth.uid()).';

-- get_bank_answers: drill answers only for users with paid access.
CREATE OR REPLACE FUNCTION public.get_bank_answers(p_ids bigint[])
 RETURNS TABLE(staging_id bigint, answer text, explanation text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.staging_id, s.answer, s.explanation
  FROM public.staging_items s
  WHERE auth.uid() IS NOT NULL
    AND public.has_active_access(auth.uid())
    AND s.staging_id = ANY (p_ids[1:100])
    AND s.form_id LIKE 'DR\_%';
$function$;

-- Rollback (production definitions as of 2026-11-22):
--   DROP POLICY lesson_content_paid_read ON public.lesson_content;
--   CREATE POLICY lesson_content_read_all ON public.lesson_content FOR SELECT USING (true);
--   GRANT SELECT ON public.lesson_content TO anon;
--   DROP POLICY passages_paid_read ON public.passages;
--   CREATE POLICY passages_public_read ON public.passages FOR SELECT USING (true);
--   GRANT SELECT ON public.passages TO anon;
--   CREATE OR REPLACE VIEW public.v_staging_items_public AS <same SELECT without the second AND clause>;
--   COMMENT ON VIEW public.v_staging_items_public IS NULL;
--   CREATE OR REPLACE FUNCTION public.get_bank_answers(...) <same body without the has_active_access line>;
