-- Create safe view for packaged form content (no answer/explanation)
CREATE OR REPLACE VIEW public.v_form_section_public
WITH (security_invoker = on) AS
SELECT
  fq.form_id,
  fq.section,
  fq.ord,
  fq.question_id,
  qp.stem AS question,
  qp.choice_a,
  qp.choice_b,
  qp.choice_c,
  qp.choice_d,
  qp.choice_e,
  qp.difficulty,
  qp.skill_id,
  qp.image_url,
  qp.image_caption,
  qp.image_position,
  qp.calculator_allowed,
  qp.underlined_text,
  qp.reference_number,
  qp.position_in_passage,
  fq.passage_id,
  p.title AS passage_title,
  p.passage_text,
  p.marked_text,
  p.passage_format,
  p.passage_type,
  p.has_charts,
  p.chart_images
FROM form_questions fq
JOIN v_questions_public qp ON qp.id = fq.question_id
LEFT JOIN passages p ON p.id = fq.passage_id;

-- Grant to authenticated only
GRANT SELECT ON public.v_form_section_public TO authenticated;
REVOKE ALL ON public.v_form_section_public FROM anon;

-- Lock down the original v_form_section (has answer+explanation) to service_role only
REVOKE ALL ON public.v_form_section FROM anon;
REVOKE ALL ON public.v_form_section FROM authenticated;