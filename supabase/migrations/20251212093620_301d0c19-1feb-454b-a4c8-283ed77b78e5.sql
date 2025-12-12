-- 1. Drop dependent policies first
DROP POLICY IF EXISTS staging_admin_select ON public.staging_items;
DROP POLICY IF EXISTS staging_admin_insert ON public.staging_items;
DROP POLICY IF EXISTS staging_admin_update ON public.staging_items;
DROP POLICY IF EXISTS staging_admin_delete ON public.staging_items;

-- 2. Drop the old insecure is_admin function
DROP FUNCTION IF EXISTS public.is_admin(text);

-- 3. Create secure is_admin() with NO parameters - only uses auth.uid()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

-- 4. Recreate the staging_items admin policies using the new function
CREATE POLICY staging_admin_select ON public.staging_items
FOR SELECT USING (is_admin());

CREATE POLICY staging_admin_insert ON public.staging_items
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY staging_admin_update ON public.staging_items
FOR UPDATE USING (is_admin());

CREATE POLICY staging_admin_delete ON public.staging_items
FOR DELETE USING (is_admin());

-- 5. Create rate_limits table for durable rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- 6. Create atomic rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := now() - (p_window_ms || ' milliseconds')::interval;
  v_count INTEGER;
BEGIN
  -- Clean old entries (older than 1 hour)
  DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour';
  
  -- Upsert and get count
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET
    count = CASE 
      WHEN rate_limits.window_start < v_window_start THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_start THEN now()
      ELSE rate_limits.window_start
    END
  RETURNING count INTO v_count;
  
  RETURN jsonb_build_object('allowed', v_count <= p_limit, 'count', v_count);
END;
$$;

-- 7. RLS for rate_limits - only edge functions (via service role) should access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;