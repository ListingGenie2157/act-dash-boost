-- Enable RLS on rate_limits table (internal table, no user access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate_limits (used by edge functions)
-- No policies needed - defaults to deny all for non-service-role

-- Enable RLS on _orphan_cleanup_log (internal maintenance table)
ALTER TABLE public._orphan_cleanup_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read cleanup logs
CREATE POLICY "Only admins can read cleanup logs"
ON public._orphan_cleanup_log
FOR SELECT
USING (public.is_admin());