-- Create view for user skill statistics
CREATE OR REPLACE VIEW vw_user_skill_stats AS
SELECT 
  p.user_id,
  p.skill_id,
  s.name as skill_name,
  s.subject,
  s.cluster,
  -- Progress-based metrics
  p.seen,
  p.correct,
  CASE 
    WHEN p.seen > 0 THEN ROUND((p.correct::decimal / p.seen::decimal) * 100, 2)
    ELSE 0
  END as accuracy_percentage,
  p.mastery_level,
  p.median_time_ms as progress_median_time_ms,
  p.updated_at as last_seen_progress,
  
  -- Recent study task metrics (last 30 days)
  COALESCE(recent_tasks.total_tasks, 0) as recent_tasks_count,
  COALESCE(recent_tasks.completed_tasks, 0) as recent_completed_tasks,
  COALESCE(recent_tasks.avg_accuracy, 0) as recent_avg_accuracy,
  COALESCE(recent_tasks.avg_time_ms, 0) as recent_avg_time_ms,
  recent_tasks.last_task_date,
  
  -- Combined metrics for weakness detection
  GREATEST(p.median_time_ms, COALESCE(recent_tasks.avg_time_ms, 0)) as effective_median_time_ms,
  CASE 
    WHEN p.seen > 0 AND recent_tasks.total_tasks > 0 THEN
      ((p.correct::decimal / p.seen::decimal) + COALESCE(recent_tasks.avg_accuracy, 0)) / 2
    WHEN p.seen > 0 THEN
      p.correct::decimal / p.seen::decimal
    WHEN recent_tasks.total_tasks > 0 THEN
      COALESCE(recent_tasks.avg_accuracy, 0)
    ELSE 0
  END as combined_accuracy

FROM progress p
INNER JOIN skills s ON s.id = p.skill_id
LEFT JOIN (
  SELECT 
    user_id,
    skill_id,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
    AVG(CASE WHEN accuracy IS NOT NULL THEN accuracy ELSE 0 END) as avg_accuracy,
    AVG(CASE WHEN median_time_ms IS NOT NULL THEN median_time_ms ELSE 0 END) as avg_time_ms,
    MAX(created_at) as last_task_date
  FROM study_tasks 
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND skill_id IS NOT NULL
  GROUP BY user_id, skill_id
) recent_tasks ON recent_tasks.user_id = p.user_id AND recent_tasks.skill_id = p.skill_id;

-- Add comment to describe the view
COMMENT ON VIEW vw_user_skill_stats IS 'Comprehensive view combining progress table data with recent study task performance for skill weakness detection and analysis';