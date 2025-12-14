-- Milestone 2: Schema alignment for study tasks and planner metadata

-- Ensure study_tasks has extended metadata columns
ALTER TABLE public.study_tasks
  ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'CORE',
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS is_critical BOOLEAN NOT NULL DEFAULT false;

-- Enforce not-null after backfilling default
ALTER TABLE public.study_tasks
  ALTER COLUMN phase SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'study_tasks_phase_not_empty'
      AND conrelid = 'public.study_tasks'::regclass
  ) THEN
    ALTER TABLE public.study_tasks
      ADD CONSTRAINT study_tasks_phase_not_empty
      CHECK (char_length(phase) > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'study_tasks_time_limit_positive'
      AND conrelid = 'public.study_tasks'::regclass
  ) THEN
    ALTER TABLE public.study_tasks
      ADD CONSTRAINT study_tasks_time_limit_positive
      CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0);
  END IF;
END
$$;

-- Flag task importance for prioritisation queries
CREATE INDEX IF NOT EXISTS idx_study_tasks_user_phase
  ON public.study_tasks (user_id, phase);

CREATE INDEX IF NOT EXISTS idx_study_tasks_user_critical
  ON public.study_tasks (user_id, the_date)
  WHERE is_critical IS TRUE;

-- Planner day level metadata
ALTER TABLE public.study_plan_days
  ADD COLUMN IF NOT EXISTS is_light_day BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_study_plan_days_light
  ON public.study_plan_days (user_id, the_date)
  WHERE is_light_day IS TRUE;

-- Enable and tighten row level security policies
ALTER TABLE public.mastery ENABLE ROW LEVEL SECURITY;

-- Profiles policies with WITH CHECK protections
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Study plan day policies
DROP POLICY IF EXISTS "Users can view their own study plans" ON public.study_plan_days;
CREATE POLICY "Users can view their own study plans"
  ON public.study_plan_days FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own study plans" ON public.study_plan_days;
CREATE POLICY "Users can insert their own study plans"
  ON public.study_plan_days FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study plans" ON public.study_plan_days;
CREATE POLICY "Users can update their own study plans"
  ON public.study_plan_days FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Study task policies
DROP POLICY IF EXISTS "Users can view their own study tasks" ON public.study_tasks;
CREATE POLICY "Users can view their own study tasks"
  ON public.study_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own study tasks" ON public.study_tasks;
CREATE POLICY "Users can insert their own study tasks"
  ON public.study_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study tasks" ON public.study_tasks;
CREATE POLICY "Users can update their own study tasks"
  ON public.study_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Review queue policies
DROP POLICY IF EXISTS "Users can view their own review queue" ON public.review_queue;
CREATE POLICY "Users can view their own review queue"
  ON public.review_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own review items" ON public.review_queue;
CREATE POLICY "Users can insert their own review items"
  ON public.review_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own review items" ON public.review_queue;
CREATE POLICY "Users can update their own review items"
  ON public.review_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own review items" ON public.review_queue;
CREATE POLICY "Users can delete their own review items"
  ON public.review_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Mastery policies
DROP POLICY IF EXISTS "Users can manage their own mastery" ON public.mastery;
CREATE POLICY "Users can manage their own mastery"
  ON public.mastery FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
