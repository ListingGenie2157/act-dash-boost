-- =============================================================================
-- Migration: Consolidate mastery and progress tables
-- Purpose: Create unified view for skill mastery tracking
-- =============================================================================

-- BACKGROUND:
-- The codebase has two overlapping tables for tracking user skill performance:
-- 1. progress: user_id, skill_id, seen, correct, median_time_ms, mastery_level
-- 2. mastery: user_id, skill_id, total, correct, avg_time_ms, last_updated
--
-- The `mastery` table is automatically updated via a trigger on `responses` table.
-- The `progress` table is manually updated in Edge Functions.
--
-- This migration creates a unified view that combines both data sources.

-- =============================================================================
-- STEP 1: Add mastery_level column to mastery table for unified storage
-- =============================================================================

ALTER TABLE mastery ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0;

-- =============================================================================
-- STEP 2: Create unified view combining both tables
-- =============================================================================

-- Drop existing view if it exists (from prior attempts)
DROP VIEW IF EXISTS vw_user_skill_stats;

CREATE OR REPLACE VIEW vw_user_skill_stats AS
WITH mastery_data AS (
  SELECT 
    m.user_id,
    m.skill_id,
    m.total as mastery_total,
    m.correct as mastery_correct,
    m.avg_time_ms as mastery_avg_time_ms,
    m.last_updated,
    CASE 
      WHEN m.total = 0 THEN 0
      ELSE ROUND((m.correct::NUMERIC / m.total) * 100, 1)
    END as accuracy_percentage
  FROM mastery m
),
progress_data AS (
  SELECT 
    p.user_id,
    p.skill_id,
    p.seen,
    p.correct,
    p.median_time_ms as progress_median_time_ms,
    p.mastery_level,
    p.updated_at as last_seen_progress
  FROM progress p
),
-- Recent task performance (last 7 days)
recent_tasks AS (
  SELECT 
    st.user_id,
    st.skill_id,
    COUNT(*) as recent_tasks_count,
    COUNT(*) FILTER (WHERE st.status = 'COMPLETED') as recent_completed_tasks,
    AVG(st.accuracy) FILTER (WHERE st.status = 'COMPLETED') as recent_avg_accuracy,
    AVG(st.median_time_ms) FILTER (WHERE st.status = 'COMPLETED') as recent_avg_time_ms,
    MAX(st.the_date) as last_task_date
  FROM study_tasks st
  WHERE st.the_date >= CURRENT_DATE - INTERVAL '7 days'
    AND st.skill_id IS NOT NULL
  GROUP BY st.user_id, st.skill_id
)
SELECT 
  COALESCE(md.user_id, pd.user_id, rt.user_id) as user_id,
  COALESCE(md.skill_id, pd.skill_id, rt.skill_id) as skill_id,
  s.name as skill_name,
  s.subject,
  s.cluster,
  -- From mastery table (trigger-updated)
  md.mastery_total,
  md.mastery_correct,
  md.accuracy_percentage,
  md.last_updated,
  -- From progress table (manually-updated)
  pd.seen,
  pd.correct,
  pd.progress_median_time_ms,
  pd.mastery_level,
  pd.last_seen_progress,
  -- Derived: best available time metric
  COALESCE(pd.progress_median_time_ms, md.mastery_avg_time_ms) as effective_median_time_ms,
  -- Derived: combined accuracy (prefer mastery as it's trigger-updated)
  COALESCE(md.accuracy_percentage, 
    CASE WHEN pd.seen > 0 THEN ROUND((pd.correct::NUMERIC / pd.seen) * 100, 1) ELSE 0 END
  ) as combined_accuracy,
  -- Recent task stats
  rt.recent_tasks_count,
  rt.recent_completed_tasks,
  rt.recent_avg_accuracy,
  rt.recent_avg_time_ms,
  rt.last_task_date
FROM mastery_data md
FULL OUTER JOIN progress_data pd ON md.user_id = pd.user_id AND md.skill_id = pd.skill_id
FULL OUTER JOIN recent_tasks rt ON COALESCE(md.user_id, pd.user_id) = rt.user_id 
  AND COALESCE(md.skill_id, pd.skill_id) = rt.skill_id
LEFT JOIN skills s ON COALESCE(md.skill_id, pd.skill_id, rt.skill_id) = s.id;

-- =============================================================================
-- STEP 3: Create trigger to keep mastery_level in sync
-- =============================================================================

CREATE OR REPLACE FUNCTION update_mastery_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate mastery level based on accuracy
  IF NEW.total >= 3 THEN
    NEW.mastery_level := CASE
      WHEN (NEW.correct::NUMERIC / NEW.total) >= 0.90 THEN 100
      WHEN (NEW.correct::NUMERIC / NEW.total) >= 0.75 THEN 75
      WHEN (NEW.correct::NUMERIC / NEW.total) >= 0.60 THEN 60
      ELSE 30
    END;
  ELSE
    NEW.mastery_level := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_mastery_level ON mastery;
CREATE TRIGGER set_mastery_level
  BEFORE INSERT OR UPDATE OF correct, total ON mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_mastery_level();

-- =============================================================================
-- STEP 4: Documentation
-- =============================================================================

COMMENT ON VIEW vw_user_skill_stats IS 
  'Unified view combining mastery (trigger-updated) and progress (manual-updated) tables. 
   Use this view for reading skill stats. The mastery table is the preferred write target.';

COMMENT ON TABLE progress IS 
  'DEPRECATED: Use mastery table for new writes. This table is maintained for backward compatibility.';

COMMENT ON COLUMN mastery.mastery_level IS 
  'Computed mastery level (0-100) based on accuracy thresholds. Auto-updated via trigger.';
