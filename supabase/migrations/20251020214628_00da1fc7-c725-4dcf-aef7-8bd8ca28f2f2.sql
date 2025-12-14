-- =====================================================
-- DROP VIEW THAT DEPENDS ON skills.id
-- =====================================================
DROP VIEW IF EXISTS vw_user_skill_stats CASCADE;

-- =====================================================
-- PHASE 1: ARCHIVE & RESTRUCTURE SKILLS TABLE
-- =====================================================

-- Drop existing foreign key constraints on skills.id
ALTER TABLE IF EXISTS lesson_content DROP CONSTRAINT IF EXISTS lesson_content_skill_code_fkey;
ALTER TABLE IF EXISTS progress DROP CONSTRAINT IF EXISTS progress_skill_id_fkey;
ALTER TABLE IF EXISTS mastery DROP CONSTRAINT IF EXISTS mastery_skill_id_fkey;
ALTER TABLE IF EXISTS questions DROP CONSTRAINT IF EXISTS questions_skill_id_fkey;
ALTER TABLE IF EXISTS study_tasks DROP CONSTRAINT IF EXISTS study_tasks_skill_id_fkey;
ALTER TABLE IF EXISTS lesson_schedule DROP CONSTRAINT IF EXISTS lesson_schedule_skill_id_fkey;

-- Clear all related data that references old skill UUIDs
TRUNCATE TABLE lesson_content CASCADE;
TRUNCATE TABLE progress CASCADE;
TRUNCATE TABLE mastery CASCADE;
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE study_tasks CASCADE;
TRUNCATE TABLE lesson_schedule CASCADE;

-- Change skills.id from UUID to TEXT
ALTER TABLE skills ALTER COLUMN id TYPE TEXT;
ALTER TABLE lesson_content ALTER COLUMN skill_code TYPE TEXT;
ALTER TABLE progress ALTER COLUMN skill_id TYPE TEXT;
ALTER TABLE mastery ALTER COLUMN skill_id TYPE TEXT;
ALTER TABLE questions ALTER COLUMN skill_id TYPE TEXT;
ALTER TABLE study_tasks ALTER COLUMN skill_id TYPE TEXT;
ALTER TABLE lesson_schedule ALTER COLUMN skill_id TYPE TEXT;

-- Truncate skills table (clears all 261 old skills)
TRUNCATE TABLE skills CASCADE;

-- =====================================================
-- PHASE 2: INSERT 47 NEW ENGLISH LESSONS
-- =====================================================

INSERT INTO skills (id, name, subject, cluster, order_index, description) VALUES
-- E1: Verbs & Sentence Foundations (7 lessons)
('E1.A', 'Subject–Verb Agreement', 'English', 'Verbs & Sentence Foundations', 1, 'Singular/plural subjects & verbs'),
('E1.B', 'Verb Tense Consistency', 'English', 'Verbs & Sentence Foundations', 2, 'Past/present/future logic & sequence'),
('E1.C', 'Verb Form & Voice', 'English', 'Verbs & Sentence Foundations', 3, 'Infinitives, gerunds, participles, active vs. passive'),
('E1.F1', 'Sentence Boundaries I – Fragments', 'English', 'Verbs & Sentence Foundations', 4, 'Dependent clause errors'),
('E1.F2', 'Sentence Boundaries II – Run-ons & Comma Splices', 'English', 'Verbs & Sentence Foundations', 5, 'Fused sentences & fixes'),
('E1.F3', 'Sentence Boundaries III – Clause Coordination', 'English', 'Verbs & Sentence Foundations', 6, 'Logical joining & subordination'),
('E1.F4', 'Sentence Boundaries IV – Clause Review', 'English', 'Verbs & Sentence Foundations', 7, 'Integration & timed drills'),

-- E2: Pronouns & Agreement (5 lessons)
('E2.D', 'Who vs. Whom (Pronoun Case)', 'English', 'Pronouns & Agreement', 8, 'Subject/object cases'),
('E2.E', 'It''s vs. Its', 'English', 'Pronouns & Agreement', 9, 'Contraction vs. possession'),
('E2.F', 'Pronoun Reference & Ambiguity', 'English', 'Pronouns & Agreement', 10, 'Clear antecedents'),
('E2.G', 'Pronoun Usage (Agreement)', 'English', 'Pronouns & Agreement', 11, 'Singular/plural pronoun logic'),
('E2.T', 'Pronoun Review & Practice', 'English', 'Pronouns & Agreement', 12, 'All pronoun rules combined'),

