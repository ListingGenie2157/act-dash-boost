import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanTaskJson } from '@/types/studyPlan';

export default function TaskLauncher() {
  const { date, idx } = useParams<{ date?: string; idx?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const launchTask = async () => {
      // Validate date format (YYYY-MM-DD)
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        navigate('/plan', { replace: true });
        return;
      }

      // Validate idx is an integer
      if (idx == null || !/^\d+$/.test(idx)) {
        navigate('/plan', { replace: true });
        return;
      }

      const i = Number(idx);

      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/plan', { replace: true });
        return;
      }

      // Fetch tasks for the date from study_plan_days table
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
      
      // Validate idx is in range
      if (i < 0 || i >= tasks.length) {
        navigate('/plan', { replace: true });
        return;
      }

      const task = tasks[i];
      if (!task) {
        navigate('/plan', { replace: true });
        return;
      }

      const type = String(task.type || '').toUpperCase();
      const code = task.skill_id || '';
      
      if (!code && type === 'LEARN') {
        toast.error('Task configuration error: missing skill');
        navigate('/plan', { replace: true });
        return;
      }
      
      const n = task.size ?? 10;

      switch (type) {
        case 'LEARN':
          navigate(`/lesson/${code}?date=${encodeURIComponent(date)}&i=${i}`, { replace: true });
          break;
        case 'DRILL':
          navigate(`/drill/${code}?n=${n}&date=${encodeURIComponent(date)}&i=${i}`, { replace: true });
          break;
        case 'QUIZ':
          navigate(`/quiz/${code}?n=${n}&date=${encodeURIComponent(date)}&i=${i}`, { replace: true });
          break;
        case 'SIM':
          navigate(`/simulation?date=${encodeURIComponent(date)}&i=${i}`, { replace: true });
          break;
        default:
          navigate('/plan', { replace: true });
      }
    };

    void launchTask();
  }, [date, idx, navigate]);

  return null;
}
