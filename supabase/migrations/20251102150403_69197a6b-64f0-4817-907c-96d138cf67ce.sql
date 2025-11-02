-- Phase 3: Merge user_profiles into profiles and drop unused tables

-- Add legal consent fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN age_verified BOOLEAN DEFAULT false,
  ADD COLUMN tos_accepted BOOLEAN DEFAULT false,
  ADD COLUMN privacy_accepted BOOLEAN DEFAULT false;

-- Migrate existing data from user_profiles to profiles
UPDATE profiles p
SET 
  age_verified = COALESCE(up.age_verified, false),
  tos_accepted = COALESCE(up.tos_accepted, false),
  privacy_accepted = COALESCE(up.privacy_accepted, false)
FROM user_profiles up
WHERE p.id = up.user_id;

-- Drop the user_profiles table (now redundant)
DROP TABLE IF EXISTS user_profiles;

-- Drop the lesson_schedule table (no longer used)
DROP TABLE IF EXISTS lesson_schedule;