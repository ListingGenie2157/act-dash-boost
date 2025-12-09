-- Add missing columns to staging_items for ACT-authentic English questions
-- These columns support underlined text format and calculator settings

ALTER TABLE staging_items 
ADD COLUMN IF NOT EXISTS underlined_text TEXT,
ADD COLUMN IF NOT EXISTS reference_number INTEGER,
ADD COLUMN IF NOT EXISTS position_in_passage INTEGER,
ADD COLUMN IF NOT EXISTS calculator_allowed BOOLEAN DEFAULT true;