-- Standardize staging_items section values to full names
-- This creates consistency with the skills table and simplifies queries

-- Update English variants
UPDATE staging_items SET section = 'English' WHERE section IN ('EN', 'ENGLISH', 'english');

-- Update Math variants  
UPDATE staging_items SET section = 'Math' WHERE section IN ('MA', 'MATH', 'math');

-- Update Reading variants (should already be 'Reading' but just in case)
UPDATE staging_items SET section = 'Reading' WHERE section IN ('RD', 'READING', 'reading');

-- Update Science variants
UPDATE staging_items SET section = 'Science' WHERE section IN ('SC', 'SCI', 'SCIENCE', 'science');

-- Verify the changes
-- SELECT section, COUNT(*) FROM staging_items GROUP BY section;