/**
 * Hook for fetching and managing user profile
 * Extracts profile logic from Index.tsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuthState } from './useAuthState';

interface Profile {
  test_date?: string | null;
  onboarding_complete?: boolean | null;
  has_study_plan?: boolean | null;
  first_name?: string | null;
}

interface UseProfileResult {
  profile: Profile | null;
  hasStudyPlan: boolean | null;
  hasDiagnostic: boolean;
  loading: boolean;
  error: Error | null;
}

export function useProfile(): UseProfileResult {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthState();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
  const [hasDiagnostic, setHasDiagnostic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setHasStudyPlan(null);
      setHasDiagnostic(false);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchProfile = async () => {
      try {
        logger.debug('Fetching user profile', { userId: user.id });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 10000)
        );

        const profilePromise = supabase
          .from('profiles')
          .select('test_date, onboarding_complete, has_study_plan, first_name')
          .eq('id', user.id)
          .maybeSingle();

        const result = await Promise.race([profilePromise, timeoutPromise]);

        if (!mounted) return;

        const { data: profileData, error: profileError } = result as {
          data: Profile | null;
          error: unknown;
        };

        if (profileError) {
          const err = profileError instanceof Error ? profileError : new Error(String(profileError));
          logger.error('Profile query error', err, { userId: user.id });
          setError(err);
          setLoading(false);
          navigate('/onboarding', { replace: true });
          return;
        }

        // If user has completed onboarding OR has test_date, show dashboard
        if (profileData?.onboarding_complete || profileData?.test_date) {
          logger.debug('User has completed onboarding', { userId: user.id });
          setProfile(profileData);

          // Verify study plan exists in database
          try {
            const planCheckPromise = supabase
              .from('study_tasks')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);

            const planCheckTimeout = new Promise<{ data: null }>((resolve) =>
              setTimeout(() => resolve({ data: null }), 3000)
            );

            const planResult = await Promise.race([planCheckPromise, planCheckTimeout]);
            const { data: planCheck } = planResult as { data: { id: string }[] | null };

            const actuallyHasPlan = profileData.has_study_plan || (planCheck && planCheck.length > 0);
            setHasStudyPlan(actuallyHasPlan);
          } catch (err) {
            logger.warn('Plan check failed, using profile flag', { userId: user.id, error: err });
            setHasStudyPlan(profileData.has_study_plan ?? false);
          }

          // Check if user has completed a diagnostic
          try {
            const { data: diagnosticData, error: diagnosticError } = await supabase
              .from('diagnostics')
              .select('id')
              .eq('user_id', user.id)
              .eq('source', 'diagnostic')
              .not('completed_at', 'is', null)
              .limit(1);

            if (diagnosticError) {
              logger.warn('Diagnostic check failed', { userId: user.id, error: diagnosticError });
            }

            setHasDiagnostic((diagnosticData?.length ?? 0) > 0);
          } catch (err) {
            logger.warn('Diagnostic check error', { userId: user.id, error: err });
            setHasDiagnostic(false);
          }

          setLoading(false);
          return;
        }

        // Otherwise, redirect to onboarding
        if (mounted) {
          logger.debug('Redirecting to onboarding', { userId: user.id });
          setLoading(false);
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Profile check failed', error, { userId: user.id });
        
        if (mounted) {
          // On timeout or error, show dashboard anyway (user is authenticated)
          setProfile({ onboarding_complete: true, has_study_plan: false, test_date: null });
          setHasStudyPlan(false);
          setLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, navigate]);

  return {
    profile,
    hasStudyPlan,
    hasDiagnostic,
    loading,
    error,
  };
}
