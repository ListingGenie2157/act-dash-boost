import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAllUserMastery, getSkillMastery, type MasteryData } from '@/lib/mastery';

/**
 * Hook to fetch mastery data for a specific skill
 */
export function useSkillMastery(skillId: string | null | undefined) {
  return useQuery({
    queryKey: ['mastery', 'skill', skillId],
    queryFn: async () => {
      if (!skillId) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      return getSkillMastery(skillId, user.id);
    },
    enabled: !!skillId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all mastery data for the current user
 */
export function useUserMastery() {
  return useQuery({
    queryKey: ['mastery', 'user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return new Map<string, MasteryData>();

      return getAllUserMastery(user.id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch mastery summary stats
 */
export function useMasterySummary() {
  return useQuery({
    queryKey: ['mastery', 'summary'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalSkills: 0,
          mastered: 0,
          proficient: 0,
          learning: 0,
          beginner: 0,
          overallAccuracy: 0,
        };
      }

      const masteryMap = await getAllUserMastery(user.id);
      
      let mastered = 0;
      let proficient = 0;
      let learning = 0;
      let beginner = 0;
      let totalCorrect = 0;
      let totalAttempts = 0;

      masteryMap.forEach((data) => {
        totalCorrect += data.correct;
        totalAttempts += data.total;

        switch (data.level) {
          case 'mastered':
            mastered++;
            break;
          case 'proficient':
            proficient++;
            break;
          case 'learning':
            learning++;
            break;
          case 'beginner':
            beginner++;
            break;
        }
      });

      const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

      return {
        totalSkills: masteryMap.size,
        mastered,
        proficient,
        learning,
        beginner,
        overallAccuracy,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
