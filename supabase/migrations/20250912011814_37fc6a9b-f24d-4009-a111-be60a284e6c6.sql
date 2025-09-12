-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cron-daily to run daily at 05:00 America/Chicago
SELECT cron.schedule(
  'daily-study-plan-generation',
  '0 5 * * *', -- 5:00 AM daily (assuming server is in Chicago timezone)
  $$
  SELECT
    net.http_post(
        url:='https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/cron-daily',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);