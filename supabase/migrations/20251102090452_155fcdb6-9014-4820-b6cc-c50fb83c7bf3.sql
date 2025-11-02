-- Problem 3: Add skill_id column to lesson_content to map to skills table
-- This fixes the mismatch between text skill_code and UUID skill_id

ALTER TABLE lesson_content 
ADD COLUMN skill_id TEXT REFERENCES skills(id);

COMMENT ON COLUMN lesson_content.skill_id IS 'References skills.id to link lesson content to skill definitions';

-- Note: Data migration to populate skill_id from skill_code will need to be done
-- after verifying the mapping between skill_code and skills.id