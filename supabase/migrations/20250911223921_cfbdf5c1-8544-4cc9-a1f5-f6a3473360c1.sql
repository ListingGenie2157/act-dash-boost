-- Fix security definer view issue by changing the view to SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_user_skill_stats;

CREATE VIEW public.vw_user_skill_stats 
WITH (security_invoker = true) AS
SELECT 
    p.user_id,
    p.skill_id,
    s.name as skill_name,
    s.subject,
    s.cluster,
    p.correct,
    p.seen,
    p.mastery_level,
    p.median_time_ms as progress_median_time_ms,
    p.updated_at as last_seen_progress,
    CASE 
        WHEN p.seen > 0 THEN ROUND((p.correct::numeric / p.seen::numeric) * 100, 2)
        ELSE 0 
    END as accuracy_percentage,
    -- Recent task performance (last 7 days)
    recent_stats.recent_tasks_count,
    recent_stats.recent_completed_tasks,
    recent_stats.recent_avg_accuracy,
    recent_stats.recent_avg_time_ms,
    recent_stats.last_task_date,
    -- Combined accuracy from both progress and recent tasks
    CASE 
        WHEN p.seen > 0 AND recent_stats.recent_completed_tasks > 0 THEN
            ROUND(((p.correct + COALESCE(recent_stats.recent_completed_tasks * recent_stats.recent_avg_accuracy / 100, 0)) / 
                   (p.seen + COALESCE(recent_stats.recent_completed_tasks, 0))) * 100, 2)
        WHEN p.seen > 0 THEN ROUND((p.correct::numeric / p.seen::numeric) * 100, 2)
        WHEN recent_stats.recent_completed_tasks > 0 THEN recent_stats.recent_avg_accuracy
        ELSE 0
    END as combined_accuracy,
    -- Effective median time (prefer recent data if available)
    COALESCE(recent_stats.recent_avg_time_ms, p.median_time_ms) as effective_median_time_ms
FROM public.progress p
LEFT JOIN public.skills s ON p.skill_id = s.id
LEFT JOIN (
    SELECT 
        st.skill_id,
        COUNT(*) as recent_tasks_count,
        COUNT(*) FILTER (WHERE st.status = 'COMPLETED') as recent_completed_tasks,
        AVG(st.accuracy * 100) FILTER (WHERE st.status = 'COMPLETED') as recent_avg_accuracy,
        AVG(st.median_time_ms) FILTER (WHERE st.status = 'COMPLETED') as recent_avg_time_ms,
        MAX(st.created_at) as last_task_date
    FROM public.study_tasks st 
    WHERE st.created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY st.skill_id
) recent_stats ON p.skill_id = recent_stats.skill_id;