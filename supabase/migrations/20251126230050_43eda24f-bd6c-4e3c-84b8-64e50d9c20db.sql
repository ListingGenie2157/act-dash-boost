-- Fix staging_items security exposure - remove public read policy
DROP POLICY IF EXISTS "authenticated_users_read_staging_items" ON staging_items;

-- Add coached column to sessions table for lockout tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS coached BOOLEAN DEFAULT FALSE NOT NULL;

-- Fix v_form_section view to use security_invoker (prevents RLS bypass)
DROP VIEW IF EXISTS v_form_section;
CREATE VIEW v_form_section
WITH (security_invoker=on)
AS
SELECT 
  fq.form_id,
  fq.section,
  fq.ord,
  fq.question_id,
  q.stem as question,
  q.choice_a,
  q.choice_b,
  q.choice_c,
  q.choice_d,
  q.answer,
  q.explanation,
  fq.passage_id,
  p.title as passage_title,
  p.passage_text
FROM form_questions fq
JOIN questions q ON q.id = fq.question_id
LEFT JOIN passages p ON p.id = fq.passage_id;

-- Add index on sessions for lockout queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_form_section ON sessions(user_id, form_id, section, coached);