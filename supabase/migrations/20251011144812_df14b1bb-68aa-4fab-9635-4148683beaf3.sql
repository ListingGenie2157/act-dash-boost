-- Create lesson_content table for rich instructional content
CREATE TABLE lesson_content (
  skill_code UUID PRIMARY KEY REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Main content sections (stored as HTML from Markdown)
  overview_html TEXT NOT NULL,
  objectives TEXT[], -- Array of learning objectives
  concept_explanation TEXT NOT NULL, -- Detailed rules and examples
  guided_practice TEXT, -- Step-by-step walkthroughs
  error_analysis TEXT, -- Common ACT traps
  
  -- Metadata
  estimated_minutes INTEGER DEFAULT 15,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "lesson_content_public_read" 
  ON lesson_content FOR SELECT 
  USING (true);

-- Admin-only write access
CREATE POLICY "lesson_content_admin_all" 
  ON lesson_content FOR ALL 
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_lesson_content
  BEFORE UPDATE ON lesson_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lesson_content IS 'Rich instructional content for lessons (concept explanations, guided practice, tips)';

-- Create lesson_schedule table for time-adaptive study plans
CREATE TABLE lesson_schedule (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  the_date DATE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, the_date, skill_id)
);

-- Enable RLS
ALTER TABLE lesson_schedule ENABLE ROW LEVEL SECURITY;

-- Users can view/manage own schedule
CREATE POLICY "Users can view own schedule" 
  ON lesson_schedule FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule" 
  ON lesson_schedule FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule" 
  ON lesson_schedule FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE INDEX idx_lesson_schedule_user_date ON lesson_schedule(user_id, the_date);
CREATE INDEX idx_lesson_schedule_user_skill ON lesson_schedule(user_id, skill_id);

COMMENT ON TABLE lesson_schedule IS 'Pre-calculated lesson distribution schedule for time-adaptive study plans';