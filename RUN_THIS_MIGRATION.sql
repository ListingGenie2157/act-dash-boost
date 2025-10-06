-- ================================================================
-- ONBOARDING WIZARD MIGRATION
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Step 1: Add the onboarding tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT;

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON public.profiles(onboarding_complete) 
WHERE onboarding_complete = false;

-- Step 3: Set all existing users to need onboarding
-- This ensures EVERYONE sees the wizard, even existing users
UPDATE public.profiles 
SET onboarding_complete = false, 
    onboarding_step = NULL
WHERE onboarding_complete IS NULL;

-- Step 4: Verify the migration
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN onboarding_complete = true THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN onboarding_complete = false OR onboarding_complete IS NULL THEN 1 ELSE 0 END) as needs_onboarding
FROM public.profiles;

-- ================================================================
-- ✅ MIGRATION COMPLETE!
-- 
-- What this did:
-- 1. Added onboarding_complete column (default: false)
-- 2. Added onboarding_step column (tracks progress)
-- 3. Created performance index
-- 4. Set all existing users to need onboarding
--
-- Next: Refresh your browser → You'll see the wizard!
-- ================================================================
