-- CRITICAL: Remove public read access to staging_items table
-- This prevents unauthorized access to test questions with answers
DROP POLICY IF EXISTS "staging_public_read" ON public.staging_items;