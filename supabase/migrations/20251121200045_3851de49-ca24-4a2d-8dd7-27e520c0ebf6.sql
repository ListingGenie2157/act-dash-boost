-- Make passage_type nullable with default value in passages table
ALTER TABLE passages 
ALTER COLUMN passage_type DROP NOT NULL,
ALTER COLUMN passage_type SET DEFAULT 'General';

-- Drop topic and passage_type columns from staging_items table
ALTER TABLE staging_items 
DROP COLUMN IF EXISTS topic,
DROP COLUMN IF EXISTS passage_type;