-- RLS policies for 'leads' table
-- leads are inserted by the capture-lead edge function (unauthenticated) using service role
-- No user should be able to read/modify leads from the client
-- Only admins can read leads

CREATE POLICY "Admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow inserts from service role only (no policy needed for anon/authenticated insert)
-- The capture-lead function uses the service role key, so it bypasses RLS

-- RLS policies for 'rate_limits' table
-- rate_limits is managed entirely by the check_rate_limit() SECURITY DEFINER function
-- No client should directly access this table

CREATE POLICY "No direct access to rate_limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (false);
