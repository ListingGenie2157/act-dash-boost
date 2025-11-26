import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('useStreak');

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

      log.query('study_tasks', 'select', { userId: user.id });
      
      // Only select fields we need for streak calculation
      const { data: tasks, error } = await supabase
        .from('study_tasks')
        .select('the_date')
        .eq('user_id', user.id)
        .eq('status', 'DONE')
        .order('the_date', { ascending: false });
      
      if (error) {
        log.error('Failed to fetch streak data', error);
        return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
      }

      if (!tasks || tasks.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
      }

      // Get unique dates
      const uniqueDates = [...new Set(tasks.map(t => t.the_date))].sort().reverse();
      
      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      log.debug('Streak calculated', { currentStreak, longestStreak });

      return {
        currentStreak,
        longestStreak,
        lastActiveDate: uniqueDates[0]
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
