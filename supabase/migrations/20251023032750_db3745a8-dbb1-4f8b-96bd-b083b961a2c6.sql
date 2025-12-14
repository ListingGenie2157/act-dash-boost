-- Fix checkpoint quiz question field names to match QuizComponent expectations
-- Transform: question_id → id, prompt → question, answer_key → correctAnswer

UPDATE lesson_content
SET checkpoint_quiz_questions = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', elem->>'question_id',
      'question', elem->>'prompt',
      'options', elem->'options',
      'correctAnswer', elem->>'answer_key',
      'explanation', elem->>'explanation',
      'difficulty', elem->>'difficulty'
    )
  )
  FROM jsonb_array_elements(checkpoint_quiz_questions) AS elem
)
WHERE skill_code IN ('E1.A', 'E1.B', 'E2.G', 'E3.A', 'E3.C')
  AND checkpoint_quiz_questions IS NOT NULL
  AND jsonb_array_length(checkpoint_quiz_questions) > 0;