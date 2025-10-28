-- Add unique constraint on skill_code (required for upsert to work)
ALTER TABLE lesson_content 
ADD CONSTRAINT lesson_content_skill_code_key UNIQUE (skill_code);

-- Add foreign key to skills table for data integrity
ALTER TABLE lesson_content 
ADD CONSTRAINT lesson_content_skill_code_fkey 
FOREIGN KEY (skill_code) REFERENCES skills(id);