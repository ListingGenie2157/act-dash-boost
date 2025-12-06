-- =============================================================================
-- Migration: Fix Missing Foreign Keys and Indexes
-- Purpose: Add proper FK constraints with ON DELETE behavior and performance indexes
-- =============================================================================

-- =============================================================================
-- SECTION 1: ADD MISSING FOREIGN KEYS
-- =============================================================================

-- 1.1 accommodations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accommodations_user_id_fkey'
  ) THEN
    ALTER TABLE accommodations 
    ADD CONSTRAINT accommodations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.2 attempts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_user_id_fkey'
  ) THEN
    ALTER TABLE attempts 
    ADD CONSTRAINT attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_question_id_fkey'
  ) THEN
    ALTER TABLE attempts 
    ADD CONSTRAINT attempts_question_id_fkey 
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_form_id_fkey'
  ) THEN
    ALTER TABLE attempts 
    ADD CONSTRAINT attempts_form_id_fkey 
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.3 calculator_practice table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calculator_practice_user_id_fkey'
  ) THEN
    ALTER TABLE calculator_practice 
    ADD CONSTRAINT calculator_practice_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.4 diagnostics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diagnostics_user_id_fkey'
  ) THEN
    ALTER TABLE diagnostics 
    ADD CONSTRAINT diagnostics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.5 sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE sessions 
    ADD CONSTRAINT sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.6 sim_results table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sim_results_user_id_fkey'
  ) THEN
    ALTER TABLE sim_results 
    ADD CONSTRAINT sim_results_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.7 tutor_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tutor_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE tutor_sessions 
    ADD CONSTRAINT tutor_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.8 user_goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_goals_user_id_fkey'
  ) THEN
    ALTER TABLE user_goals 
    ADD CONSTRAINT user_goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.9 user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_user_id_fkey'
  ) THEN
    ALTER TABLE user_preferences 
    ADD CONSTRAINT user_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.10 user_roles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE user_roles 
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.11 mastery table (add FK to skills if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mastery_user_id_fkey'
  ) THEN
    ALTER TABLE mastery 
    ADD CONSTRAINT mastery_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mastery_skill_id_fkey'
  ) THEN
    ALTER TABLE mastery 
    ADD CONSTRAINT mastery_skill_id_fkey 
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- SECTION 2: ADD MISSING INDEXES FOR user_id COLUMNS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_accommodations_user_id ON accommodations(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_practice_user_id ON calculator_practice(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_results_user_id ON sim_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user_id ON tutor_sessions(user_id);

-- Additional composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_diagnostics_user_section ON diagnostics(user_id, section);
CREATE INDEX IF NOT EXISTS idx_diagnostics_user_completed ON diagnostics(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_user_question ON attempts(user_id, question_id);

-- =============================================================================
-- SECTION 3: DOCUMENTATION COMMENTS
-- =============================================================================

COMMENT ON CONSTRAINT accommodations_user_id_fkey ON accommodations IS 'Cascades on user deletion';
COMMENT ON CONSTRAINT diagnostics_user_id_fkey ON diagnostics IS 'Cascades on user deletion';
COMMENT ON CONSTRAINT sessions_user_id_fkey ON sessions IS 'Cascades on user deletion';
COMMENT ON CONSTRAINT sim_results_user_id_fkey ON sim_results IS 'Cascades on user deletion';
