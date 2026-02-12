
-- Revoke anon access from both question views (prevents unauthenticated scraping)
REVOKE ALL ON public.v_questions_public FROM anon;
REVOKE ALL ON public.v_staging_items_public FROM anon;

-- v_questions_public is not used client-side, restrict to service_role only
REVOKE ALL ON public.v_questions_public FROM authenticated;

-- v_staging_items_public stays accessible to authenticated (used by drills/diagnostics)
-- but we keep the existing RLS on staging_items which already filters by form_id prefix
