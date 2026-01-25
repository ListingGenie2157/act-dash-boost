

# Fix Evaluation Questions Missing Keys

## Issue Summary

The `src/data/evaluationQuestions.ts` file contains 6 diagnostic evaluation questions that are missing required keys (`difficulty` and `category`) that other question types have.

## Current State Analysis

| Question ID | Section | Current Keys | Missing |
|-------------|---------|--------------|---------|
| `eng1` | English | id, question, passage, underlined, options, correctAnswer, explanation, skill | **difficulty**, **category** |
| `eng2` | English | id, question, passage, options, correctAnswer, explanation, skill | **difficulty**, **category** |
| `math1` | Math | id, question, options, correctAnswer, explanation, skill | **difficulty**, **category** |
| `math2` | Math | id, question, options, correctAnswer, explanation, skill | **difficulty**, **category** |
| `read1` | Reading | id, question, passage, options, correctAnswer, explanation, skill | **difficulty**, **category** |
| `sci1` | Science | id, question, options, correctAnswer, explanation, skill | **difficulty**, **category** |

## Fixes to Implement

### File: src/data/evaluationQuestions.ts

Add `difficulty` and `category` to each question:

**eng1 - Pronoun-Antecedent Agreement**
```typescript
{
  id: 'eng1',
  question: 'Choose the best revision for the underlined portion.',
  passage: '...',
  underlined: 'they',
  options: [...],
  correctAnswer: 1,
  explanation: '...',
  skill: 'pronoun-antecedent agreement',
  difficulty: 'medium',          // ADD
  category: 'Conventions of Standard English'  // ADD
},
```

**eng2 - Tone and Style**
```typescript
{
  // existing fields...
  difficulty: 'medium',          // ADD
  category: 'Production of Writing'  // ADD
},
```

**math1 - Linear Equations**
```typescript
{
  // existing fields...
  difficulty: 'easy',            // ADD - basic algebra
  category: 'Algebra'            // ADD
},
```

**math2 - Circle Area**
```typescript
{
  // existing fields...
  difficulty: 'medium',          // ADD
  category: 'Geometry'           // ADD
},
```

**read1 - Author Attitude**
```typescript
{
  // existing fields...
  difficulty: 'medium',          // ADD
  category: 'Craft and Structure'  // ADD
},
```

**sci1 - Data Analysis**
```typescript
{
  // existing fields...
  difficulty: 'medium',          // ADD
  category: 'Data Representation'  // ADD
},
```

---

## Difficulty Assignments Rationale

| ID | Difficulty | Rationale |
|----|------------|-----------|
| eng1 | medium | Requires understanding pronoun agreement nuances |
| eng2 | medium | Needs tone recognition skills |
| math1 | easy | Basic one-step algebra (3x + 7 = 22) |
| math2 | medium | Requires knowing circle area formula |
| read1 | medium | Inference from short passage |
| sci1 | medium | Data interpretation from described table |

---

## Category Assignments Rationale

Categories align with ACT test structure:

| Section | Category Used | ACT Domain |
|---------|---------------|------------|
| English | Conventions of Standard English | Grammar/mechanics |
| English | Production of Writing | Style/organization |
| Math | Algebra | Pre-Algebra/Elementary Algebra |
| Math | Geometry | Geometry domain |
| Reading | Craft and Structure | How passage is built |
| Science | Data Representation | DR passage type |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/evaluationQuestions.ts` | Add `difficulty` and `category` to all 6 questions |

---

## Already Fixed (Verified)

The TSV files were successfully fixed in the previous implementation:

| Item | Status |
|------|--------|
| FA_RD_021 duplicate columns | Fixed - clean data on line 22 |
| FA_RD_030 missing question | Fixed - has proper question text |
| FA_EN_016-025 orphan rows | Fixed - deleted, file ends at line 41 |
| FA_SCI_013 conflicting answer | Fixed - answer is "B", explanation "47 − 18 = 29" |
| FA_SCI_027 conflicting answer | Fixed - answer is "B", explanation "7.2 − 4.8 = 2.4" |

