import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ParentBanner = () => {
  const [potentialEarnings, setPotentialEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPotentialEarnings();
  }, []);

  async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result as T;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  const fetchPotentialEarnings = async () => {
    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000);
      if (!user) return;

      // Get today's pending tasks
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTasks } = await withTimeout(
        supabase
          .from('study_tasks')
          .select('type, size')
          .eq('user_id', user.id)
          .eq('the_date', today)
          .eq('status', 'PENDING'),
        8000
      );

      // Get parent links to find applicable rules
      const { data: parentLinks } = await withTimeout(
        supabase
          .from('parent_links')
          .select('parent_id')
          .eq('student_id', user.id),
        8000
      );

      if (!parentLinks?.length) {
        setLoading(false);
        return;
      }

      const parentIds = parentLinks.map(link => link.parent_id);

      // Get active rules
      const { data: rules } = await withTimeout(
        supabase
          .from('rewards_rules')
          .select('type, amount_cents, threshold')
          .in('parent_id', parentIds),
        8000
      );

      let potential = 0;

      // Calculate potential from today's tasks
      todayTasks?.forEach(task => {
        const applicableRules = rules?.filter(rule => rule.type === task.type) || [];
        applicableRules.forEach(rule => {
          if (task.type === 'DRILL') {
            // Assume they might meet the criteria
            potential += rule.amount_cents;
          } else if (task.type === 'SIM') {
            // Assume they might improve
            potential += rule.amount_cents;
          }
        });
      });

      // Add streak potential
      const streakRules = rules?.filter(rule => rule.type === 'STREAK') || [];
      streakRules.forEach(rule => {
        potential += rule.amount_cents;
      });

      setPotentialEarnings(potential);
    } catch (error) {
      console.error('Error fetching potential earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || potentialEarnings === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-green-800">Potential Today</h3>
          <p className="text-green-600">
            ${(potentialEarnings / 100).toFixed(2)} available to earn
          </p>
        </div>
      </div>
    </Card>
  );
};