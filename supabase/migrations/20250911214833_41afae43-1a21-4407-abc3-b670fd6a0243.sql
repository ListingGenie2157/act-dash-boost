-- Create core ACT planner schema with RLS policies

-- Skills table (global data, no user-specific access needed)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL CHECK (subject IN ('English', 'Math', 'Reading', 'Science')),
    cluster TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    prereq_skill_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table (linked to skills, global data)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    stem TEXT NOT NULL,
    choice_a TEXT NOT NULL,
    choice_b TEXT NOT NULL,
    choice_c TEXT NOT NULL,
    choice_d TEXT NOT NULL,
    answer CHAR(1) NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    time_limit_secs INTEGER DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles table (since we can't modify auth.users directly)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    test_date DATE,
    daily_time_cap_mins INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Progress table (user-specific data)
CREATE TABLE IF NOT EXISTS public.progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    seen INTEGER DEFAULT 0,
    correct INTEGER DEFAULT 0,
    median_time_ms INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, skill_id)
);

-- Review queue table (spaced repetition system)
CREATE TABLE IF NOT EXISTS public.review_queue (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    due_at TIMESTAMPTZ NOT NULL,
    interval_days INTEGER NOT NULL,
    ease INTEGER DEFAULT 250,
    lapses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, question_id)
);

-- Error bank table (tracks missed questions)
CREATE TABLE IF NOT EXISTS public.error_bank (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    last_missed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    miss_count INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, question_id)
);

-- Study plan days table (daily study plans)
CREATE TABLE IF NOT EXISTS public.study_plan_days (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    the_date DATE NOT NULL,
    tasks_json JSONB,
    generated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, the_date)
);

-- Study tasks table (individual study tasks)
CREATE TABLE IF NOT EXISTS public.study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    the_date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('LEARN', 'DRILL', 'MIXED', 'REVIEW', 'SIM')),
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    size INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DONE', 'SKIPPED')),
    accuracy NUMERIC,
    median_time_ms INTEGER,
    reward_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

-- Skills table policies (public read access, no user-specific data)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Skills are viewable by authenticated users" ON public.skills;
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can view their own review queue" ON public.review_queue;
DROP POLICY IF EXISTS "Users can insert their own review items" ON public.review_queue;
DROP POLICY IF EXISTS "Users can update their own review items" ON public.review_queue;
DROP POLICY IF EXISTS "Users can delete their own review items" ON public.review_queue;
DROP POLICY IF EXISTS "Users can view their own error bank" ON public.error_bank;
DROP POLICY IF EXISTS "Users can insert their own errors" ON public.error_bank;
DROP POLICY IF EXISTS "Users can update their own errors" ON public.error_bank;
DROP POLICY IF EXISTS "Users can view their own study plans" ON public.study_plan_days;
DROP POLICY IF EXISTS "Users can insert their own study plans" ON public.study_plan_days;
DROP POLICY IF EXISTS "Users can update their own study plans" ON public.study_plan_days;
DROP POLICY IF EXISTS "Users can view their own study tasks" ON public.study_tasks;
DROP POLICY IF EXISTS "Users can insert their own study tasks" ON public.study_tasks;
DROP POLICY IF EXISTS "Users can update their own study tasks" ON public.study_tasks;

-- Create policies
CREATE POLICY "Skills are viewable by authenticated users" 
ON public.skills FOR SELECT 
TO authenticated 
USING (true);

-- Questions table policies (public read access for authenticated users)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are viewable by authenticated users" 
ON public.questions FOR SELECT 
TO authenticated 
USING (true);

-- Profiles table policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Progress table policies
CREATE POLICY "Users can view their own progress" 
ON public.progress FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.progress FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.progress FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Review queue policies
CREATE POLICY "Users can view their own review queue" 
ON public.review_queue FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review items" 
ON public.review_queue FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review items" 
ON public.review_queue FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review items" 
ON public.review_queue FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Error bank policies
CREATE POLICY "Users can view their own error bank" 
ON public.error_bank FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own errors" 
ON public.error_bank FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own errors" 
ON public.error_bank FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Study plan days policies
CREATE POLICY "Users can view their own study plans" 
ON public.study_plan_days FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study plans" 
ON public.study_plan_days FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans" 
ON public.study_plan_days FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Study tasks policies
CREATE POLICY "Users can view their own study tasks" 
ON public.study_tasks FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study tasks" 
ON public.study_tasks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study tasks" 
ON public.study_tasks FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skills_subject ON public.skills(subject);
CREATE INDEX IF NOT EXISTS idx_skills_order ON public.skills(order_index);
CREATE INDEX IF NOT EXISTS idx_questions_skill_id ON public.questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_due ON public.review_queue(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_error_bank_user_id ON public.error_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_user_date ON public.study_plan_days(user_id, the_date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_user_date ON public.study_tasks(user_id, the_date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_status ON public.study_tasks(status);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers where appropriate
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_progress_updated_at') THEN
        CREATE TRIGGER update_progress_updated_at
            BEFORE UPDATE ON public.progress
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;