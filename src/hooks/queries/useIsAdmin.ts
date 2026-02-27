import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { reportError } from '@/lib/errorReporter';

export function useIsAdmin() {
  return useQuery({
    queryKey: ['user-role', 'admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { component: 'useIsAdmin' });
        return false;
      }

      return !!data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
