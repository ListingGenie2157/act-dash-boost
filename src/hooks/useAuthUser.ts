// Auth hook following architecture spec
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuthUser = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry auth failures
  });
};

// Helper hook for checking if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useAuthUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user
  };
};

// Sign out mutation
export const useSignOut = () => {
  const queryClient = useQueryClient();

  return {
    signOut: async () => {
      await supabase.auth.signOut();
      queryClient.clear(); // Clear all cached data on sign out
    }
  };
};