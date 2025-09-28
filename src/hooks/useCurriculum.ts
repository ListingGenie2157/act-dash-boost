// Proper typed hooks following architecture spec
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Lesson,
  Question,
  StudyPlan,
  StudySession,
  PracticeAttempt,
  PracticeItem,
  ProgressAggregate
} from '@/types/curriculum';

// Lessons - server state via TanStack Query
export const useLessons = (subject?: string, skillCode?: string) => {
  return useQuery({
    queryKey: ['lessons', subject, skillCode],
    queryFn: async () => {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('skill_code', { ascending: true });

      if (subject) {
        query = query.eq('subject', subject);
      }

      if (skillCode) {
        query = query.eq('skill_code', skillCode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lesson[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - content doesn't change often
  });
};

// Questions - server state via TanStack Query
export const useQuestions = (subject?: string, skillCode?: string) => {
  return useQuery({
    queryKey: ['questions', subject, skillCode],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select('*')
        .order('skill_code', { ascending: true });

      if (subject) {
        query = query.eq('subject', subject);
      }

      if (skillCode) {
        query = query.eq('skill_code', skillCode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Question[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Study Plan - user-specific data
export const useStudyPlan = () => {
  return useQuery({
    queryKey: ['studyPlan'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_plan')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (error) throw error;
      return data as StudyPlan | null;
    },
    enabled: true, // Will only run if user is authenticated
  });
};

// Study Sessions - user's daily activities
export const useStudySessions = (date?: string) => {
  return useQuery({
    queryKey: ['studySessions', date],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      let query = supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('date', { ascending: true });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudySession[];
    },
  });
};

// Progress Aggregates - computed mastery data
export const useProgress = () => {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('progress_aggregates')
        .select('*')
        .eq('user_id', user.user.id);

      if (error) throw error;
      return data as ProgressAggregate[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - progress updates frequently
  });
};

// Mutations for study plan
export const useCreateStudyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<StudyPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_plan')
        .insert({
          ...plan,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StudyPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
    },
  });
};

// Mutations for study sessions
export const useUpdateStudySession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<StudySession>
    }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StudySession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    },
  });
};

// Practice tracking
export const useStartPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionType: 'practice' | 'diagnostic' | 'quiz' = 'practice') => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('practice_attempts')
        .insert({
          user_id: user.user.id,
          session_type: sessionType,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PracticeAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceAttempts'] });
    },
  });
};

export const useRecordPracticeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<PracticeItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('practice_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as PracticeItem;
    },
    onSuccess: () => {
      // This will trigger progress aggregate updates via database trigger
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
};

export const useFinishPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attemptId: string) => {
      const { data, error } = await supabase
        .from('practice_attempts')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return data as PracticeAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
};