-- E3: Modifiers & Parallelism (4 lessons)
('E3.A', 'Modifier Placement (Dangling & Misplaced Modifiers)', 'English', 'Modifiers & Parallelism', 13, 'Missing logical subject'),
('E3.B', 'Misplaced Modifiers (Refinement & Practice)', 'English', 'Modifiers & Parallelism', 14, 'Wrong word order'),
('E3.C', 'Parallel Structure', 'English', 'Modifiers & Parallelism', 15, 'Balanced phrasing'),
('E3.D', 'Modifier & Parallelism Review', 'English', 'Modifiers & Parallelism', 16, 'Cumulative drills'),

-- E4: Idioms, Word Choice & Diction (4 lessons)
('E4.K', 'Idioms & Word Choice', 'English', 'Idioms, Word Choice & Diction', 17, 'Correct prepositions, fixed expressions'),
('E4.Q', 'Word Precision & Common Confusions', 'English', 'Idioms, Word Choice & Diction', 18, 'Similar-word confusion (affect/effect)'),
('E4.R', 'Diction & Register', 'English', 'Idioms, Word Choice & Diction', 19, 'Tone & formality'),
('E4.S', 'Vocabulary in Context', 'English', 'Idioms, Word Choice & Diction', 20, 'Meaning, nuance, and ACT context'),

-- E5: Punctuation (8 lessons)
('E5.A', 'Commas – Basics', 'English', 'Punctuation', 21, 'Lists, intro elements, appositives'),
('E5.B', 'Commas – Advanced', 'English', 'Punctuation', 22, 'Nonrestrictive clauses, contrast'),
('E5.C', 'Semicolons', 'English', 'Punctuation', 23, 'Independent clause connections'),
('E5.D', 'Apostrophes (Time & Quantity)', 'English', 'Punctuation', 24, 'Duration/measurement'),
('E5.D2', 'Apostrophes (Irregular Names)', 'English', 'Punctuation', 25, 'Names ending in –s'),
('E5.X', 'Apostrophes (Possessive)', 'English', 'Punctuation', 26, 'Singular/plural possession'),
('E5.E', 'Hyphens', 'English', 'Punctuation', 27, 'Compound adjectives'),
('E5.F', 'Dashes & Colons', 'English', 'Punctuation', 28, 'Emphasis and explanations'),

-- E6: Sentence Combining & Transitions (5 lessons)
('E6.A', 'Sentence Combining', 'English', 'Sentence Combining & Transitions', 29, 'Joining ideas smoothly'),
('E6.B', 'Transitions & Logic', 'English', 'Sentence Combining & Transitions', 30, 'Cause, contrast, addition'),
('E6.C', 'Concision & Wordiness', 'English', 'Sentence Combining & Transitions', 31, 'Trimming redundancy'),
('E6.D', 'Logical Placement', 'English', 'Sentence Combining & Transitions', 32, 'Sentence order & coherence'),
('E6.E', 'Sentence Flow Review', 'English', 'Sentence Combining & Transitions', 33, 'Mixed correction'),

-- E7: Clarity, Style & Concision (4 lessons)
('E7.A', 'Clarity & Redundancy', 'English', 'Clarity, Style & Concision', 34, 'Streamlined expression'),
('E7.B', 'Tone & Style', 'English', 'Clarity, Style & Concision', 35, 'Consistency and precision'),
('E7.C', 'Sentence Variety', 'English', 'Clarity, Style & Concision', 36, 'Avoiding monotony'),
('E7.D', 'Clarity & Style Review', 'English', 'Clarity, Style & Concision', 37, 'Integrated application'),

-- E8: Rhetorical Skills (4 lessons)
('E8.A', 'Organization & Coherence', 'English', 'Rhetorical Skills', 38, 'Logical paragraph structure'),
('E8.B', 'Rhetorical Purpose', 'English', 'Rhetorical Skills', 39, 'Identify intent of sentences/paragraphs'),
('E8.C', 'Paragraph Development', 'English', 'Rhetorical Skills', 40, 'Supporting main ideas'),
('E8.D', 'Rhetorical Skills Review', 'English', 'Rhetorical Skills', 41, 'Strategy integration'),

