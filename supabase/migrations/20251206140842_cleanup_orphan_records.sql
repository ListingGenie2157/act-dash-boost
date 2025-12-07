-- =============================================================================
-- Migration: Cleanup Orphan Records
-- Purpose: Remove records with user_ids that don't exist in auth.users
--          This must run BEFORE adding FK constraints
-- =============================================================================

-- Create a temporary log table to track what was deleted
CREATE TABLE IF NOT EXISTS _orphan_cleanup_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  orphan_count INTEGER NOT NULL,
  cleaned_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- SECTION 1: Cleanup orphan records from each table
-- =============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 1. accommodations
  DELETE FROM accommodations 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('accommodations', v_count);
    RAISE NOTICE 'Deleted % orphan records from accommodations', v_count;
  END IF;

  -- 2. attempts
  DELETE FROM attempts 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('attempts', v_count);
    RAISE NOTICE 'Deleted % orphan records from attempts', v_count;
  END IF;

  -- 3. calculator_practice
  DELETE FROM calculator_practice 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('calculator_practice', v_count);
    RAISE NOTICE 'Deleted % orphan records from calculator_practice', v_count;
  END IF;

  -- 4. diagnostics
  DELETE FROM diagnostics 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('diagnostics', v_count);
    RAISE NOTICE 'Deleted % orphan records from diagnostics', v_count;
  END IF;

  -- 5. sessions
  DELETE FROM sessions 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('sessions', v_count);
    RAISE NOTICE 'Deleted % orphan records from sessions', v_count;
  END IF;

  -- 6. sim_results
  DELETE FROM sim_results 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('sim_results', v_count);
    RAISE NOTICE 'Deleted % orphan records from sim_results', v_count;
  END IF;

  -- 7. tutor_sessions
  DELETE FROM tutor_sessions 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('tutor_sessions', v_count);
    RAISE NOTICE 'Deleted % orphan records from tutor_sessions', v_count;
  END IF;

  -- 8. user_goals
  DELETE FROM user_goals 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('user_goals', v_count);
    RAISE NOTICE 'Deleted % orphan records from user_goals', v_count;
  END IF;

  -- 9. user_preferences
  DELETE FROM user_preferences 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('user_preferences', v_count);
    RAISE NOTICE 'Deleted % orphan records from user_preferences', v_count;
  END IF;

  -- 10. user_roles
  DELETE FROM user_roles 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('user_roles', v_count);
    RAISE NOTICE 'Deleted % orphan records from user_roles', v_count;
  END IF;

  -- 11. mastery
  DELETE FROM mastery 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('mastery', v_count);
    RAISE NOTICE 'Deleted % orphan records from mastery', v_count;
  END IF;

  -- 12. progress
  DELETE FROM progress 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('progress', v_count);
    RAISE NOTICE 'Deleted % orphan records from progress', v_count;
  END IF;

  -- 13. review_queue
  DELETE FROM review_queue 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('review_queue', v_count);
    RAISE NOTICE 'Deleted % orphan records from review_queue', v_count;
  END IF;

  -- 14. error_bank
  DELETE FROM error_bank 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('error_bank', v_count);
    RAISE NOTICE 'Deleted % orphan records from error_bank', v_count;
  END IF;

  -- 15. study_plan_days
  DELETE FROM study_plan_days 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('study_plan_days', v_count);
    RAISE NOTICE 'Deleted % orphan records from study_plan_days', v_count;
  END IF;

  -- 16. study_tasks
  DELETE FROM study_tasks 
  WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('study_tasks', v_count);
    RAISE NOTICE 'Deleted % orphan records from study_tasks', v_count;
  END IF;

  -- 17. profiles (special case - id references auth.users.id directly)
  DELETE FROM profiles 
  WHERE id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('profiles', v_count);
    RAISE NOTICE 'Deleted % orphan records from profiles', v_count;
  END IF;

END $$;

-- =============================================================================
-- SECTION 2: Cleanup orphan question references
-- =============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- attempts with invalid question_id
  DELETE FROM attempts 
  WHERE question_id IS NOT NULL 
    AND question_id NOT IN (SELECT id FROM questions);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('attempts (question_id)', v_count);
    RAISE NOTICE 'Deleted % orphan question references from attempts', v_count;
  END IF;

  -- attempts with invalid form_id
  DELETE FROM attempts 
  WHERE form_id IS NOT NULL 
    AND form_id NOT IN (SELECT id FROM forms);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('attempts (form_id)', v_count);
    RAISE NOTICE 'Deleted % orphan form references from attempts', v_count;
  END IF;

  -- review_queue with invalid question_id
  DELETE FROM review_queue 
  WHERE question_id IS NOT NULL 
    AND question_id NOT IN (SELECT id FROM questions);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('review_queue (question_id)', v_count);
    RAISE NOTICE 'Deleted % orphan question references from review_queue', v_count;
  END IF;

  -- error_bank with invalid question_id
  DELETE FROM error_bank 
  WHERE question_id IS NOT NULL 
    AND question_id NOT IN (SELECT id FROM questions);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('error_bank (question_id)', v_count);
    RAISE NOTICE 'Deleted % orphan question references from error_bank', v_count;
  END IF;

  -- mastery with invalid skill_id
  DELETE FROM mastery 
  WHERE skill_id IS NOT NULL 
    AND skill_id NOT IN (SELECT id FROM skills);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('mastery (skill_id)', v_count);
    RAISE NOTICE 'Deleted % orphan skill references from mastery', v_count;
  END IF;

  -- progress with invalid skill_id
  DELETE FROM progress 
  WHERE skill_id IS NOT NULL 
    AND skill_id NOT IN (SELECT id FROM skills);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    INSERT INTO _orphan_cleanup_log (table_name, orphan_count) VALUES ('progress (skill_id)', v_count);
    RAISE NOTICE 'Deleted % orphan skill references from progress', v_count;
  END IF;

END $$;

-- =============================================================================
-- SECTION 3: Report summary
-- =============================================================================

DO $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(orphan_count), 0) INTO v_total FROM _orphan_cleanup_log;
  
  IF v_total > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ORPHAN CLEANUP COMPLETE';
    RAISE NOTICE 'Total orphan records deleted: %', v_total;
    RAISE NOTICE 'See _orphan_cleanup_log table for details';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE 'No orphan records found. Database is clean!';
  END IF;
END $$;
