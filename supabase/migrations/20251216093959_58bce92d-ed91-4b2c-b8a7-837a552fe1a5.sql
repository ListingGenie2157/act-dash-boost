-- Fix SECURITY DEFINER views - recreate as SECURITY INVOKER
-- This ensures RLS policies are respected when querying through the view

DROP VIEW IF EXISTS public.v_questions_public;
CREATE VIEW public.v_questions_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  stem,
  choice_a,
  choice_b,
  choice_c,
  choice_d,
  choice_e,
  skill_id,
  difficulty,
  time_limit_secs,
  calculator_allowed,
  image_url,
  image_caption,
  image_position,
  underlined_text,
  reference_number,
  position_in_passage,
  created_at
FROM public.questions;

DROP VIEW IF EXISTS public.v_staging_items_public;
CREATE VIEW public.v_staging_items_public
WITH (security_invoker = true)
AS
SELECT 
  staging_id,
  form_id,
  section,
  ord,
  skill_code,
  question,
  choice_a,
  choice_b,
  choice_c,
  choice_d,
  difficulty,
  passage_id,
  passage_text,
  passage_title,
  underlined_text,
  reference_number,
  position_in_passage,
  image_url,
  image_caption,
  image_position,
  calculator_allowed,
  lesson_code
FROM public.staging_items
WHERE form_id LIKE 'DR_%' 
   OR form_id LIKE 'FA_%' 
   OR form_id LIKE 'FB_%' 
   OR form_id LIKE 'FC_%'
   OR form_id LIKE 'D2%'
   OR form_id LIKE 'ONB%';

-- Re-grant access
GRANT SELECT ON public.v_questions_public TO authenticated;
GRANT SELECT ON public.v_questions_public TO anon;
GRANT SELECT ON public.v_staging_items_public TO authenticated;