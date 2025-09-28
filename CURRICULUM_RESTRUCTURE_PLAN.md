# ACT Prep App - Curriculum Restructure Plan

## Current Problem
- All lesson content was imported as "test forms" (17 forms created)
- Should be: Curriculum modules (E1-E8, M1-M10, etc.) + only A/B/C as test forms
- Missing: Lesson structure, examples, practice sets, mastery tracking

## Required Database Schema Changes

### New Tables Needed
```sql
-- Curriculum modules (E1, E2, M1, etc.)
CREATE TABLE modules (
  id TEXT PRIMARY KEY, -- E1, E2, M1, M2, etc.
  subject TEXT NOT NULL, -- English, Math, Reading, Science, Writing
  phase INTEGER NOT NULL, -- 1-6 (Phase 1 = English, Phase 2 = Math, etc.)
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL, -- "Subject–Verb Agreement", "Linear Equations"
  description TEXT,
  lesson_duration_minutes INTEGER, -- 8 for English, 10 for Math, etc.
  is_active BOOLEAN DEFAULT true
);

-- Lesson content (text, examples)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT REFERENCES modules(id),
  lesson_text TEXT NOT NULL, -- 8-minute lesson content
  created_at TIMESTAMP DEFAULT now()
);

-- Examples within lessons
CREATE TABLE examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT REFERENCES modules(id),
  order_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Practice questions by skill
CREATE TABLE practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT REFERENCES modules(id),
  skill_code TEXT NOT NULL, -- E1.A, E2.S, M1.B, etc.
  question_type TEXT NOT NULL, -- 'practice', 'timed_set', 'mastery_quiz'
  stem TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')),
  time_limit_seconds INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- User progress through curriculum
CREATE TABLE user_module_progress (
  user_id UUID REFERENCES auth.users(id),
  module_id TEXT REFERENCES modules(id),
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked','available','in_progress','completed')),
  lesson_completed BOOLEAN DEFAULT false,
  examples_completed BOOLEAN DEFAULT false,
  practice_completed BOOLEAN DEFAULT false,
  timed_set_completed BOOLEAN DEFAULT false,
  mastery_quiz_score DECIMAL,
  mastery_achieved BOOLEAN DEFAULT false,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  PRIMARY KEY (user_id, module_id)
);

-- Track individual practice attempts
CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  question_id UUID REFERENCES practice_questions(id),
  selected_answer TEXT CHECK (selected_answer IN ('A','B','C','D')),
  is_correct BOOLEAN,
  time_taken_ms INTEGER,
  session_type TEXT NOT NULL, -- 'practice', 'timed_set', 'mastery_quiz'
  created_at TIMESTAMP DEFAULT now()
);
```

### Module Structure Data
```sql
-- English Modules (Phase 1)
INSERT INTO modules VALUES
('E1', 'English', 1, 1, 'Subject–Verb Agreement', 'comp/collective/indefinites; either/neither; tricky prepositional phrases', 8),
('E2', 'English', 1, 2, 'Pronouns', 'case, agreement, ambiguous reference; who/whom; its/it''s', 8),
('E3', 'English', 1, 3, 'Verbs', 'tense, sequence, mood, active vs passive', 8),
('E4', 'English', 1, 4, 'Modifiers & Parallelism', 'dangling/misplaced; comparisons; idioms', 8),
('E5', 'English', 1, 5, 'Punctuation I', 'commas (lists, nonessential), semicolons, colons', 8),
('E6', 'English', 1, 6, 'Punctuation II', 'apostrophes, hyphens, dashes, quotation punctuation', 8),
('E7', 'English', 1, 7, 'Sentence Structure', 'fragments, run-ons, comma splices; coordination vs subordination', 8),
('E8', 'English', 1, 8, 'Rhetorical Skills', 'purpose, relevance, add/delete, transitions, concision, tone/style', 8);

-- Math Modules (Phase 2)
INSERT INTO modules VALUES
('M1', 'Math', 2, 1, 'Number & Quantity', 'exponents/roots, scientific notation, ratios/percent, absolute value, units', 10),
('M2', 'Math', 2, 2, 'Algebra I', 'linear equations/inequalities, systems (graph/sub/eliminate)', 10),
-- ... continue for M3-M10

-- Reading Modules (Phase 3)
INSERT INTO modules VALUES
('R1', 'Reading', 3, 1, 'Question Types', 'main idea, detail, inference, function, vocab-in-context, paired evidence', 6),
-- ... continue for R2-R5

-- Science Modules (Phase 4)
INSERT INTO modules VALUES
('S1', 'Science', 4, 1, 'Data Representation', 'units, scales, trends, interpolation/extrapolation, percent change', 6);
-- ... continue for S2-S5
```

## Data Migration Plan

### Step 1: Clean Current Data
```sql
-- Keep only actual test forms A, B, C
DELETE FROM form_questions WHERE form_id NOT IN ('A', 'B', 'C');
DELETE FROM forms WHERE id NOT IN ('A', 'B', 'C');

-- Move lesson content from questions to practice_questions
-- (Need to map based on skill_code patterns)
```

### Step 2: Import Lesson Content Correctly
- D2EN content → practice_questions with module_id='E1', 'E2', etc. based on skill_code
- Each question tagged with correct module_id and question_type
- Keep skill_code for adaptive practice selection

### Step 3: Create Curriculum UI Components
```typescript
// New components needed:
- ModulePicker (show E1-E8, M1-M10, etc. with progress)
- LessonViewer (8-minute lesson content)
- ExampleViewer (6 examples for English, 5 for Math)
- PracticeRunner (8 practice questions for English, 12 for Math)
- TimedSetRunner (10Q/8min for English, 12Q/12min for Math)
- MasteryQuiz (12Q for English, 15Q for Math)
- ProgressDashboard (module completion, mastery gates)
```

### Step 4: Mastery Gates Logic
```typescript
// English: 2 consecutive module quizzes ≥80% with avg ≤45 sec/Q
// Math: module quiz ≥80% and mini-set ≥75% at 1 min/Q
// Reading: per passage ≥8/10 at ≤9 min
// Science: mini-set ≥80% at ≤40 sec/Q
```

## Curriculum Flow vs Test Simulation Flow

### Curriculum Flow (New)
1. Module Selection (E1, E2, etc.)
2. Lesson (8-10 min content)
3. Examples (5-6 worked examples)
4. Practice Set (8-12 questions)
5. Timed Mini-Set (10Q/8min)
6. Mastery Quiz (12-15 questions)
7. Gate Check → unlock next module

### Test Simulation Flow (Keep Current)
1. Form Selection (A, B, C)
2. Section Selection (EN, MATH, RD, SCI)
3. Full timed section
4. Results and review

## Priority Order for Next Session

1. **Create new curriculum tables**
2. **Import D2EN content as practice_questions** (not forms)
3. **Build ModulePicker component** (show E1-E8 modules)
4. **Build LessonViewer component** (one module working end-to-end)
5. **Test curriculum flow** vs simulation flow

## Files to Update
- `/supabase/migrations/` - new curriculum schema
- `/src/pages/Curriculum.tsx` - new curriculum main page
- `/src/components/ModulePicker.tsx`
- `/src/components/LessonViewer.tsx`
- Update routing in App.tsx

## Content Import Strategy
- Lesson content → lessons table
- D2EN questions → practice_questions with correct module_id mapping
- Keep A/B/C test forms separate for simulation mode
- Skill codes (E1.A, E2.S) link curriculum to adaptive practice

This creates the complete ACT prep app: structured learning (curriculum) + final assessment (test simulation).