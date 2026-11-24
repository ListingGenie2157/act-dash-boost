import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { reportError } from '@/lib/errorReporter';

export interface SubscriptionStatus {
  subscribed: boolean;
  plan_type?: 'monthly' | '90_day' | '12_month';
  subscription_end?: string;
  cancel_at_period_end?: boolean;
  is_trialing?: boolean;
  trial_end?: string;
  error?: string;
}

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async (): Promise<SubscriptionStatus> => {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session) {
        return { subscribed: false };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { component: 'useSubscription' });
        return { subscribed: false, error: error.message };
      }
      
      return data as SubscriptionStatus;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Refetch on auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      }
      if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(['subscription-status'], { subscribed: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const createCheckout = async (planType: 'monthly' | '90_day' | '12_month') => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { planType },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.url) {
      throw new Error('Checkout did not return a URL');
    }
    // Same tab: a new tab opened without a click is blocked by browsers,
    // and Stripe returns to /subscription-success here.
    window.location.assign(data.url);
  };

  const openCustomerPortal = async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  return {
    isSubscribed: data?.subscribed ?? false,
    planType: data?.plan_type,
    subscriptionEnd: data?.subscription_end,
    cancelAtPeriodEnd: data?.cancel_at_period_end,
    isTrialing: data?.is_trialing ?? false,
    trialEnd: data?.trial_end,
    isLoading,
    error,
    refetch,
    createCheckout,
    openCustomerPortal,
  };
}

// Plan display names
export const PLAN_NAMES: Record<string, string> = {
  monthly: 'Monthly',
  '90_day': '90-Day Pass',
  '12_month': '12-Month Pass',
};

// Plan prices for display
export const PLAN_PRICES: Record<string, { amount: number; label: string; savings?: string }> = {
  monthly: { amount: 39, label: '$39/month' },
  '90_day': { amount: 89, label: '$89 one-time', savings: 'Save $28 vs 3 months' },
  '12_month': { amount: 199, label: '$199 one-time', savings: 'Save $269 vs 12 months' },
};

/** The trial terms shown wherever a family picks a plan. Every plan has the same 7-day, card-required trial. */
export function trialTerms(planType: 'monthly' | '90_day' | '12_month'): string {
  const after = planType === 'monthly'
    ? `then $${PLAN_PRICES.monthly.amount}/month`
    : `then $${PLAN_PRICES[planType].amount} once (doesn't renew)`;
  return `7 days free, ${after}. Card required. Cancel anytime before the trial ends and you won't be charged.`;
}
