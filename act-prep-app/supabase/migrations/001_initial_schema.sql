-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE section_type AS ENUM ('EN', 'MATH', 'RD', 'SCI', 'FULL');
CREATE TYPE session_mode AS ENUM ('diagnostic', 'drill', 'timed', 'review');
CREATE TYPE task_type AS ENUM ('drill', 'timed', 'review', 'diagnostic');

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passages table
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  section section_type NOT NULL,
  passage_type TEXT NOT NULL,
  title TEXT NOT NULL,
  passage_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section section_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stem TEXT NOT NULL,
  answer TEXT NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  explanation TEXT NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  time_limit_secs INTEGER,
  stem_hash TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form questions junction table
CREATE TABLE form_questions (
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  section section_type NOT NULL,
  ord INTEGER NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES passages(id) ON DELETE SET NULL,
  PRIMARY KEY (form_id, section, ord)
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES forms(id),
  section section_type NOT NULL,
  mode session_mode NOT NULL,
  time_limit_sec INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Attempts table
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  form_id UUID NOT NULL REFERENCES forms(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  question_ord INTEGER NOT NULL,
  choice_order INTEGER[] NOT NULL CHECK (array_length(choice_order, 1) = 4),
  correct_idx SMALLINT NOT NULL CHECK (correct_idx BETWEEN 0 AND 3),
  selected_idx SMALLINT CHECK (selected_idx IS NULL OR selected_idx BETWEEN 0 AND 3),
  time_spent_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review queue table
CREATE TABLE review_queue (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ NOT NULL,
  interval_days INTEGER DEFAULT 2,
  ease NUMERIC(3,2) DEFAULT 2.5,
  lapses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- User preferences table
CREATE TABLE user_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_ok BOOLEAN DEFAULT false,
  push_ok BOOLEAN DEFAULT false,
  quiet_start TIME,
  quiet_end TIME,
  reduced_motion BOOLEAN DEFAULT false,
  dyslexia_font BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal table
CREATE TABLE goal (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  daily_target_minutes INTEGER DEFAULT 25,
  preferred_window TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accommodations table
CREATE TABLE accommodations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  time_multiplier INTEGER DEFAULT 100 CHECK (time_multiplier IN (100, 150, 200)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study plan days table
CREATE TABLE study_plan_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  target_minutes INTEGER NOT NULL,
  completed_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Study tasks table
CREATE TABLE study_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_day_id UUID NOT NULL REFERENCES study_plan_days(id) ON DELETE CASCADE,
  task_type task_type NOT NULL,
  section section_type,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  estimated_minutes INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for form sections
CREATE OR REPLACE VIEW v_form_section AS
SELECT 
  fq.form_id,
  fq.section,
  fq.ord,
  fq.question_id,
  fq.passage_id,
  q.stem,
  q.choice_a,
  q.choice_b,
  q.choice_c,
  q.choice_d,
  q.answer,
  q.difficulty,
  q.explanation,
  q.skill_id,
  p.title as passage_title,
  p.passage_text
FROM form_questions fq
JOIN questions q ON fq.question_id = q.id
LEFT JOIN passages p ON fq.passage_id = p.id
ORDER BY fq.form_id, fq.section, fq.ord;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_session_id ON attempts(session_id);
CREATE INDEX idx_attempts_question_id ON attempts(question_id);
CREATE INDEX idx_review_queue_user_due ON review_queue(user_id, due_at);
CREATE INDEX idx_questions_stem_hash ON questions(stem_hash);
CREATE INDEX idx_form_questions_form_section ON form_questions(form_id, section);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content tables (read-only for all authenticated users)
CREATE POLICY "Content readable by all authenticated users" ON forms
  FOR SELECT USING (true);

CREATE POLICY "Content readable by all authenticated users" ON passages
  FOR SELECT USING (true);

CREATE POLICY "Content readable by all authenticated users" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Content readable by all authenticated users" ON form_questions
  FOR SELECT USING (true);

CREATE POLICY "Content readable by all authenticated users" ON skills
  FOR SELECT USING (true);

-- RLS Policies for user-owned tables
CREATE POLICY "Users can manage their own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own attempts" ON attempts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own review queue" ON review_queue
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON user_prefs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals" ON goal
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own accommodations" ON accommodations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own study plans" ON study_plan_days
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own study tasks" ON study_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_plan_days 
      WHERE study_plan_days.id = study_tasks.plan_day_id 
      AND study_plan_days.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own study tasks" ON study_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_plan_days 
      WHERE study_plan_days.id = study_tasks.plan_day_id 
      AND study_plan_days.user_id = auth.uid()
    )
  );

-- Admin users can only be viewed by admins
CREATE POLICY "Admin table viewable by admins only" ON admin_users
  FOR SELECT USING (is_admin());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_attempts_updated_at BEFORE UPDATE ON attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_prefs_updated_at BEFORE UPDATE ON user_prefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_updated_at BEFORE UPDATE ON goal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();