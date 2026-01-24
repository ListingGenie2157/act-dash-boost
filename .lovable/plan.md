

# Fix Question Correctness Audit

## Issue Summary

I've verified all the issues from your audit. Here's what needs to be fixed:

---

## CONFIRMED ISSUES

### 1. curriculum.ts - Wrong Answer Keys (3 issues)

| ID | Question | Options | Current | Correct | Evidence |
|----|----------|---------|---------|---------|----------|
| **mb6** | Solve for x: 3x - 7 = 2 | ['1', '3', '2', '5'] | correctAnswer: 2 (points to '2') | correctAnswer: 1 (x=3) | Explanation confirms: "3x = 9 → x = 3" |
| **q7m3** | Solve for x: 3(x − 2) = 15 | ['7', '6', '5', '8'] | correctAnswer: 2 (points to '5') | correctAnswer: 0 (x=7) | Explanation confirms: "x − 2 = 5 → x = 7" |
| **p4m2** | Circumference with radius 4 | ['8π', '12π', '16π', '20π'] | correctAnswer: 2 (points to '16π') | correctAnswer: 0 (8π) | Explanation confirms: "C = 2πr = 8π; note 16π is the area" |

### 2. curriculum.ts - Duplicate Options (1 issue)

| ID | Question | Options | Issue |
|----|----------|---------|-------|
| **p6m3** | Add matrices [1 2; 3 4] + [4 3; 2 1] | ['[5 5; 5 5]', '[5 5; 5 4]', '[5 5; 5 5]', '[5 5; 5 5]'] | Options A, C, D are identical |

**Note:** The correct answer IS `[5 5; 5 5]` per the explanation. The issue is that options need variation. I'll fix option D to be a plausible distractor.

### 3. form_a_reading.tsv - Data Issues (2 issues)

| ID | Line | Issue | Details |
|----|------|-------|---------|
| **FA_RD_021** | Line 22 | Duplicate columns | Row has answer/explanation duplicated inline (columns 18-21 are repeated) |
| **FA_RD_030** | Line 31 | Missing question | Row has answer choices but empty question column |
| Lines 42-75 | Lines 42-75 | Empty/partial rows | 35+ rows with only partial IDs (FA_EN_016, etc.) or completely empty |

### 4. form_a_science.tsv - Conflicting Explanations (2 issues)

| ID | Line | Issue | Details |
|----|------|-------|---------|
| **FA_SCI_013** | Line 14 | Conflicting answer | Answer marked as "C" (18) but inline correction shows "B" (29). Math: 47 − 18 = 29 |
| **FA_SCI_027** | Line 28 | Conflicting answer | Answer marked as "C" (1.7) but inline correction shows "B" (2.4). Math: 7.2 − 4.8 = 2.4 |

---

## Fixes to Implement

### File: src/data/curriculum.ts

**Fix mb6 (Lines 54-59):**
```typescript
// Change correctAnswer from 2 to 1
{
  id: 'mb6',
  question: 'Solve for x: 3x - 7 = 2',
  options: ['1', '3', '2', '5'],
  correctAnswer: 1,  // Was 2, now points to '3'
  explanation: '3x - 7 = 2 → 3x = 9 → x = 3',
  difficulty: 'medium'
},
```

**Fix p4m2 (Lines 894-901):**
```typescript
// Change correctAnswer from 2 to 0
{
  id: 'p4m2',
  question: 'What is the circumference of a circle with radius 4?',
  options: ['8π', '12π', '16π', '20π'],
  correctAnswer: 0,  // Was 2, now points to '8π'
  explanation: 'C = 2πr = 2π×4 = 8π',  // Remove confusing note about area
  difficulty: 'medium'
},
```

**Fix p6m3 (Lines 1260-1267):**
```typescript
// Fix duplicate options - make D a different distractor
{
  id: 'p6m3',
  question: 'Add the matrices: [1 2; 3 4] + [4 3; 2 1].',
  options: ['[5 5; 5 5]', '[5 5; 5 4]', '[5 4; 5 5]', '[4 5; 5 5]'],  // Fixed duplicates
  correctAnswer: 0,
  explanation: 'Add corresponding elements: [1+4 2+3; 3+2 4+1] = [5 5; 5 5]',
  difficulty: 'easy'
},
```

**Fix q7m3 (Lines 1441-1448):**
```typescript
// Change correctAnswer from 2 to 0
{
  id: 'q7m3',
  question: 'Solve for x: 3(x − 2) = 15.',
  options: ['7', '6', '5', '8'],
  correctAnswer: 0,  // Was 2, now points to '7'
  explanation: '3(x − 2) = 15 → x − 2 = 5 → x = 7',
  difficulty: 'easy'
},
```

### File: public/import-data/form_a_reading.tsv

**Fix FA_RD_021 (Line 22):**
- Remove duplicate columns 18-21 (the repeated answer/explanation)

**Fix FA_RD_030 (Line 31):**
- Add the missing question text. Based on skill_code R3.J and the answer options ("second-person instructions", "a sequence of donor interviews", "chronological history of chairs"), the question should be about structure/development

**Fix Lines 42-75:**
- Delete all empty and partial rows (these appear to be leftover from a failed import)

### File: public/import-data/form_a_science.tsv

**Fix FA_SCI_013 (Line 14):**
- Change answer from "C" to "B" (correct: 47 − 18 = 29)
- Update explanation to remove conflicting text

**Fix FA_SCI_027 (Line 28):**
- Change answer from "C" to "B" (correct: 7.2 − 4.8 = 2.4)
- Update explanation to remove conflicting text

---

## Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `src/data/curriculum.ts` | HIGH | Fix 4 question answer keys/options |
| `public/import-data/form_a_reading.tsv` | HIGH | Fix 2 data rows + delete 34 empty rows |
| `public/import-data/form_a_science.tsv` | HIGH | Fix 2 answer keys |

---

## Database Sync Consideration

The TSV files are source files for import. After fixing them:
1. The fixes will be in the import files
2. If these questions are already in `staging_items`, they'll need to be re-imported or updated via SQL

**I'll check if these specific questions exist in staging_items and if so, update them directly as well.**

---

## Technical Notes

- All curriculum.ts questions use 0-based indexing for `correctAnswer`
- The TSV files use letter answers (A, B, C, D)
- FA_RD items (lines 42-75) appear to be placeholder stubs from English section (FA_EN_*) that got misplaced into the reading file

