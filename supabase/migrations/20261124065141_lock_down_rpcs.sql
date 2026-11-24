-- Audit H3, H4, L5: security-definer functions were executable by anyone (PUBLIC/anon).

-- increment_error_bank: signed-in users may only write their own error bank.
-- Callers: DrillRunner.tsx (own id, user JWT), complete-task and finish-diagnostic (service role).
CREATE OR REPLACE FUNCTION public.increment_error_bank(p_user_id uuid, p_question_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'authenticated' AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  INSERT INTO error_bank (user_id, question_id, miss_count, last_missed_at)
  VALUES (p_user_id, p_question_id, 1, now())
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET
    miss_count = error_bank.miss_count + 1,
    last_missed_at = now();
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.increment_error_bank(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.increment_error_bank(uuid, text) TO authenticated, service_role;

-- Service-role only (callers: _shared/rateLimit.ts, capture-lead; cleanup has no callers).
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_webhook_events() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_webhook_events() TO service_role;

-- Role checks: signed-in only (used by RLS policies and admin edge functions with a user JWT).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Trigger functions: triggers still fire; nobody needs to call these directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_mastery_on_response() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_sim_results_daily_limit() FROM public, anon, authenticated;

-- Rollback:
--   GRANT EXECUTE ON FUNCTION <each function above> TO public, anon, authenticated;
--   CREATE OR REPLACE FUNCTION public.increment_error_bank(...) <same body without the IF guard>;
