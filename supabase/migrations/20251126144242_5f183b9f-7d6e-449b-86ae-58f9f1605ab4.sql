-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the cron-daily edge function to run every day at 2 AM UTC
-- This will regenerate study plans for all active users
SELECT cron.schedule(
  'regenerate-study-plans-daily',
  '0 2 * * *', -- Run at 2 AM UTC every day
  $$
  SELECT
    net.http_post(
      url := 'https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/cron-daily',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI5MzcsImV4cCI6MjA3MTgyODkzN30.SWsosSuVDjtaAvlIdEyAwUx9zOY_uViTJWw_5UbgIGE'
      ),
      body := jsonb_build_object('scheduled', true, 'timestamp', now())
    ) AS request_id;
  $$
);

-- View all scheduled cron jobs (for verification)
-- SELECT * FROM cron.job;