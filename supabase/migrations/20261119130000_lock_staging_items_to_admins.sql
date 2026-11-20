-- Follow-up to 20261119120000_question_bank_and_forms.sql.
-- APPLY ONLY AFTER the frontend that reads questions via v_staging_items_public is live.
-- Students then can no longer select staging_items directly (which exposed answer/explanation).
DROP POLICY IF EXISTS authenticated_users_read_drills_and_forms ON public.staging_items;
