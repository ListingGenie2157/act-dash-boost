-- 1. Fix staging_items RLS: Drop overly permissive policy that exposes all data
DROP POLICY IF EXISTS "authenticated_users_read_staging_items" ON public.staging_items;

-- Keep the filtered policy for drills/forms (already exists)
-- Policy: authenticated_users_read_drills_and_forms allows DR_%, FA_%, FB_%, FC_% forms

-- 2. Protect answer keys in questions table
-- Create a safe view without sensitive columns for client-side use
CREATE OR REPLACE VIEW public.v_questions_public AS
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

-- Grant access to the safe view
GRANT SELECT ON public.v_questions_public TO authenticated;
GRANT SELECT ON public.v_questions_public TO anon;

-- 3. Restrict direct questions table access to admins only
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;

-- Only admins can read the full questions table (with answers)
CREATE POLICY "Only admins can read full questions"
ON public.questions
FOR SELECT
USING (public.is_admin());

-- 4. Create similar safe view for staging_items (for drill/simulation question display)
CREATE OR REPLACE VIEW public.v_staging_items_public AS
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

-- Grant access to safe staging view
GRANT SELECT ON public.v_staging_items_public TO authenticated;