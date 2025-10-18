-- Add checkpoint_quiz_questions column to lesson_content table
ALTER TABLE lesson_content 
ADD COLUMN checkpoint_quiz_questions jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN lesson_content.checkpoint_quiz_questions IS 'Array of structured checkpoint quiz questions with format: {id, question, options[], correctAnswer, explanation, difficulty}';