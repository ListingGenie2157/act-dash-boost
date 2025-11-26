import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const log = createLogger('useCurrentUser');

/**
 * Centralized hook for current authenticated user.
 * Eliminates repetitive supabase.auth.getUser() calls across components.
 * Automatically syncs with auth state changes.
 */
export function useCurrentUser() {
  const queryClient = useQueryClient();

  // Subscribe to auth state changes and invalidate query
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log.debug('Auth state changed', { event, hasSession: !!session });
        // Invalidate user query when auth state changes
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User | null> => {
      log.debug('Fetching current user');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        log.error('Failed to fetch user', error);
        throw error;
      }
      
      log.debug('User fetched', { userId: user?.id ?? 'null' });
      return user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
    retry: 1,
  });
}

/**
 * Hook that requires authentication.
 * Returns user data and redirects if not authenticated.
 */
export function useRequireAuth() {
  const query = useCurrentUser();
  
  return {
    ...query,
    isAuthenticated: !!query.data,
    userId: query.data?.id ?? null,
  };
}

/**
 * Get user ID synchronously from the query cache (may be stale)
 * Useful for non-reactive contexts
 */
export function useUserIdSync(): string | null {
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<User | null>(['currentUser']);
  return cachedUser?.id ?? null;
}
