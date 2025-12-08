-- =====================================================
-- Fix: Restore read access to staging_items
-- =====================================================
-- This is required for drills and diagnostic tests to work.
-- The policy was accidentally removed in migration 20251126230050.
--
-- Background:
-- - staging_items table is used for drills (DR_*) and diagnostics (D2*)
-- - form_questions table is used for simulations (FA_*, FB_*, FC_*)
-- - Without this policy, authenticated users cannot read from staging_items
--
-- Note: If drills/diagnostics are still empty after applying this migration,
-- you may need to import data from: public/import-data/science_content_import.sql
-- =====================================================

CREATE POLICY "authenticated_users_read_staging_items"
ON public.staging_items
FOR SELECT
TO authenticated
USING (true);
