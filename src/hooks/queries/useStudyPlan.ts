import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateStudyPlan } from '@/lib/supabase-client';

export function useStudyPlan(userId?: string) {
  return useQuery({
    queryKey: ['study-plan', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('study_plan_days')
        .select('*')
        .eq('user_id', userId)
        .order('the_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useStudyTasks(userId?: string, date?: string) {
  return useQuery({
    queryKey: ['study-tasks', userId, date],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      let query = supabase
        .from('study_tasks')
        .select('*')
        .eq('user_id', userId);
      
      if (date) {
        query = query.eq('the_date', date);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useGenerateStudyPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: generateStudyPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan'] });
      queryClient.invalidateQueries({ queryKey: ['study-tasks'] });
    },
  });
}