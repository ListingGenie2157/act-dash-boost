-- Add has_study_plan flag to profiles table to track user's onboarding path
ALTER TABLE profiles 
ADD COLUMN has_study_plan BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.has_study_plan IS 
'Indicates if user has opted into a structured study plan (diagnostic path) vs self-directed learning';