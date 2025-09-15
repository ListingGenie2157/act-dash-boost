-- Fix security definer view issue by dropping and recreating views without SECURITY DEFINER
-- First, check what views exist with SECURITY DEFINER
DROP VIEW IF EXISTS vw_user_skill_stats;
DROP VIEW IF EXISTS v_form_section;

-- Recreate views without SECURITY DEFINER
CREATE VIEW vw_user_skill_stats AS
SELECT 
  p.user_id,
  p.skill_id,
  p.correct,
  p.seen,
  p.mastery_level,
  p.median_time_ms as progress_median_time_ms,
  p.updated_at as last_seen_progress,
  CASE 
    WHEN p.seen > 0 THEN ROUND((p.correct::decimal / p.seen) * 100, 1)
    ELSE 0
  END as accuracy_percentage,
  
  -- Recent task performance (last 30 days)
  COALESCE(recent_tasks.task_count, 0) as recent_tasks_count,
  COALESCE(recent_tasks.completed_count, 0) as recent_completed_tasks,
  COALESCE(recent_tasks.avg_accuracy, 0) as recent_avg_accuracy,
  COALESCE(recent_tasks.avg_time_ms, 0) as recent_avg_time_ms,
  recent_tasks.last_task_date,
  
  -- Combined accuracy (progress + recent tasks)
  CASE 
    WHEN p.seen > 0 AND recent_tasks.completed_count > 0 THEN
      ROUND(((p.correct + COALESCE(recent_tasks.total_correct, 0))::decimal / 
             (p.seen + COALESCE(recent_tasks.completed_count, 0))) * 100, 1)
    WHEN p.seen > 0 THEN ROUND((p.correct::decimal / p.seen) * 100, 1)
    WHEN recent_tasks.completed_count > 0 THEN recent_tasks.avg_accuracy
    ELSE 0
  END as combined_accuracy,
  
  -- Effective median time (prefer recent if available)
  COALESCE(recent_tasks.avg_time_ms, p.median_time_ms, 0) as effective_median_time_ms,
  
  -- Skill details
  s.name as skill_name,
  s.subject,
  s.cluster
  
FROM progress p
LEFT JOIN skills s ON p.skill_id = s.id
LEFT JOIN (
  SELECT 
    st.skill_id,
    COUNT(*) as task_count,
    COUNT(CASE WHEN st.status = 'COMPLETED' THEN 1 END) as completed_count,
    SUM(CASE WHEN st.status = 'COMPLETED' AND st.accuracy IS NOT NULL THEN 1 ELSE 0 END) as total_correct,
    AVG(CASE WHEN st.status = 'COMPLETED' THEN st.accuracy END) as avg_accuracy,
    AVG(CASE WHEN st.status = 'COMPLETED' THEN st.median_time_ms END) as avg_time_ms,
    MAX(st.created_at) as last_task_date
  FROM study_tasks st
  WHERE st.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY st.skill_id
) recent_tasks ON p.skill_id = recent_tasks.skill_id;

CREATE VIEW v_form_section AS
SELECT 
  fq.ord,
  fq.question_id,
  fq.form_id,
  fq.section,
  q.stem as question,
  q.choice_a,
  q.choice_b, 
  q.choice_c,
  q.choice_d,
  q.answer,
  q.explanation,
  fq.passage_id,
  p.title as passage_title,
  p.passage_text
FROM form_questions fq
LEFT JOIN questions q ON fq.question_id = q.id
LEFT JOIN passages p ON fq.passage_id = p.id;