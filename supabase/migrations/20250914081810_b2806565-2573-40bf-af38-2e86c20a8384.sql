-- Process staging data into existing schema

-- First ensure skills exist (create new skills with UUID ids)
INSERT INTO public.skills (subject, name, cluster, description, order_index)
SELECT DISTINCT 
  CASE s.section
    WHEN 'EN' THEN 'English'
    WHEN 'MATH' THEN 'Math'  
    WHEN 'RD' THEN 'Reading'
    WHEN 'SCI' THEN 'Science'
  END as subject_norm,
  s.skill_code,
  CASE s.section
    WHEN 'EN' THEN 'English'
    WHEN 'MATH' THEN 'Math'
    WHEN 'RD' THEN 'Reading' 
    WHEN 'SCI' THEN 'Science'
  END || ' Skills' as cluster,
  'Skill: ' || s.skill_code as description,
  1000 + row_number() over (order by s.skill_code) as order_index
FROM public.staging_items s
WHERE NOT EXISTS (
  SELECT 1 FROM public.skills sk WHERE sk.name = s.skill_code
);

-- Upsert passages (RD/SCI only)
INSERT INTO public.passages (id, form_id, section, passage_type, title, passage_text)
SELECT DISTINCT 
  s.passage_id, 
  s.form_id, 
  s.section, 
  s.passage_type, 
  COALESCE(s.passage_title, s.passage_id), 
  s.passage_text
FROM public.staging_items s
WHERE s.section IN ('RD','SCI') AND s.passage_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  form_id = EXCLUDED.form_id,
  section = EXCLUDED.section,
  passage_type = EXCLUDED.passage_type,
  title = EXCLUDED.title,
  passage_text = EXCLUDED.passage_text;

-- Insert questions (joining with skills by name to get UUID)
INSERT INTO public.questions (skill_id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, difficulty)
SELECT 
  sk.id,
  s.question,
  s.choice_a,
  s.choice_b, 
  s.choice_c,
  s.choice_d,
  s.answer,
  s.explanation,
  CASE s.difficulty
    WHEN 'Easy' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Hard' THEN 4
    ELSE 3
  END::smallint
FROM public.staging_items s
JOIN public.skills sk ON sk.name = s.skill_code
ON CONFLICT DO NOTHING;

-- Map into form_questions by joining on content
INSERT INTO public.form_questions (form_id, section, ord, question_id, passage_id)
SELECT 
  s.form_id,
  s.section, 
  s.ord,
  q.id,
  s.passage_id
FROM public.staging_items s
JOIN public.skills sk ON sk.name = s.skill_code
JOIN public.questions q ON q.skill_id = sk.id 
  AND q.stem = s.question
  AND q.choice_a = s.choice_a
  AND q.choice_b = s.choice_b
  AND q.choice_c = s.choice_c
  AND q.choice_d = s.choice_d
  AND q.answer = s.answer
ON CONFLICT (form_id, section, ord) DO UPDATE
  SET question_id = EXCLUDED.question_id,
      passage_id = EXCLUDED.passage_id;

-- Add unique index to prevent duplicate questions by content
CREATE UNIQUE INDEX IF NOT EXISTS questions_unique_content_idx
ON public.questions (stem, choice_a, choice_b, choice_c, choice_d, answer);