-- Fix lesson_content table schema for CSV import
-- Change text content columns from ARRAY/jsonb to text
ALTER TABLE public.lesson_content 
  ALTER COLUMN concept_explanation TYPE text USING concept_explanation::text,
  ALTER COLUMN guided_practice TYPE text USING guided_practice::text,
  ALTER COLUMN independent_practice TYPE text USING independent_practice::text,
  ALTER COLUMN independent_practice_answers TYPE text USING independent_practice_answers::text;

-- Checkpoint quiz columns stay as ARRAY (already correct type)
-- They will store arrays like: [question, optA, optB, optC, optD, answer, explanation, difficulty]

-- Add comment to document the expected formats
COMMENT ON COLUMN public.lesson_content.objectives IS 'Pipe-separated text: "objective 1 | objective 2 | objective 3"';
COMMENT ON COLUMN public.lesson_content.concept_explanation IS 'HTML text with <h3>Core idea X:</h3> sections';
COMMENT ON COLUMN public.lesson_content.guided_practice IS 'HTML text with <h4>Worked example X</h4> sections';
COMMENT ON COLUMN public.lesson_content.independent_practice IS 'Numbered questions as plain text or HTML';
COMMENT ON COLUMN public.lesson_content.independent_practice_answers IS 'Numbered answers as plain text';
COMMENT ON COLUMN public.lesson_content.checkpoint_quiz_q1 IS 'Array format from edge function parsing pipe-delimited: question || A) opt || B) opt || C) opt || D) opt || ANSWER: B || explanation || difficulty';