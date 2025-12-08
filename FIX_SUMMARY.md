# Summary: Fix for Empty Drills, Diagnostics, and Simulations

## What I Found

Your drills, diagnostics, and simulations are empty because of a database security policy issue.

### The Problem

On November 26, 2024, a migration removed the security policy that allows users to read from the `staging_items` table. This table stores all the questions for:
- **Drills** (DR_RD, DR_MA, DR_EN, DR_SC)
- **Diagnostics** (D2EN, D2MA, D2RD, D2SCI)

Without this policy, when your app tries to fetch questions, the database blocks the request.

### The Fix

I've created a new migration that restores the security policy:
- File: `supabase/migrations/20251208030628_57df4ab6-4953-410c-b3cb-85afda77b7fd.sql`

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
cd /workspace
supabase db push
```

### Option 2: Manual SQL Execution
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/20251208030628_57df4ab6-4953-410c-b3cb-85afda77b7fd.sql`
4. Paste and run it

## After Applying the Fix

The fix will restore access to the tables, but you may still see empty content if the tables don't have data yet.

### Check if you have data:

Run this in Supabase SQL Editor:

```sql
-- Check drills and diagnostics data
SELECT form_id, COUNT(*) as question_count 
FROM staging_items 
GROUP BY form_id;

-- Check simulations data
SELECT form_id, COUNT(*) as question_count 
FROM form_questions 
GROUP BY form_id;
```

### If staging_items is empty:

The file `public/import-data/science_content_import.sql` contains sample data for:
- 15 diagnostic questions (D2SCI)
- 25 drill questions (DR_SC)

Copy and paste that SQL file into Supabase SQL Editor to import the data.

### If form_questions is empty:

Use the Admin Import feature in your app, or manually import the TSV files from:
- `public/import-data/form_a_english.tsv`
- `public/import-data/form_a_math.tsv`
- `public/import-data/form_a_reading.tsv`
- `public/import-data/form_a_science.tsv`

## Why This Happened

The migration `20251126230050` was focused on security hardening and removed several policies. It was meant to prevent unauthorized access, but it also removed the policy needed for normal user access to `staging_items`.

The migration I created restores only the specific policy needed for authenticated users to read questions, maintaining security while fixing functionality.

## What Should Work After Fix

✅ **Drills page** - Should show available subjects with question counts
✅ **Diagnostic page** - Should show all 4 ACT sections  
✅ **Simulations page** - Should show available test forms

## Files Changed

- ✨ Created: `supabase/migrations/20251208030628_57df4ab6-4953-410c-b3cb-85afda77b7fd.sql`
- 📝 Created: `.cursor/debug-report.md` (technical details)
