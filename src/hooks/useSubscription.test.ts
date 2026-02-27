import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase client
const mockInvoke = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

import { useSubscription, PLAN_NAMES, PLAN_PRICES } from './useSubscription';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not subscribed when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(false);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('calls check-subscription when session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: {
        subscribed: true,
        plan_type: 'monthly',
        subscription_end: '2026-03-01T00:00:00Z',
        cancel_at_period_end: false,
        is_trialing: false,
      },
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.planType).toBe('monthly');
    expect(result.current.subscriptionEnd).toBe('2026-03-01T00:00:00Z');
    expect(mockInvoke).toHaveBeenCalledWith('check-subscription');
  });

  it('handles trialing status correctly', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: {
        subscribed: true,
        plan_type: 'monthly',
        is_trialing: true,
        trial_end: '2026-02-19T00:00:00Z',
      },
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.isTrialing).toBe(true);
    expect(result.current.trialEnd).toBe('2026-02-19T00:00:00Z');
  });

  it('handles edge function error gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Function failed' },
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(false);
  });

  it('returns cancel_at_period_end status', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: {
        subscribed: true,
        plan_type: '90_day',
        cancel_at_period_end: true,
      },
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cancelAtPeriodEnd).toBe(true);
  });
});

describe('PLAN_NAMES', () => {
  it('has all plan types', () => {
    expect(PLAN_NAMES.monthly).toBe('Monthly');
    expect(PLAN_NAMES['90_day']).toBe('90-Day Pass');
    expect(PLAN_NAMES['12_month']).toBe('12-Month Pass');
  });
});

describe('PLAN_PRICES', () => {
  it('has correct pricing', () => {
    expect(PLAN_PRICES.monthly.amount).toBe(39);
    expect(PLAN_PRICES['90_day'].amount).toBe(89);
    expect(PLAN_PRICES['12_month'].amount).toBe(199);
  });

  it('has savings labels for multi-month plans', () => {
    expect(PLAN_PRICES['90_day'].savings).toBeDefined();
    expect(PLAN_PRICES['12_month'].savings).toBeDefined();
    expect(PLAN_PRICES.monthly.savings).toBeUndefined();
  });
});
