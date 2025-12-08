# Debug Report: Empty Drills, Sims, and Diagnostics

## Problem Summary
Drills, simulations, and diagnostic tests are all showing empty/no content in the app.

## Root Cause Analysis

### Database Structure
The app uses two different data storage approaches:

1. **`staging_items` table** - Used for:
   - Drills (form_id: DR_RD, DR_MA, DR_EN, DR_SC)
   - Diagnostics (form_id: D2EN, D2MA, D2RD, D2SCI)

2. **`form_questions` + `questions` + `passages` tables** - Used for:
   - Full ACT Simulations (form_id: FA_EN, FB_MA, FC_RD, etc.)

### The Issue
Migration `20251126230050_43eda24f-bd6c-4e3c-84b8-64e50d9c20db.sql` removed the RLS policy that allows authenticated users to read from `staging_items`:

```sql
-- Line 2 of that migration:
DROP POLICY IF EXISTS "authenticated_users_read_staging_items" ON staging_items;
```

This policy was previously added in migration `20251126110551_c46d0c24-45ed-44f3-b8fb-991f3e316cc2.sql`, but then removed by the later migration.

### Impact
Without the RLS policy:
- ❌ **Drills** - Cannot fetch questions from `staging_items` (TimedDrills.tsx line 26)
- ❌ **Diagnostics** - Cannot fetch questions from `staging_items` (DiagnosticTest.tsx line 185)
- ✅ **Simulations** - Still work because they use `form_questions` table which has its own policy

## Solution
Created migration `20251208030628_57df4ab6-4953-410c-b3cb-85afda77b7fd.sql` to restore the RLS policy:

```sql
CREATE POLICY "authenticated_users_read_staging_items"
ON public.staging_items
FOR SELECT
TO authenticated
USING (true);
```

This allows authenticated users to read from `staging_items`, which is required for drills and diagnostics to function.

## Files Affected
- `/workspace/src/pages/TimedDrills.tsx` - Queries staging_items
- `/workspace/src/pages/DiagnosticTest.tsx` - Queries staging_items
- `/workspace/src/pages/DrillPlayer.tsx` - Queries staging_items
- `/workspace/src/pages/DrillRunner.tsx` - Queries staging_items
- `/workspace/supabase/functions/session-fetch/index.ts` - Queries staging_items for F* forms
- `/workspace/src/components/FormPicker.tsx` - Queries form_questions (working)

## Solution Applied

### Migration Created
Created `supabase/migrations/20251208030628_57df4ab6-4953-410c-b3cb-85afda77b7fd.sql` which restores the RLS policy on `staging_items`.

### Next Steps to Complete the Fix

1. **Apply the migration** to your Supabase database:
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration file: `supabase/migrations/20251208030628_57df4ab6-4953-410c-b3cb-85afda77b7fd.sql`
   - OR use Supabase CLI: `supabase db push`

2. **Check if tables have data**:
   ```sql
   -- Check staging_items (for drills and diagnostics)
   SELECT form_id, section, COUNT(*) as count 
   FROM staging_items 
   GROUP BY form_id, section 
   ORDER BY form_id, section;
   
   -- Check form_questions (for simulations)
   SELECT form_id, section, COUNT(*) as count 
   FROM form_questions 
   GROUP BY form_id, section 
   ORDER BY form_id, section;
   ```

3. **If staging_items is empty**, import the data:
   - Open `public/import-data/science_content_import.sql`
   - Copy and paste into Supabase SQL Editor
   - Execute to populate D2SCI (diagnostic) and DR_SC (drills)
   
4. **If form_questions is empty**, you need to:
   - Use the Admin Import page in the app, OR
   - Import TSV files from `public/import-data/` (form_a_*.tsv)

### Expected Results After Fix
- ✅ Drills page should show available subjects (Math, Science, English, Reading)
- ✅ Diagnostic page should show available sections
- ✅ Simulations page should show available forms (if data is imported)
