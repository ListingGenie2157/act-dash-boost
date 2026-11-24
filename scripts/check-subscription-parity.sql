-- Read-only. Run before applying 20261123090100_lock_paid_content to production.
-- Compare "would_have_access" (excluding admins) with Stripe Dashboard ->
-- Subscriptions filtered to Active + Trialing. If Stripe shows more, those
-- customers have no up-to-date local row and would lose access: stop and sync first.
SELECT s.status,
       s.current_period_end,
       s.cancel_at_period_end,
       (s.status IN ('active','trialing') AND s.current_period_end > now()) AS would_have_access
FROM public.subscriptions s
ORDER BY s.current_period_end DESC NULLS LAST;

SELECT
  (SELECT count(*) FROM public.subscriptions
    WHERE status IN ('active','trialing') AND current_period_end > now()) AS paying_with_access,
  (SELECT count(*) FROM public.user_roles WHERE role = 'admin')          AS admins;
