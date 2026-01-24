# Question Data Validation Report

**Date:** January 24, 2026  
**Scope:** All question data files in the ACT study application

## Executive Summary

A comprehensive quality assurance scan was performed on all question data files including:
- `src/data/curriculum.ts` (~2800+ lines, 13 days of curriculum with hundreds of questions)
- `src/data/evaluationQuestions.ts` (78 lines, diagnostic questions)
- `public/import-data/form_a_english.tsv` (75 questions)
- `public/import-data/form_a_math.tsv` (60 questions)
- `public/import-data/form_a_reading.tsv` (40+ questions with passages)
- `public/import-data/form_a_science.tsv` (40 questions)

## Flagged Questions

| Question ID | File | Issue Found | Snippet |
|-------------|------|-------------|---------|
| **FA_RD_021** | `form_a_reading.tsv` | Duplicate columns - Answer choices and explanation are duplicated in the row | `...B	Mara organizes to provoke...	Donors should control exhibition choices.	Labels are more important than objects.	B	Mara organizes to provoke...` |
| **FA_RD_030** | `form_a_reading.tsv` | Missing question text - The `question` column is empty | Row shows only: `second-person instructions	a sequence of donor interviews	chronological history of chairs	A	Visitor...` |
| **Lines 42-75** | `form_a_reading.tsv` | Empty/incomplete rows - Lines contain only partial IDs like `FA_EN_016`, `FA_EN_017` with no question data | Empty TSV rows after line 41 |
| **FA_SCI_013** | `form_a_science.tsv` | Conflicting answer explanation - Explanation contains both wrong calculation and appears to have been corrected inline | `47 − 29? Careful: Salt A at 20°C is 18; at 50°C is 47 → +29.	B` |
| **FA_SCI_027** | `form_a_science.tsv` | Conflicting answer - Answer column says "C" but explanation provides different answer inline | `7.2 − 4.8 = 2.4? Careful:...	B	Subtract: 7.2 − 4.8 = 2.4 mg/L.` |
| **p4m2** | `curriculum.ts` | Math error in explanation - Answer is index 2 (`16π`) but explanation says circumference is `8π` | Line 898: `correctAnswer: 2, explanation: 'C = 2πr = 2π×4 = 8π; note 16π is the area...'` |
| **p6m3** | `curriculum.ts` | Duplicate options (3 of 4 identical) | Line 1263: `options: ['[5 5; 5 5]', '[5 5; 5 4]', '[5 5; 5 5]', '[5 5; 5 5]']` |
| **q7m3** | `curriculum.ts` | Answer key mismatch - correctAnswer index points to wrong option | Line 1445: `correctAnswer: 2` (value '5') but explanation says `x = 7` (index 0) |
| **mb6** | `curriculum.ts` | Answer key error - correctAnswer: 2 but correct answer is '3' at index 1 | Line 58: `options: ['1', '3', '2', '5'], correctAnswer: 2` but `x = 3` |
| **gb3** | `curriculum.ts` | Near-duplicate options - Options differ only by quotation mark style | Lines 199-202: `"It's a beautiful day outside."` vs `"It's a beautiful day outside."` |

## Detailed Analysis by Category

### 1. Missing or Empty Data

#### Empty Question Fields
- **FA_RD_030**: The question column is entirely empty while answer choices are populated.
- **Lines 42-75 in form_a_reading.tsv**: Multiple rows have only partial ID references (e.g., `FA_EN_016`) with all other fields empty.

#### Recommendation
These rows need to be either:
1. Completed with actual question content, OR
2. Removed from the dataset if they are placeholders

### 2. Logic Errors

#### Answer Validity Issues

| ID | Issue | Details |
|----|-------|---------|
| **mb6** | Incorrect correctAnswer index | Question: "Solve for x: 3x - 7 = 2", Correct math: x = 3 (index 1), Listed: index 2 |
| **q7m3** | Incorrect correctAnswer index | Question: "Solve for x: 3(x − 2) = 15", Correct math: x = 7 (index 0), Listed: index 2 |
| **p4m2** | Explanation contradicts answer | Answer index 2 = "16π" but explanation says C = 8π is the circumference |

#### Duplicate Options

| ID | Duplicates |
|----|------------|
| **p6m3** | Options A, C, D are all `[5 5; 5 5]` - only B differs |
| **gb3** | Options B and D appear identical (smart quote vs regular quote difference) |

### 3. AI Hallucinations & Formatting Artifacts

**No critical AI hallucination phrases found.**

The following search patterns returned no matches in question content:
- "Here is the question..."
- "As an AI language model..."
- "[Insert image here]"

**Note:** Some `**Note:**` patterns were found in documentation files (PRODUCTION_FIXES_SUMMARY.md, PRODUCTION_READINESS_REVIEW.md, PROJECT_STATUS.md) but these are NOT in student-facing question text.

### 4. LaTeX/Math Formatting

**No broken LaTeX syntax detected.**

All math expressions in questions use plain text or HTML entities (e.g., `×`, `÷`, `√`) rather than LaTeX, which is appropriate for TSV imports.

### 5. Content Consistency

#### TSV Data Integrity Issues

The Reading TSV file (`form_a_reading.tsv`) has structural problems:
1. Row 22 (FA_RD_021) has duplicated column data
2. Rows 42-75 appear to be incomplete/placeholder entries
3. Some rows have extra tab-separated fields at the end

### 6. Additional Observations

#### Data Quality in curriculum.ts
The curriculum.ts file is well-structured with:
- Consistent question format across 13 days
- Proper difficulty ratings (easy, medium, hard)
- Complete explanations for all questions
- No empty strings in required fields

#### Data Quality in evaluationQuestions.ts
The evaluation questions file is clean with:
- Complete question text for all items
- Valid answer options (4 choices each)
- Proper correctAnswer indices (0-3)
- Adequate explanations

## Recommendations

### High Priority Fixes

1. **Fix p4m2**: Change `correctAnswer` from `2` to `0` to match the circumference value of 8π
2. **Fix mb6**: Change `correctAnswer` from `2` to `1` to match x = 3
3. **Fix q7m3**: Change `correctAnswer` from `2` to `0` to match x = 7
4. **Fix p6m3**: Update duplicate options to provide meaningful alternatives

### Medium Priority Fixes

1. **FA_RD_021**: Remove duplicate column data in the TSV row
2. **FA_RD_030**: Add missing question text
3. **FA_SCI_013 & FA_SCI_027**: Clean up inline corrections in explanations
4. **form_a_reading.tsv lines 42-75**: Either complete or remove placeholder rows

### Low Priority Fixes

1. **gb3**: Normalize quotation marks across options for consistency

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total files scanned | 6 |
| Total questions analyzed | ~500+ |
| Critical issues (wrong answers) | 3 |
| Data integrity issues | 7 |
| Empty/missing data | 35+ rows |
| AI hallucination artifacts | 0 |
| Broken LaTeX | 0 |

---

*Report generated by automated QA scan. Manual review recommended for flagged items.*
