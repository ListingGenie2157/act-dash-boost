-- ACT Content & Scoring Integrity Validation Queries
-- Run these queries to check data quality issues identified in the review

-- ============================================================================
-- 1. QUESTION DATA CONSISTENCY
-- ============================================================================

-- 1.1: Questions with invalid answer letters (not A, B, C, D, or E)
SELECT 
  id, 
  stem, 
  answer,
  CASE 
    WHEN answer NOT IN ('A', 'B', 'C', 'D', 'E') THEN 'INVALID'
    ELSE 'VALID'
  END as status
FROM questions
WHERE answer NOT IN ('A', 'B', 'C', 'D', 'E')
ORDER BY id;

-- 1.2: Questions missing explanations
SELECT 
  id, 
  stem, 
  answer,
  CASE 
    WHEN explanation IS NULL OR explanation = '' THEN 'MISSING'
    WHEN LENGTH(explanation) < 10 THEN 'TOO_SHORT'
    ELSE 'OK'
  END as explanation_status
FROM questions
WHERE explanation IS NULL OR explanation = '' OR LENGTH(explanation) < 10
ORDER BY id;

-- 1.3: Questions with truncated explanations (ending with ... or incomplete)
SELECT 
  id, 
  stem, 
  LEFT(explanation, 50) as explanation_preview,
  CASE 
    WHEN explanation LIKE '%...' THEN 'TRUNCATED'
    WHEN explanation NOT LIKE '%.' AND explanation NOT LIKE '%!' AND explanation NOT LIKE '%?' THEN 'INCOMPLETE'
    ELSE 'OK'
  END as truncation_status
FROM questions
WHERE explanation IS NOT NULL 
  AND (explanation LIKE '%...' 
    OR (explanation NOT LIKE '%.' AND explanation NOT LIKE '%!' AND explanation NOT LIKE '%?'))
LIMIT 50;

-- 1.4: Section and skill mismatch (question's skill subject doesn't match form section)
SELECT 
  q.id as question_id,
  q.stem,
  s.subject as skill_subject,
  fq.section as form_section,
  CASE 
    WHEN s.subject != fq.section THEN 'MISMATCH'
    ELSE 'OK'
  END as alignment_status
FROM questions q
JOIN skills s ON q.skill_id = s.id
JOIN form_questions fq ON q.id = fq.question_id
WHERE s.subject != fq.section
ORDER BY fq.section, s.subject;

-- 1.5: Questions with potentially broken math notation
SELECT 
  id,
  stem,
  CASE 
    WHEN stem LIKE '%$%' AND (LENGTH(stem) - LENGTH(REPLACE(stem, '$', ''))) % 2 != 0 THEN 'UNCLOSED_MATH'
    WHEN stem LIKE '%\\(%' AND stem NOT LIKE '%\\)%' THEN 'UNCLOSED_LATEX'
    WHEN stem LIKE '%\\[%' AND stem NOT LIKE '%\\]%' THEN 'UNCLOSED_LATEX_DISPLAY'
    ELSE 'OK'
  END as math_status
FROM questions
WHERE (stem LIKE '%$%' OR stem LIKE '%\\(%' OR stem LIKE '%\\[%')
  AND (
    (stem LIKE '%$%' AND (LENGTH(stem) - LENGTH(REPLACE(stem, '$', ''))) % 2 != 0)
    OR (stem LIKE '%\\(%' AND stem NOT LIKE '%\\)%')
    OR (stem LIKE '%\\[%' AND stem NOT LIKE '%\\]%')
  )
LIMIT 50;

-- ============================================================================
-- 2. ANSWER RANDOMNESS DISTRIBUTION
-- ============================================================================

-- 2.1: Answer distribution by section
SELECT 
  fq.section,
  q.answer,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY fq.section), 2) as percentage
FROM questions q
JOIN form_questions fq ON q.id = fq.question_id
WHERE q.answer IN ('A', 'B', 'C', 'D')
GROUP BY fq.section, q.answer
ORDER BY fq.section, q.answer;

