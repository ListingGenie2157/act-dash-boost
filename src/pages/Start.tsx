import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from '@/hooks/queries/useAuth';
import { useIsAdmin } from '@/hooks/queries/useIsAdmin';
import { useSubscription } from '@/hooks/useSubscription';
import { getPostAuthRoute, parsePlan, PLAN_STORAGE_KEY } from '@/lib/postAuthRoute';
import { reportError } from '@/lib/errorReporter';

function readStoredPlan(): string | null {
  try {
    return sessionStorage.getItem(PLAN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearStoredPlan() {
  try {
    sessionStorage.removeItem(PLAN_STORAGE_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

/**
 * Landing page after sign-in and after the email-confirm link.
 * Decides once: start checkout for the chosen plan, onboard, or show plans.
 */
export default function Start() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: user, isLoading: userLoading } = useAuthUser();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { isSubscribed, isLoading: subLoading, createCheckout } = useSubscription();
  const [failed, setFailed] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current || userLoading || adminLoading || subLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    decided.current = true;

    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      const route = getPostAuthRoute({
        isAdmin: isAdmin === true,
        hasAccess: isSubscribed,
        onboardingComplete: profile?.onboarding_complete === true,
        plan: parsePlan(params.get('plan')) ?? parsePlan(readStoredPlan()),
      });

      if (route.kind === 'navigate') {
        navigate(route.to, { replace: true });
        return;
      }

      clearStoredPlan();
      try {
        await createCheckout(route.plan);
      } catch (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Start' });
        setFailed(true);
      }
    })();
  }, [user, userLoading, isAdmin, adminLoading, isSubscribed, subLoading, params, navigate, createCheckout]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {failed ? (
        <div className="max-w-sm text-center space-y-3">
          <p className="font-medium">We couldn't open checkout.</p>
          <p className="text-muted-foreground text-sm">Your account is ready. Pick your plan again to start your free trial.</p>
          <Link to="/pricing" className="inline-block underline underline-offset-4">Back to plans</Link>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-muted-foreground" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Setting up your trial…
        </p>
      )}
    </main>
  );
}
