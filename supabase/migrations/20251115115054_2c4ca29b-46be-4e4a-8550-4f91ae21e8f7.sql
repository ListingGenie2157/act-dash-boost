-- Add plan_mode column to profiles (null = not selected, 'PERSONALIZED' or 'SELF_PACED')
ALTER TABLE profiles 
ADD COLUMN plan_mode text CHECK (plan_mode IN ('PERSONALIZED', 'SELF_PACED'));

-- Add sim_preferred_dow column to profiles (0=Sunday through 6=Saturday)
ALTER TABLE profiles 
ADD COLUMN sim_preferred_dow integer CHECK (sim_preferred_dow >= 0 AND sim_preferred_dow <= 6);

COMMENT ON COLUMN profiles.plan_mode IS 'Study plan mode: PERSONALIZED (3-2-1 week SIMs) or SELF_PACED';
COMMENT ON COLUMN profiles.sim_preferred_dow IS 'Preferred day of week for SIM tests (0=Sunday, 6=Saturday)';