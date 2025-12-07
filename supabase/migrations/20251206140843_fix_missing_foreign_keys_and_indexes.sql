-- =============================================================================
-- Migration: Fix Missing Foreign Keys and Indexes
-- Purpose: Add proper FK constraints with ON DELETE behavior and performance indexes
-- =============================================================================

-- =============================================================================
-- SECTION 1: ADD MISSING INDEXES FOR user_id COLUMNS (Do this first - no dependencies)
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
-- SECTION 2: ADD MISSING FOREIGN KEYS
-- Note: These are wrapped in exception handlers to gracefully handle:
--   - Existing constraints with the same name
--   - Existing constraints with different names
--   - Data integrity issues (orphan records)
-- =============================================================================

-- Helper function to safely add FK constraints
CREATE OR REPLACE FUNCTION safe_add_fk_constraint(
  p_table_name text,
  p_constraint_name text,
  p_column_name text,
  p_ref_table text,
  p_ref_column text,
  p_on_delete text DEFAULT 'CASCADE'
) RETURNS void AS $$
DECLARE
  v_has_constraint boolean;
BEGIN
  -- Check if any FK constraint already exists on this column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = p_table_name
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = p_column_name
  ) INTO v_has_constraint;
  
  IF NOT v_has_constraint THEN
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%I) ON DELETE %s',
      p_table_name,
      p_constraint_name,
      p_column_name,
      p_ref_table,
      p_ref_column,
      p_on_delete
    );
    RAISE NOTICE 'Added FK constraint % on %.%', p_constraint_name, p_table_name, p_column_name;
  ELSE
    RAISE NOTICE 'FK constraint already exists on %.%, skipping', p_table_name, p_column_name;
  END IF;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE WARNING 'Cannot add FK % on %.%: orphan records exist. Clean up data first.', 
      p_constraint_name, p_table_name, p_column_name;
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint % already exists, skipping', p_constraint_name;
  WHEN OTHERS THEN
    RAISE WARNING 'Error adding FK % on %.%: %', p_constraint_name, p_table_name, p_column_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Apply FK constraints to all tables
DO $$
BEGIN
  -- accommodations
  PERFORM safe_add_fk_constraint('accommodations', 'accommodations_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- attempts
  PERFORM safe_add_fk_constraint('attempts', 'attempts_user_id_fkey', 'user_id', 'auth.users', 'id');
  PERFORM safe_add_fk_constraint('attempts', 'attempts_question_id_fkey', 'question_id', 'questions', 'id');
  PERFORM safe_add_fk_constraint('attempts', 'attempts_form_id_fkey', 'form_id', 'forms', 'id');
  
  -- calculator_practice
  PERFORM safe_add_fk_constraint('calculator_practice', 'calculator_practice_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- diagnostics
  PERFORM safe_add_fk_constraint('diagnostics', 'diagnostics_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- sessions
  PERFORM safe_add_fk_constraint('sessions', 'sessions_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- sim_results
  PERFORM safe_add_fk_constraint('sim_results', 'sim_results_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- tutor_sessions
  PERFORM safe_add_fk_constraint('tutor_sessions', 'tutor_sessions_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- user_goals
  PERFORM safe_add_fk_constraint('user_goals', 'user_goals_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- user_preferences
  PERFORM safe_add_fk_constraint('user_preferences', 'user_preferences_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- user_roles
  PERFORM safe_add_fk_constraint('user_roles', 'user_roles_user_id_fkey', 'user_id', 'auth.users', 'id');
  
  -- mastery
  PERFORM safe_add_fk_constraint('mastery', 'mastery_user_id_fkey', 'user_id', 'auth.users', 'id');
  PERFORM safe_add_fk_constraint('mastery', 'mastery_skill_id_fkey', 'skill_id', 'skills', 'id');
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS safe_add_fk_constraint(text, text, text, text, text, text);
