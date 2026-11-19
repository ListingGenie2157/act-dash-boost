import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanTaskJson } from '@/types/studyPlan';
import { SKILL_PREFIX } from '@/lib/sectionMapping';

/** Section with the lowest most-recent score (self-reported 1–36, or diagnostic % mapped to 1–36). */
async function weakestSection(userId: string): Promise<string> {
  const { data } = await supabase
    .from('diagnostics')
    .select('section, score, source')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(40);
  const latest = new Map<string, number>();
  for (const d of data ?? []) {
    if (d.score === null || latest.has(d.section)) continue;
    latest.set(d.section, d.source === 'self' ? Number(d.score) : Math.round(1 + 35 * Number(d.score) / 100));
  }
  let weakest = 'Math';
  let low = Infinity;
  for (const [section, score] of latest) {
    if (['English', 'Math', 'Reading', 'Science'].includes(section) && score < low) { low = score; weakest = section; }
  }
  return weakest;
}

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

      // Look up existing study_tasks row to pass its ID downstream (SIM tasks name their form in form_id)
      const formId = task.form_id ?? null;
      let existingTaskId: string | undefined;
      let lookup = supabase
        .from('study_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('the_date', date)
        .eq('type', type);
      lookup = code ? lookup.eq('skill_id', code) : lookup.is('skill_id', null);
      if (formId) lookup = lookup.eq('form_id', formId);
      const { data: existingTask } = await lookup.limit(1).maybeSingle();
      
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
          navigate(`/simulation?${formId ? `form=${encodeURIComponent(formId)}&` : ''}date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        case 'REVIEW':
          navigate(`/review/spaced?date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        case 'WARMUP': {
          const subject = await weakestSection(user.id);
          navigate(`/drill/${subject}?n=${n}&date=${encodeURIComponent(date)}&i=${i}${taskIdParam}`, { replace: true });
          break;
        }
        default:
          navigate('/plan', { replace: true });
      }
    };

    void launchTask();
  }, [date, idx, navigate]);

  return null;
}
