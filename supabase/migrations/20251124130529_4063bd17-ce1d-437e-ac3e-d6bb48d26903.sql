-- ================================================================
-- ACT-Authentic Simulation Enhancements
-- Adds fields to support exact ACT test format for all sections
-- Uses IF NOT EXISTS to safely add only missing columns
-- ================================================================

-- ================================================================
-- MATH SECTION ENHANCEMENTS
-- ================================================================
-- Add 5th answer choice support (A-E format)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS choice_e text;

-- Add calculator indicator for ACT Math sections
ALTER TABLE questions ADD COLUMN IF NOT EXISTS calculator_allowed boolean DEFAULT true;

-- ================================================================
-- ENGLISH SECTION ENHANCEMENTS
-- ================================================================
-- Add inline markup support for [1], [2] reference numbers in passages
ALTER TABLE questions ADD COLUMN IF NOT EXISTS underlined_text text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS position_in_passage integer;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS reference_number integer;

-- Add passage markup storage (JSONB format for inline references)
ALTER TABLE passages ADD COLUMN IF NOT EXISTS marked_text jsonb;

-- ================================================================
-- READING SECTION ENHANCEMENTS
-- ================================================================
-- Add line numbers support (passage_type already exists)
ALTER TABLE passages ADD COLUMN IF NOT EXISTS line_numbers_enabled boolean DEFAULT true;

-- ================================================================
-- SCIENCE SECTION ENHANCEMENTS
-- ================================================================
-- Add science-specific passage formats and chart support
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passage_format_enum') THEN
    ALTER TABLE passages ADD COLUMN passage_format text CHECK (passage_format IN (
      'DATA_REPRESENTATION',
      'RESEARCH_SUMMARY', 
      'CONFLICTING_VIEWPOINTS'
    ));
  END IF;
END $$;

ALTER TABLE passages ADD COLUMN IF NOT EXISTS has_charts boolean DEFAULT false;
ALTER TABLE passages ADD COLUMN IF NOT EXISTS chart_images text[];