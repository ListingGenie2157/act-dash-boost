-- Create sessions table for simulation tracking
CREATE TABLE IF NOT EXISTS sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_id TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('EN', 'MATH', 'RD', 'SCI')),
  mode TEXT NOT NULL CHECK (mode IN ('simulation', 'practice', 'booster')),
  time_limit_sec INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create responses table for individual question answers
CREATE TABLE IF NOT EXISTS responses (
  session_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected CHAR(1) NOT NULL CHECK (selected IN ('A', 'B', 'C', 'D')),
  correct BOOLEAN NOT NULL,
  time_ms INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, question_id)
);

-- Create mastery table for skill progress tracking
CREATE TABLE IF NOT EXISTS mastery (
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  avg_time_ms INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

-- Enable RLS on new tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Users can insert their own sessions" 
ON sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" 
ON sessions FOR SELECT 
USING (auth.uid() = user_id);

-- Create RLS policies for responses
CREATE POLICY "Users can insert their own responses" 
ON responses FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM sessions WHERE id = session_id));

CREATE POLICY "Users can update their own responses" 
ON responses FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM sessions WHERE id = session_id));

CREATE POLICY "Users can view their own responses" 
ON responses FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM sessions WHERE id = session_id));

-- Create RLS policies for mastery
CREATE POLICY "Users can insert their own mastery" 
ON mastery FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery" 
ON mastery FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own mastery" 
ON mastery FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger function to update mastery on response submission
CREATE OR REPLACE FUNCTION update_mastery_on_response()
RETURNS TRIGGER AS $$
DECLARE
  question_skill_id UUID;
  session_user_id UUID;
BEGIN
  -- Get skill_id from question and user_id from session
  SELECT q.skill_id, s.user_id INTO question_skill_id, session_user_id
  FROM questions q
  JOIN sessions s ON s.id = NEW.session_id
  WHERE q.id = NEW.question_id;
  
  -- Skip if no skill_id found
  IF question_skill_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Upsert mastery record
  INSERT INTO mastery (user_id, skill_id, total, correct, avg_time_ms, last_updated)
  VALUES (
    session_user_id,
    question_skill_id,
    1,
    CASE WHEN NEW.correct THEN 1 ELSE 0 END,
    NEW.time_ms,
    now()
  )
  ON CONFLICT (user_id, skill_id) DO UPDATE SET
    total = mastery.total + 1,
    correct = mastery.correct + CASE WHEN NEW.correct THEN 1 ELSE 0 END,
    avg_time_ms = ((mastery.avg_time_ms * mastery.total) + NEW.time_ms) / (mastery.total + 1),
    last_updated = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update mastery on response insert/update
CREATE TRIGGER update_mastery_trigger
  AFTER INSERT OR UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_mastery_on_response();

-- Add foreign key constraints
ALTER TABLE responses ADD CONSTRAINT responses_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_form_section ON sessions(form_id, section);
CREATE INDEX idx_responses_session_id ON responses(session_id);
CREATE INDEX idx_mastery_user_skill ON mastery(user_id, skill_id);
CREATE INDEX idx_mastery_skill_accuracy ON mastery(skill_id, (correct::FLOAT / NULLIF(total, 0)));