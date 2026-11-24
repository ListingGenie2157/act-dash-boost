# Database tests (pgTAP)

The repo's migration history can't be replayed from scratch: `20250911214734` uses
`CREATE POLICY IF NOT EXISTS`, which Postgres rejects. So `supabase db reset`
fails. The tests instead run against `baseline/prod_baseline.sql`, a copy of the
production definitions of the objects under test, plus every migration newer
than that baseline.

## Run

1. Start Docker Desktop.
2. Start the stack once without the old migrations:
   ```bash
   mv supabase/migrations supabase/_hold && supabase start -x studio,imgproxy,inbucket,realtime,storage-api,edge-runtime,logflare,vector,supavisor; mv supabase/_hold supabase/migrations
   ```
3. `bash scripts/test-db.sh`

Each suite runs inside one transaction that is rolled back, so nothing persists.
When a migration changes an object, refresh the baseline only after that
migration has been applied to production.
