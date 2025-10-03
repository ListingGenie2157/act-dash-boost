import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { StudyPlanDay, StudyPlanTask } from '@/types';

export default function Plan() {
  const [plans, setPlans] = useState<StudyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPlans([]);
          setLoading(false);
          return;
        }
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        const { data, error: fetchError } = await supabase
          .from('study_plan_days')
          .select('the_date, tasks_json, user_id, generated_at')
          .eq('user_id', user.id)
          .gte('the_date', today)
          .lte('the_date', sevenDaysFromNow)
          .order('the_date', { ascending: true });
        if (fetchError) {
          throw fetchError;
        }
        setPlans((data ?? []) as StudyPlanDay[]);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load plan';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <div>Loading plan...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Study Plan</h1>
      {plans.length === 0 ? (
        <p>No study plan available.</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan, idx) => {
            const tasks: StudyPlanTask[] = plan.tasks_json ?? [];
            return (
              <div key={idx} className="border p-4 rounded">
                <h2 className="font-semibold">{plan.the_date}</h2>
                <ul className="mt-2 space-y-1">
                  {tasks.map((task: StudyPlanTask, taskIdx: number) => (
                    <li key={taskIdx}>
                      <Link
                        to={`/task/${plan.the_date}/${taskIdx}`}
                        className="text-blue-600 hover:underline"
                      >
                        {task.title || `Task ${taskIdx + 1}`}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
