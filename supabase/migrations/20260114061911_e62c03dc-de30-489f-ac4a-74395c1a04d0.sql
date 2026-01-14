-- Fix the overly permissive RLS policy - remove it since service role bypasses RLS anyway
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Add a more secure policy for edge functions using service role (which bypasses RLS)
-- Only allow inserts/updates via edge functions (service role bypasses RLS automatically)
-- No additional policy needed - users can only SELECT their own subscription