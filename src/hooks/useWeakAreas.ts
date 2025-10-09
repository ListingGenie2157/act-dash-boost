import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getWeakAreas, getWeakAreaStats } from '@/lib/weakAreas';

/**
 * Hook to fetch weak areas for the current user
 */
export function useWeakAreas(limit: number = 10) {
  return useQuery({
    queryKey: ['weakAreas', limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      return getWeakAreas(user.id, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch weak area statistics
 */
export function useWeakAreaStats() {
  return useQuery({
    queryKey: ['weakAreaStats'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { critical: 0, high: 0, medium: 0, total: 0 };
      }

      return getWeakAreaStats(user.id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
