/**
 * Centralized auth state management hook
 * Extracts repetitive auth checking logic
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AuthState {
  user: { id: string } | null;
  loading: boolean;
  error: Error | null;
}

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }

        if (mounted) {
          setState({
            user: user ? { id: user.id } : null,
            loading: false,
            error: null,
          });

          if (user) {
            logger.auth('User authenticated', { userId: user.id });
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Auth check failed', err);
        
        if (mounted) {
          setState({
            user: null,
            loading: false,
            error: err,
          });
        }
      }
    };

    // Initial check
    void checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', { event, hasSession: !!session });
        
        if (mounted) {
          setState({
            user: session?.user ? { id: session.user.id } : null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
