-- Add diagnostic completion tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diagnostic_completed boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.diagnostic_completed IS 'Tracks whether user has completed all 4 diagnostic sections';