-- 2.2: Sections with skewed answer distribution (>30% or <20% for any answer)
WITH distribution AS (
  SELECT 
    fq.section,
    q.answer,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY fq.section), 2) as percentage
  FROM questions q
  JOIN form_questions fq ON q.id = fq.question_id
  WHERE q.answer IN ('A', 'B', 'C', 'D')
  GROUP BY fq.section, q.answer
)
SELECT 
  section,
  answer,
  percentage,
  CASE 
    WHEN percentage > 30 THEN 'TOO_HIGH'
    WHEN percentage < 20 THEN 'TOO_LOW'
    ELSE 'OK'
  END as status
FROM distribution
WHERE percentage > 30 OR percentage < 20
ORDER BY section, percentage DESC;

-- 2.3: Answer distribution by form
SELECT 
  fq.form_id,
  fq.section,
  q.answer,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY fq.form_id, fq.section), 2) as percentage
FROM questions q
JOIN form_questions fq ON q.id = fq.question_id
WHERE q.answer IN ('A', 'B', 'C', 'D')
GROUP BY fq.form_id, fq.section, q.answer
ORDER BY fq.form_id, fq.section, q.answer;

-- ============================================================================
-- 3. SCORING CORRECTNESS
-- ============================================================================

-- 3.1: Verify raw score calculation (should match correct count)
SELECT 
  s.id as session_id,
  s.section,
  COUNT(r.id) as total_responses,
  COUNT(CASE WHEN r.correct THEN 1 END) as correct_count,
  COUNT(CASE WHEN r.correct THEN 1 END) as calculated_raw_score
FROM sessions s
LEFT JOIN responses r ON s.id = r.session_id
WHERE s.ended_at IS NOT NULL
GROUP BY s.id, s.section
ORDER BY s.created_at DESC
LIMIT 20;

-- 3.2: Check for responses with mismatched correct flag
SELECT 
  r.id,
  r.session_id,
  r.question_id,
  r.selected,
  q.answer as correct_answer,
  r.correct as marked_correct,
  CASE 
    WHEN r.selected = q.answer AND r.correct = false THEN 'FALSE_NEGATIVE'
    WHEN r.selected != q.answer AND r.correct = true THEN 'FALSE_POSITIVE'
    ELSE 'OK'
  END as validation_status
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE (r.selected = q.answer AND r.correct = false)
   OR (r.selected != q.answer AND r.correct = true)
LIMIT 50;

-- ============================================================================
-- 4. STUDY PLAN VS CONTENT ALIGNMENT
-- ============================================================================

-- 4.1: Study tasks with skill_id that have no questions
SELECT 
  st.id as task_id,
  st.the_date,
  st.type,
  st.skill_id,
  s.name as skill_name,
  s.code as skill_code,
  COUNT(q.id) as question_count,
  CASE 
    WHEN COUNT(q.id) = 0 THEN 'NO_QUESTIONS'
    WHEN COUNT(q.id) < st.size THEN 'INSUFFICIENT'
    ELSE 'OK'
  END as status
FROM study_tasks st
LEFT JOIN skills s ON st.skill_id = s.id
LEFT JOIN questions q ON st.skill_id = q.skill_id
WHERE st.type = 'DRILL' 
  AND st.status IN ('PENDING', 'STARTED')
  AND st.skill_id IS NOT NULL
GROUP BY st.id, st.the_date, st.type, st.skill_id, s.name, s.code, st.size
HAVING COUNT(q.id) = 0 OR COUNT(q.id) < st.size
ORDER BY st.the_date, st.skill_id;

-- 4.2: Study plan days with zero tasks
SELECT 
  the_date,
  user_id,
  jsonb_array_length(tasks_json) as task_count,
  CASE 
    WHEN jsonb_array_length(tasks_json) = 0 THEN 'EMPTY'
    ELSE 'OK'
  END as status
FROM study_plan_days
WHERE jsonb_array_length(tasks_json) = 0
ORDER BY the_date DESC;

-- 4.3: Skill code mismatch between skills and staging_items
SELECT 
  s.id as skill_id,
  s.code as skill_code,
  s.name as skill_name,
  si.skill_code as staging_skill_code,
  COUNT(DISTINCT si.staging_id) as staging_count,
  CASE 
    WHEN s.code IS NULL THEN 'SKILL_CODE_NULL'
    WHEN s.code != si.skill_code THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM skills s
JOIN staging_items si ON s.code = si.skill_code
WHERE s.code IS NULL OR s.code != si.skill_code
GROUP BY s.id, s.code, s.name, si.skill_code
ORDER BY staging_count DESC
LIMIT 50;