-- E9: Mixed Mastery & Practice (3 lessons)
('E9.A', 'Grammar & Punctuation Review', 'English', 'Mixed Mastery & Practice', 42, 'E1–E5 mixed drills'),
('E9.B', 'Sentence & Style Review', 'English', 'Mixed Mastery & Practice', 43, 'E6–E7 integration'),
('E9.C', 'Comprehensive Review Test', 'English', 'Mixed Mastery & Practice', 44, 'All concepts, 75-question practice'),

-- E10: Capstone & Timed Practice (3 lessons)
('E10.A', 'ACT English Practice Test 1', 'English', 'Capstone & Timed Practice', 45, 'Full timed section'),
('E10.B', 'ACT English Practice Test 2', 'English', 'Capstone & Timed Practice', 46, 'Full timed section'),
('E10.C', 'Cumulative Grammar Capstone', 'English', 'Capstone & Timed Practice', 47, 'Combined synthesis review');

-- =====================================================
-- PHASE 3: ADD LESSON_CODE TO STAGING_ITEMS
-- =====================================================

ALTER TABLE staging_items ADD COLUMN IF NOT EXISTS lesson_code TEXT;
ALTER TABLE staging_items ADD CONSTRAINT staging_items_lesson_code_fkey 
  FOREIGN KEY (lesson_code) REFERENCES skills(id);

-- =====================================================
-- PHASE 4: RE-ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

ALTER TABLE lesson_content ADD CONSTRAINT lesson_content_skill_code_fkey 
  FOREIGN KEY (skill_code) REFERENCES skills(id);
  
ALTER TABLE progress ADD CONSTRAINT progress_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES skills(id);
  
ALTER TABLE mastery ADD CONSTRAINT mastery_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES skills(id);
  
ALTER TABLE questions ADD CONSTRAINT questions_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES skills(id);
  
ALTER TABLE study_tasks ADD CONSTRAINT study_tasks_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES skills(id);
  
ALTER TABLE lesson_schedule ADD CONSTRAINT lesson_schedule_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES skills(id);

-- =====================================================
-- PHASE 5: RECREATE VIEW WITH TEXT SKILL_ID
-- =====================================================

CREATE OR REPLACE VIEW vw_user_skill_stats AS
SELECT 
  p.user_id,
  p.skill_id,
  s.name AS skill_name,
  s.subject,
  s.cluster,
  p.seen,
  p.correct,
  CASE WHEN p.seen > 0 THEN ROUND((p.correct::numeric / p.seen * 100), 2) ELSE 0 END AS accuracy_percentage,
  p.mastery_level,
  p.median_time_ms AS progress_median_time_ms,
  p.updated_at AS last_seen_progress,
  m.correct AS mastery_correct,
  m.total AS mastery_total,
  CASE WHEN m.total > 0 THEN ROUND((m.correct::numeric / m.total), 4) ELSE NULL END AS combined_accuracy,
  m.avg_time_ms AS effective_median_time_ms,
  m.last_updated,
  COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'COMPLETED') AS recent_completed_tasks,
  COUNT(DISTINCT st.id) AS recent_tasks_count,
  MAX(st.the_date) AS last_task_date,
  AVG(st.accuracy) FILTER (WHERE st.status = 'COMPLETED') AS recent_avg_accuracy,
  AVG(st.median_time_ms) FILTER (WHERE st.status = 'COMPLETED') AS recent_avg_time_ms
FROM progress p
LEFT JOIN skills s ON p.skill_id = s.id
LEFT JOIN mastery m ON m.user_id = p.user_id AND m.skill_id = p.skill_id
LEFT JOIN study_tasks st ON st.user_id = p.user_id AND st.skill_id = p.skill_id
GROUP BY 
  p.user_id, p.skill_id, s.name, s.subject, s.cluster,
  p.seen, p.correct, p.mastery_level, p.median_time_ms, p.updated_at,
  m.correct, m.total, m.avg_time_ms, m.last_updated;