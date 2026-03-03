

## Problem

Two issues causing the question shortfall:

1. **Outdated question counts**: `AdminSimulationGenerator.tsx` uses old ACT targets (EN:75, MA:60, RD:40) but the app uses Enhanced ACT format (EN:50, MA:45, RD:36, SC:40). The generator is trying to produce the wrong number.

2. **AI under-generates per passage**: When asked for "exactly 15 questions," the AI often returns 12-13. Over 5 passages, that gap compounds (e.g., 62 instead of 75).

## Plan

### 1. Update SECTION_CONFIG to Enhanced ACT format
In `AdminSimulationGenerator.tsx`, change the config to match the Enhanced format:
- English: 50 questions, 5 passages, 10 questions/passage
- Math: 45 questions, 0 passages, batch size 10
- Reading: 36 questions, 4 passages, 9 questions/passage
- Science: 40 questions, 7 passages, ~6 questions/passage (unchanged)

### 2. Add validation + retry in the edge function
After the AI returns questions for a passage, check the count. If fewer than requested, make a second call asking for only the missing questions for that same passage. Cap at 1 retry to avoid infinite loops.

### 3. Add a post-generation warning in the UI
After all batches complete, if total generated count is less than the target, show a warning badge: "Generated X of Y target questions — consider regenerating missing passages."

### Technical details

**SECTION_CONFIG update** (AdminSimulationGenerator.tsx):
```
english: { totalQuestions: 50, passageCount: 5, questionsPerPassage: 10, batchSize: 10, hasPassages: true }
math: { totalQuestions: 45, passageCount: 0, questionsPerPassage: 0, batchSize: 10, hasPassages: false }
reading: { totalQuestions: 36, passageCount: 4, questionsPerPassage: 9, batchSize: 9, hasPassages: true }
science: { totalQuestions: 40, passageCount: 7, questionsPerPassage: 6, batchSize: 6, hasPassages: true }
```

**Edge function retry logic** (generate-questions/index.ts, inside the `generate-simulation` passage handler):
- After parsing the AI response, check `args.questions.length < questions_per_passage`
- If short, make one supplemental AI call asking for the missing count referencing the same passage text
- Merge results before returning

**UI warning** (AdminSimulationGenerator.tsx):
- After generation completes, compare `totalCount` vs `config.totalQuestions`
- If under target, show an `Alert` with the shortfall count

