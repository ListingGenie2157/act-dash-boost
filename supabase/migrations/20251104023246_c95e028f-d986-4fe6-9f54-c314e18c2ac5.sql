-- Add code column to skills table for human-readable skill codes
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS code text;

-- Create unique index on code when not null
CREATE UNIQUE INDEX IF NOT EXISTS skills_code_unq ON public.skills(code) WHERE code IS NOT NULL;

-- Backfill code from id where id looks like a human code (not UUID)
UPDATE public.skills 
SET code = id 
WHERE code IS NULL 
  AND id ~ '^[A-Z0-9]+(\\.[A-Z0-9]+)*$';

-- Add comment for documentation
COMMENT ON COLUMN public.skills.code IS 'Human-readable skill code (e.g., APCHEM4.A, E1.A). This allows skills.id to be UUID while preserving user-facing codes.';