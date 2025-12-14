import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CalculatorPracticeRecord {
  id: string;
  user_id: string;
  lesson_id: string;
  calculator_model: string;
  mode: 'guided' | 'challenge';
  time_saved_ms: number | null;
  completion_time_ms: number;
  completed_at: string;
}

export const useCalculatorProgress = () => {
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['calculator-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculator_practice')
        .select('*')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as CalculatorPracticeRecord[];
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (params: {
      lessonId: string;
      mode: 'guided' | 'challenge';
      completionTime: number;
      timeSaved?: number;
      calculatorModel?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calculator_practice')
        .upsert({
          user_id: user.id,
          lesson_id: params.lessonId,
          mode: params.mode,
          completion_time_ms: params.completionTime,
          time_saved_ms: params.timeSaved ?? null,
          calculator_model: params.calculatorModel || 'TI-84',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculator-progress'] });
    },
  });

  const totalTimeSaved = progress?.reduce((sum, p) => sum + (p.time_saved_ms || 0), 0) || 0;
  const lessonsCompleted = new Set(progress?.map(p => p.lesson_id)).size;
  
  const getLessonProgress = (lessonId: string, mode: 'guided' | 'challenge') => {
    return progress?.find(p => p.lesson_id === lessonId && p.mode === mode);
  };

  return {
    progress,
    isLoading,
    saveProgress: saveProgressMutation.mutate,
    totalTimeSaved,
    lessonsCompleted,
    getLessonProgress,
  };
};
