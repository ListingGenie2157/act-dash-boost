-- Restore read access to staging_items for authenticated users taking diagnostics
-- This allows users to fetch questions for diagnostic tests and drills
CREATE POLICY "authenticated_users_read_staging_items"
ON public.staging_items
FOR SELECT
TO authenticated
USING (true);