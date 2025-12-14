# How to Import All 47 English Lessons

## Overview
This guide shows you how to import all 47 English lessons from the Excel file into your database using the Admin Lesson Import page.

## Files
- **Source File**: `lessons_all_47.xlsx` (copied to `public/import-data/`)
- **Target**: `lesson_content` table in Supabase

## Import Steps

### 1. Open Excel and Convert to TSV

1. Open `public/import-data/lessons_all_47.xlsx` in Excel or Google Sheets
2. Select all data (Ctrl+A or Cmd+A)
3. Copy the data (Ctrl+C or Cmd+C)
4. Open a text editor (Notepad, TextEdit, VSCode, etc.)
5. Paste the data - it should automatically paste as tab-separated values
6. Save as `lessons_all_47.tsv` (plain text file)

**Important**: Make sure the file has these columns in this order:
```
skill_code	independent_practice	independent_practice_answers	checkpoint_quiz_q1	checkpoint_quiz_q2	checkpoint_quiz_q3	checkpoint_quiz_q4	checkpoint_quiz_q5	checkpoint_quiz_q6	checkpoint_quiz_q7	checkpoint_quiz_q8	checkpoint_quiz_q9	checkpoint_quiz_q10
```

### 2. Navigate to Admin Import Page

1. Go to your app: `https://your-app-url.lovable.app`
2. Navigate to `/admin/lesson-import` (you need admin privileges)
3. Or click "Admin" → "Lesson Import" in your navigation

### 3. Import the Lessons

1. Select **"TSV (Recommended)"** as the import mode
2. Open `lessons_all_47.tsv` in your text editor
3. Copy ALL content (including the header row)
4. Paste into the large text area on the import page
5. Click **"Parse & Preview"**
6. Review the preview - you should see all 47 lessons (E1.A through E5.F)
7. Check that each lesson shows:
   - ✅ Valid skill code
   - ✅ Independent practice HTML
   - ✅ 10 checkpoint quiz questions
8. Click **"Import All X Lessons"** button
9. Wait for confirmation

### 4. Verify Import

After import completes:

1. Go to `/lessons` to view the lessons library
2. Navigate to any English lesson
3. Verify that:
   - Independent practice section has formatted questions
   - Checkpoint quiz has 10 unique questions
   - All content displays properly

## What Gets Imported

Each lesson imports:
- **skill_code**: E1.A, E1.B, E1.C, ... E5.F (47 total)
- **independent_practice**: HTML with 5 practice exercises
- **independent_practice_answers**: HTML with detailed answer explanations
- **checkpoint_quiz_q1 through q10**: 10 unique ACT-style questions in pipe-delimited format

## Expected Format

Each checkpoint quiz question should follow this format:
```
Question stem with <u>underlined</u> portion || A) Option A || B) Option B || C) Option C || D) Option D || ANSWER: X || Explanation text || difficulty
```

## Troubleshooting

### "Skill code not found"
- The skill code in your TSV doesn't match the database
- Check that all codes (E1.A, E1.B, etc.) exist in the `skills` table

### "Failed to parse checkpoint question"
- Check that questions use `||` (double pipe) as delimiters
- Ensure each question has all required parts: stem, 4 options, answer, explanation, difficulty

### "Import failed"
- Check browser console for errors
- Verify you have admin privileges
- Make sure the TSV format is correct (tabs not spaces)

## Quick Test

To test with just one lesson first:
1. Copy only the header row and ONE lesson row (e.g., E1.A)
2. Paste and import
3. Verify it works before importing all 47

## Database Impact

The import will:
- **UPSERT** into `lesson_content` table (updates existing, inserts new)
- Use `skill_code` as the unique identifier
- Replace any existing content for matching skill codes

**This means**: If you run the import twice, it will update/overwrite the first import.

## Success Metrics

After successful import, you should have:
- 47 lessons in the database
- Each with unique independent practice questions
- Each with 10 unique checkpoint quiz questions
- No duplicate questions between lessons
- All HTML properly formatted

---

**Need Help?**
- Check the browser console for detailed error messages
- Review the preview carefully before clicking Import
- Start with a single lesson to test the format
