import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMasterySummary } from './useMastery';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export function useAchievements() {
  const { data: masterySummary } = useMasterySummary();

  return useQuery({
    queryKey: ['achievements', masterySummary],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: tasks } = await supabase
        .from('study_tasks')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'DONE');

      const completedTasks = tasks?.length || 0;
      const mastered = masterySummary?.mastered || 0;

      const achievements: Achievement[] = [
        {
          id: 'first-step',
          title: 'First Step',
          description: 'Complete your first task',
          icon: '🎯',
          unlocked: completedTasks >= 1,
        },
        {
          id: 'dedicated',
          title: 'Dedicated Learner',
          description: 'Complete 10 tasks',
          icon: '📚',
          unlocked: completedTasks >= 10,
          progress: Math.min(completedTasks, 10),
          target: 10,
        },
        {
          id: 'committed',
          title: 'Committed Student',
          description: 'Complete 50 tasks',
          icon: '🔥',
          unlocked: completedTasks >= 50,
          progress: Math.min(completedTasks, 50),
          target: 50,
        },
        {
          id: 'master',
          title: 'Master',
          description: 'Achieve mastery in 5 skills',
          icon: '🏆',
          unlocked: mastered >= 5,
          progress: Math.min(mastered, 5),
          target: 5,
        },
        {
          id: 'expert',
          title: 'Expert',
          description: 'Achieve mastery in 15 skills',
          icon: '⭐',
          unlocked: mastered >= 15,
          progress: Math.min(mastered, 15),
          target: 15,
        },
        {
          id: 'perfectionist',
          title: 'Perfectionist',
          description: 'Reach 90% overall accuracy',
          icon: '💯',
          unlocked: (masterySummary?.overallAccuracy || 0) >= 90,
          progress: Math.min(Math.round(masterySummary?.overallAccuracy || 0), 90),
          target: 90,
        },
      ];

      return achievements;
    },
    enabled: !!masterySummary,
    staleTime: 1000 * 60 * 5,
  });
}