-- 4.4: Study tasks referencing skills that don't exist
SELECT 
  st.id as task_id,
  st.the_date,
  st.type,
  st.skill_id,
  CASE 
    WHEN s.id IS NULL THEN 'ORPHANED_SKILL_ID'
    ELSE 'OK'
  END as status
FROM study_tasks st
LEFT JOIN skills s ON st.skill_id = s.id
WHERE st.skill_id IS NOT NULL AND s.id IS NULL
ORDER BY st.the_date DESC;

-- 4.5: Verify drill tasks can actually pull questions for their skill
SELECT 
  st.id as task_id,
  st.the_date,
  st.skill_id,
  s.name as skill_name,
  s.code as skill_code,
  COUNT(DISTINCT q.id) as available_questions,
  st.size as required_size,
  CASE 
    WHEN COUNT(DISTINCT q.id) >= st.size THEN 'SUFFICIENT'
    WHEN COUNT(DISTINCT q.id) > 0 THEN 'INSUFFICIENT'
    ELSE 'NONE'
  END as question_availability
FROM study_tasks st
JOIN skills s ON st.skill_id = s.id
LEFT JOIN questions q ON st.skill_id = q.skill_id
WHERE st.type = 'DRILL' 
  AND st.status IN ('PENDING', 'STARTED')
GROUP BY st.id, st.the_date, st.skill_id, s.name, s.code, st.size
HAVING COUNT(DISTINCT q.id) < st.size
ORDER BY st.the_date, available_questions;

-- ============================================================================
-- 5. TIMER AND TEST FLOW
-- ============================================================================

-- 5.1: Sessions that ended but have responses submitted after end time
SELECT 
  s.id as session_id,
  s.section,
  s.started_at,
  s.ended_at,
  s.time_limit_sec,
  MAX(r.submitted_at) as last_response_time,
  CASE 
    WHEN MAX(r.submitted_at) > s.ended_at THEN 'RESPONSES_AFTER_END'
    ELSE 'OK'
  END as status
FROM sessions s
JOIN responses r ON s.id = r.session_id
WHERE s.ended_at IS NOT NULL
GROUP BY s.id, s.section, s.started_at, s.ended_at, s.time_limit_sec
HAVING MAX(r.submitted_at) > s.ended_at
ORDER BY s.ended_at DESC
LIMIT 20;

-- 5.2: Sessions with time limit but no end time (possibly stuck)
SELECT 
  id as session_id,
  section,
  started_at,
  time_limit_sec,
  EXTRACT(EPOCH FROM (NOW() - started_at)) as elapsed_seconds,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - started_at)) > time_limit_sec * 1.1 THEN 'EXPIRED_NOT_ENDED'
    ELSE 'OK'
  END as status
FROM sessions
WHERE ended_at IS NULL
  AND started_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (NOW() - started_at)) > time_limit_sec * 1.1
ORDER BY started_at DESC
LIMIT 20;

-- ============================================================================
-- SUMMARY QUERIES
-- ============================================================================

-- Summary: Count of issues by category
SELECT 
  'Invalid Answer Letters' as issue_type,
  COUNT(*) as count
FROM questions
WHERE answer NOT IN ('A', 'B', 'C', 'D', 'E')

UNION ALL

SELECT 
  'Missing Explanations' as issue_type,
  COUNT(*) as count
FROM questions
WHERE explanation IS NULL OR explanation = ''

UNION ALL

SELECT 
  'Section-Skill Mismatch' as issue_type,
  COUNT(*) as count
FROM questions q
JOIN skills s ON q.skill_id = s.id
JOIN form_questions fq ON q.id = fq.question_id
WHERE s.subject != fq.section

UNION ALL

SELECT 
  'Orphaned Study Tasks' as issue_type,
  COUNT(*) as count
FROM study_tasks st
LEFT JOIN skills s ON st.skill_id = s.id
WHERE st.skill_id IS NOT NULL AND s.id IS NULL

UNION ALL

SELECT 
  'Empty Plan Days' as issue_type,
  COUNT(*) as count
FROM study_plan_days
WHERE jsonb_array_length(tasks_json) = 0

ORDER BY count DESC;
