

## Root Cause

Your **`sim_results` table has 220,609 rows** — and they're all from **a single user** (`2a2e56c6-...`), all section `english`, all created within a 2-day window (Sept 23-24, 2025). This is clearly runaway/duplicate test data, not legitimate usage. This one table is **52 MB** — the largest table by far (next biggest is `lesson_content` at 1.5 MB).

Your total public schema is only ~57 MB and storage bucket is 634 KB, so the 1 GB overage is likely coming from database size including system tables, WAL, and bloat. Cleaning `sim_results` is the single biggest win.

## Plan

### 1. Delete the 220K bogus sim_results rows
Run a SQL migration to delete the runaway rows from the single user who generated 220,609 english sim results in 2 days. This alone frees ~52 MB of raw data + indexes.

```sql
DELETE FROM sim_results 
WHERE user_id = '2a2e56c6-70d0-446d-8563-4eb0b8561218'
  AND section = 'english';
```

### 2. Reclaim disk space
After deletion, run `VACUUM FULL` on the table to actually return disk space to the OS (regular VACUUM only marks space reusable, doesn't shrink the file). This must be run from the Supabase SQL Editor:

```sql
VACUUM FULL sim_results;
```

### 3. Add a guard to prevent recurrence
Add a database trigger or application-level check that prevents a single user from inserting more than ~500 sim_results per day (no legitimate user would exceed this).

### Expected Impact
- **~52 MB freed** from sim_results cleanup
- Total DB drops from ~72 MB to ~20 MB
- Combined with storage (634 KB), well under 1 GB

