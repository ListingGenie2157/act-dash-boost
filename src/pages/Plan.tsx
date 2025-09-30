import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Plan() {
  const [plans, setPlans] = useState<any[]>([]);
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
        const { data, error: fetchError } = await supabase
          .from('study_plan_days')
          .select('the_date, tasks_json')
          .eq('user_id', user.id)
          .gte('the_date', today)
          .order('the_date', { ascending: true });
        if (fetchError) {
          throw fetchError;
        }
        setPlans(data ?? []);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load plan');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);
