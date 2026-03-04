import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanTaskJson } from '@/types/studyPlan';
import { SKILL_PREFIX } from '@/lib/sectionMapping';

export default function TaskLauncher() {
  const { date, idx } = useParams<{ date?: string; idx?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const launchTask = async () => {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        navigate('/plan', { replace: true });
        return;
      }
      if (idx == null || !/^\d+$/.test(idx)) {
        navigate('/plan', { replace: true });
        return;
      }

      const i = Number(idx);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/plan', { replace: true }); return; }

      // Fetch plan day tasks
      const { data: planDay, error } = await supabase
        .from('study_plan_days')
        .select('tasks_json')
        .eq('the_date', date)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !planDay?.tasks_json) {
        navigate('/plan', { replace: true });
        return;
      }

      const tasks = Array.isArray(planDay.tasks_json)
        ? (planDay.tasks_json as unknown as PlanTaskJson[])
        : [];
      
      if (i < 0 || i >= tasks.length) {
        navigate('/plan', { replace: true });
        return;
      }

      const task = tasks[i];
      if (!task) { navigate('/plan', { replace: true }); return; }

      const type = String(task.type || '').toUpperCase();
      const code = task.skill_id || '';
      
      if (!code && type === 'LEARN') {
        toast.error('Task configuration error: missing skill');
        navigate('/plan', { replace: true });
        return;
      }
      
      const n = task.size ?? 10;

      // Look up existing study_tasks row to pass its ID downstream
      let existingTaskId: string | undefined;
      const { data: existingTask } = await supabase
        .from('study_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('the_date', date)
        .eq('type', type)
        .eq('skill_id', code || '')
        .maybeSingle();
      
      if (existingTask?.id) {
        existingTaskId = existingTask.id;
      }

      const taskIdParam = existingTaskId ? `&taskId=${existingTaskId}` : '';

      switch (type) {
        case 'LEARN':
          navigate(`/lesson/${code}?date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        case 'DRILL': {
          const prefix = code[0]?.toUpperCase() ?? '';
          const subject = Object.entries(SKILL_PREFIX).find(([, p]) => p === prefix)?.[0] ?? 'Math';
          navigate(`/drill/${subject}?n=${n}&skill=${encodeURIComponent(code)}&date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        }
        case 'QUIZ':
          navigate(`/quiz/${code}?n=${n}&date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        case 'SIM':
          navigate(`/simulation?date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        default:
          navigate('/plan', { replace: true });
      }
    };

    void launchTask();
  }, [date, idx, navigate]);

  return null;
}
