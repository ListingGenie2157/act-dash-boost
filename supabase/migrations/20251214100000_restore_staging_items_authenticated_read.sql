-- Restore authenticated read access to staging_items for core user flows.
-- NOTE: This does not prevent users from reading answer keys. Long-term fix is to serve
-- question content via a view/function that excludes answers and explanations.

ALTER TABLE public.staging_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_users_read_staging_items" ON public.staging_items;

CREATE POLICY "authenticated_users_read_staging_items"
ON public.staging_items
FOR SELECT
TO authenticated
USING (true);

