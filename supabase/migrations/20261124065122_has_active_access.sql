-- Audit H1/H2: single source of truth for "may this user use paid features".
-- True for admins, or a subscription that is active/trialing and not past its period end.
-- cancel_at_period_end keeps access until current_period_end.
CREATE OR REPLACE FUNCTION public.has_active_access(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_user IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = p_user AND r.role = 'admin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = p_user
        AND s.status IN ('active', 'trialing')
        AND s.current_period_end > now()
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_access(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_active_access(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.has_active_access(uuid) IS
  'Paid access: admin role, or subscription active/trialing with current_period_end in the future. Used by RLS, v_staging_items_public, get_bank_answers and edge functions.';

-- Rollback:
--   DROP FUNCTION public.has_active_access(uuid);
--   (only after 20261124065140_lock_paid_content is rolled back; it depends on this function)
