-- Create calculator_practice table for tracking user progress
CREATE TABLE calculator_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  calculator_model text NOT NULL DEFAULT 'TI-84',
  mode text NOT NULL CHECK (mode IN ('guided', 'challenge')),
  time_saved_ms integer,
  completion_time_ms integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id, mode)
);

-- Enable RLS
ALTER TABLE calculator_practice ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own calculator practice"
  ON calculator_practice FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculator practice"
  ON calculator_practice FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculator practice"
  ON calculator_practice FOR UPDATE
  USING (auth.uid() = user_id);