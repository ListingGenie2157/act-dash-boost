CREATE TABLE public.stripe_webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- No direct access needed — only service_role writes to this table
CREATE POLICY "No direct access to stripe_webhook_events"
  ON public.stripe_webhook_events FOR SELECT USING (false);

-- Auto-cleanup: delete events older than 7 days to keep table small
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM stripe_webhook_events WHERE received_at < now() - interval '7 days';
$$;