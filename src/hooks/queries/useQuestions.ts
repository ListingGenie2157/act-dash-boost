import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFormQuestions(formId: string, section: string) {
  return useQuery({
    queryKey: ['form-questions', formId, section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_form_section')
        .select('*')
        .eq('form_id', formId)
        .eq('section', section)
        .order('ord');
      
      if (error) throw error;
      return data;
    },
    enabled: !!formId && !!section,
  });
}

export function usePassages(formId: string, section: string) {
  return useQuery({
    queryKey: ['passages', formId, section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passages')
        .select('*')
        .eq('form_id', formId)
        .eq('section', section);
      
      if (error) throw error;
      return data;
    },
    enabled: !!formId && !!section,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      questionId: string;
      selected: string;
      correct: boolean;
      timeMs: number;
    }) => {
      const { data, error } = await supabase
        .from('responses')
        .insert([{
          session_id: params.sessionId,
          question_id: params.questionId,
          selected: params.selected,
          correct: params.correct,
          time_ms: params.timeMs,
        }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
    },
  });
}