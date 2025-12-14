# Phase 2: Science Content Population - Instructions

## ✅ What's Complete

### 1. DiagnosticTest.tsx Fixed
- **Changed from**: Reading `v_form_section` view (empty)
- **Changed to**: Reading `staging_items` table directly (like DrillRunner)
- **Result**: Diagnostics now work with staging_items data

### 2. Science Content SQL Generated
- **File**: `public/import-data/science_content_import.sql`
- **D2SCI**: 15 Science Diagnostic questions
- **DR_SC**: 25 Science Drill questions
- **Coverage**: Data Representation, Research Summaries, Conflicting Viewpoints

## 📋 How to Import Science Content

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/hhbkmxrzxcswwokmbtbz/sql/new)
2. You'll see a blank SQL editor

### Step 2: Copy SQL Statements
1. Open `public/import-data/science_content_import.sql`
2. Copy the entire file content (or copy sections)

### Step 3: Execute SQL
1. Paste into Supabase SQL Editor
2. Click "Run" button
3. Wait for confirmation (should see "Success" message)

### Step 4: Verify Import
Run these verification queries in SQL Editor:

```sql
-- Check D2SCI (should return 15)
SELECT COUNT(*) as d2sci_count FROM staging_items WHERE form_id = 'D2SCI';

-- Check DR_SC (should return 25)
SELECT COUNT(*) as dr_sc_count FROM staging_items WHERE form_id = 'DR_SC';

-- View all Science content
SELECT form_id, section, COUNT(*) as count 
FROM staging_items 
WHERE form_id IN ('D2SCI', 'DR_SC')
GROUP BY form_id, section;
```

## 🧪 Testing After Import

### Test D2SCI Diagnostic
1. Log into your app at `/login`
2. Navigate to `/diagnostic`
3. Select the Science diagnostic section (D2SCI)
4. You should see 15 questions with passages
5. Complete the diagnostic and verify submission works

### Test DR_SC Drill
1. Navigate to `/drills`
2. Select Science (SC) section
3. Choose number of questions (default: 10, max: 25)
4. You should see drill questions loading from DR_SC

## 📊 Current Content Status

| Form ID | Section | Count | Status |
|---------|---------|-------|--------|
| D2EN | English | 30 | ✅ Ready |
| D2MA | Math | 9 | ⚠️ Need ~15 more |
| D2RD | Reading | 17 | ✅ Ready |
| **D2SCI** | **Science** | **15** | **🆕 New** |
| DR_EN | English | 429 | ✅ Ready |
| DR_MA | Math | 97 | ✅ Ready |
| DR_RD | Reading | 118 | ✅ Ready |
| **DR_SC** | **Science** | **25** | **🆕 New** |
| ONB | Onboarding | 30 | ✅ Ready |

## 🔄 Next Steps (Phase 2 Continuation)

### A. Add More Math Diagnostic Questions (D2MA)
Currently only 9 questions - need ~15 more covering:
- Pre-Algebra/Number Operations (M1.x)
- Elementary Algebra (M2.x)  
- Intermediate Algebra (M3.x)
- Coordinate Geometry (M5.x)
- Plane Geometry (M6.x)

**Action**: Create similar SQL file for additional D2MA questions from `form_a_math.tsv`

### B. (Optional) Run Full Import Edge Function
After all staging_items are populated, run the `import-questions` edge function to:
- Move data from `staging_items` → `questions` table
- Create `form_questions` join records
- Populate `passages` table
- Make `v_form_section` view functional

**Command** (from Supabase Functions page):
```bash
# This would trigger the full import process
# Currently manual - you'd need to call the edge function
```

## 🐛 Troubleshooting

### Issue: "No questions found"
- **Cause**: SQL INSERT failed or wrong form_id
- **Fix**: Run verification queries above, check form_id matches exactly

### Issue: Questions show but answers are wrong
- **Cause**: Answer column must be single letter 'A', 'B', 'C', or 'D'
- **Fix**: Check staging_items.answer column for invalid values

### Issue: Skill codes not recognized
- **Cause**: Skill codes in staging_items don't match skills table
- **Fix**: Query `SELECT id, code FROM skills WHERE subject = 'Science'` to verify

## 📚 Skill Code Reference

### Science Skills (From TSV)
- **S1.x**: Data Representation (tables, graphs, patterns)
- **S2.x**: Research Summaries (experimental design, variables, controls)
- **S3.x**: Conflicting Viewpoints (multiple perspectives, hypothesis testing)

### Skill Mapping
The app automatically resolves skill codes to skill IDs from the `skills` table.
