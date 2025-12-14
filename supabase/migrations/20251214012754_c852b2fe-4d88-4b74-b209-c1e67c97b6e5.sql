-- Add ACT Enhanced format preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS test_format TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS administration TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS science_required BOOLEAN DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.test_format IS 'digital or paper - determines UI and coaching tips';
COMMENT ON COLUMN public.profiles.administration IS 'school_day or national - affects science requirements';
COMMENT ON COLUMN public.profiles.science_required IS 'Whether science section is required for this student';