import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WeakAreaDb {
  skill_id: string | null;
  skill_name: string | null;
  subject: string | null;
  combined_accuracy: number | null;
  seen: number | null;
}

/**
 * Hook to fetch weak areas from database (vw_user_skill_stats)
 * Replaces the legacy localStorage-based useProgress hook
 */
export function useWeakAreasDb(limit: number = 3) {
  return useQuery({
    queryKey: ['weakAreasDb', limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('vw_user_skill_stats')
        .select('skill_id, skill_name, subject, combined_accuracy, seen')
        .eq('user_id', user.id)
        .lt('combined_accuracy', 0.85)
        .gte('seen', 20)
        .order('combined_accuracy', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching weak areas:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Transform DB weak areas to legacy format for backward compatibility
 */
export function transformToLegacyFormat(weakAreas: WeakAreaDb[]) {
  return weakAreas
    .filter((area) => area.skill_name && area.subject && area.combined_accuracy !== null && area.seen !== null)
    .map((area) => ({
      subject: area.subject as 'Math' | 'English',
      topic: area.skill_name!,
      errorCount: Math.round((1 - area.combined_accuracy!) * area.seen!),
    }));
}
