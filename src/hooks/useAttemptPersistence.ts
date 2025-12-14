import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AttemptData {
  questionId: string;
  choiceOrder: number[];
  correctIdx: number;
  selectedIdx?: number;
  formId: string;
  questionOrd: number;
}

export function useAttempts(userId: string, formId: string) {
  return useQuery({
    queryKey: ['attempts', userId, formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('form_id', formId)
        .order('question_ord');
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!formId,
  });
}

export function useUpsertAttempt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attempt: AttemptData & { userId: string }) => {
      const { data, error } = await supabase
        .from('attempts')
        .upsert({
          user_id: attempt.userId,
          question_id: attempt.questionId,
          choice_order: attempt.choiceOrder,
          correct_idx: attempt.correctIdx,
          selected_idx: attempt.selectedIdx,
          form_id: attempt.formId,
          question_ord: attempt.questionOrd,
        }, {
          onConflict: 'user_id,question_id,form_id'
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['attempts', variables.userId, variables.formId] 
      });
    },
  });
}