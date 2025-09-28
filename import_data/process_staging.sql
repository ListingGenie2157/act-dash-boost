-- Process staging_items data into final schema
-- This follows the process outlined in your original spec

BEGIN;

-- 1) Create forms that don't exist yet
INSERT INTO public.forms (id, label, is_active)
SELECT DISTINCT
  s.form_id,
  s.form_id,  -- Use form_id as label for now
  true
FROM public.staging_items s
WHERE NOT EXISTS (
  SELECT 1 FROM public.forms WHERE id = s.form_id
);

-- 2) Ensure skills exist from staging data
-- Map difficulty text to numbers
WITH normalized AS (
  SELECT
    s.*,
    CASE s.difficulty
      WHEN 'Easy' THEN 2
      WHEN 'Medium' THEN 3
      WHEN 'Hard' THEN 4
      ELSE 3
    END::smallint AS diff_num,
    CASE s.section
      WHEN 'EN' THEN 'English'
      WHEN 'MATH' THEN 'Math'
      WHEN 'RD' THEN 'Reading'
      WHEN 'SCI' THEN 'Science'
    END AS subject_norm
  FROM public.staging_items s
)

-- Create skills that don't exist yet
INSERT INTO public.skills (subject, cluster, name, description, order_index)
SELECT DISTINCT
  n.subject_norm,
  COALESCE(n.topic, n.skill_code),
  n.skill_code,
  n.topic,
  ROW_NUMBER() OVER (PARTITION BY n.subject_norm ORDER BY n.skill_code)
FROM normalized n
WHERE NOT EXISTS (
  SELECT 1 FROM public.skills
  WHERE subject = n.subject_norm
  AND name = n.skill_code
);

-- 3) Upsert passages (RD/SCI only)
INSERT INTO public.passages (id, form_id, section, passage_type, title, passage_text)
SELECT DISTINCT ON (s.passage_id)
  s.passage_id,
  s.form_id,
  s.section,
  COALESCE(s.passage_type, 'General'),
  COALESCE(s.passage_title, s.passage_id),
  s.passage_text
FROM public.staging_items s
WHERE s.section IN ('RD','SCI')
  AND s.passage_id IS NOT NULL
  AND s.passage_text IS NOT NULL
  AND s.passage_text != ''
ON CONFLICT (id) DO NOTHING;

-- 4) Insert questions by matching staging data to skills
WITH normalized AS (
  SELECT
    s.*,
    CASE s.difficulty
      WHEN 'Easy' THEN 2
      WHEN 'Medium' THEN 3
      WHEN 'Hard' THEN 4
      ELSE 3
    END::smallint AS diff_num,
    CASE s.section
      WHEN 'EN' THEN 'English'
      WHEN 'MATH' THEN 'Math'
      WHEN 'RD' THEN 'Reading'
      WHEN 'SCI' THEN 'Science'
    END AS subject_norm
  FROM public.staging_items s
)

INSERT INTO public.questions (skill_id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, difficulty)
SELECT DISTINCT ON (sk.id, n.question, n.choice_a, n.choice_b, n.choice_c, n.choice_d, n.answer)
  sk.id,
  n.question,
  n.choice_a,
  n.choice_b,
  n.choice_c,
  n.choice_d,
  n.answer,
  n.explanation,
  n.diff_num
FROM normalized n
JOIN public.skills sk ON (sk.subject = n.subject_norm AND sk.name = n.skill_code)
ON CONFLICT (stem, choice_a, choice_b, choice_c, choice_d, answer) DO NOTHING;

-- 5) Map into form_questions by joining staging data to inserted questions
WITH normalized AS (
  SELECT
    s.*,
    CASE s.section
      WHEN 'EN' THEN 'English'
      WHEN 'MATH' THEN 'Math'
      WHEN 'RD' THEN 'Reading'
      WHEN 'SCI' THEN 'Science'
    END AS subject_norm
  FROM public.staging_items s
)

INSERT INTO public.form_questions (form_id, section, ord, question_id, passage_id)
SELECT DISTINCT ON (n.form_id, n.section, n.ord)
  n.form_id,
  n.section,
  n.ord,
  q.id,
  CASE WHEN n.passage_id IS NOT NULL AND n.passage_id != '' THEN n.passage_id ELSE NULL END
FROM normalized n
JOIN public.skills sk ON (sk.subject = n.subject_norm AND sk.name = n.skill_code)
JOIN public.questions q ON (
  q.skill_id = sk.id
  AND q.stem = n.question
  AND q.choice_a = n.choice_a
  AND q.choice_b = n.choice_b
  AND q.choice_c = n.choice_c
  AND q.choice_d = n.choice_d
  AND q.answer = n.answer
)
ON CONFLICT (form_id, section, ord) DO NOTHING;

-- 6) Show summary of what was processed
SELECT
  'Skills created/updated' as type,
  COUNT(DISTINCT skill_code) as count,
  string_agg(DISTINCT section, ', ') as sections
FROM public.staging_items
UNION ALL
SELECT
  'Questions processed' as type,
  COUNT(*) as count,
  string_agg(DISTINCT section, ', ') as sections
FROM public.staging_items
UNION ALL
SELECT
  'Passages processed' as type,
  COUNT(DISTINCT passage_id) as count,
  string_agg(DISTINCT section, ', ') as sections
FROM public.staging_items
WHERE passage_id IS NOT NULL AND passage_id != ''
UNION ALL
SELECT
  'Forms processed' as type,
  COUNT(DISTINCT form_id) as count,
  string_agg(DISTINCT form_id, ', ') as sections
FROM public.staging_items;

COMMIT;