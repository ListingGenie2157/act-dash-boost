-- 1) Lead capture table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT,
  bucket TEXT,
  test_date TEXT,
  beta_interest BOOLEAN NOT NULL DEFAULT false,
  source TEXT DEFAULT 'landing',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  page_path TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) De-dupe index: one row per email per source
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_source_unique 
  ON public.leads (lower(email), COALESCE(source, ''));

-- 3) Query indexes
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at);
CREATE INDEX IF NOT EXISTS leads_role_idx ON public.leads (role);
CREATE INDEX IF NOT EXISTS leads_bucket_idx ON public.leads (bucket);
CREATE INDEX IF NOT EXISTS leads_ip_hash_idx ON public.leads (ip_hash, created_at);

-- 4) RLS: lock down table - only service role can access
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- No client access at all - only service role can insert
REVOKE ALL ON TABLE public.leads FROM anon, authenticated;