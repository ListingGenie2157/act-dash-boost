-- Add new lesson content columns for comprehensive learning materials
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS common_traps text,
ADD COLUMN IF NOT EXISTS independent_practice text,
ADD COLUMN IF NOT EXISTS independent_practice_answers text,
ADD COLUMN IF NOT EXISTS checkpoint_quiz text,
ADD COLUMN IF NOT EXISTS checkpoint_quiz_answers text,
ADD COLUMN IF NOT EXISTS recap text;