import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Start from './Start';
import { PLAN_STORAGE_KEY } from '@/lib/postAuthRoute';

const createCheckout = vi.fn();
let sub = { isSubscribed: false, isLoading: false };
let admin = false;
let onboardingComplete = false;

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({ ...sub, createCheckout }),
}));
vi.mock('@/hooks/queries/useIsAdmin', () => ({
  useIsAdmin: () => ({ data: admin, isLoading: false }),
}));
vi.mock('@/hooks/queries/useAuth', () => ({
  useAuthUser: () => ({ data: { id: 'u1' }, isLoading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { onboarding_complete: onboardingComplete }, error: null }),
        }),
      }),
    }),
  },
}));

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/start" element={<Start />} />
        <Route path="/pricing" element={<p>pricing page</p>} />
        <Route path="/onboarding" element={<p>onboarding page</p>} />
        <Route path="/dashboard" element={<p>dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  createCheckout.mockReset().mockResolvedValue(undefined);
  sub = { isSubscribed: false, isLoading: false };
  admin = false;
  onboardingComplete = false;
  sessionStorage.clear();
});

describe('Start', () => {
  it('starts checkout for the plan in the link', async () => {
    renderAt('/start?plan=monthly');
    await waitFor(() => expect(createCheckout).toHaveBeenCalledWith('monthly'));
  });

  it('falls back to the plan saved before sign-up', async () => {
    sessionStorage.setItem(PLAN_STORAGE_KEY, '12_month');
    renderAt('/start');
    await waitFor(() => expect(createCheckout).toHaveBeenCalledWith('12_month'));
    expect(sessionStorage.getItem(PLAN_STORAGE_KEY)).toBeNull();
  });

  it('sends a trialing user who has not onboarded to onboarding', async () => {
    sub = { isSubscribed: true, isLoading: false };
    renderAt('/start?plan=monthly');
    expect(await screen.findByText('onboarding page')).toBeTruthy();
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it('sends an onboarded subscriber to the dashboard', async () => {
    sub = { isSubscribed: true, isLoading: false };
    onboardingComplete = true;
    renderAt('/start');
    expect(await screen.findByText('dashboard page')).toBeTruthy();
  });

  it('sends a user with no plan to pricing', async () => {
    renderAt('/start');
    expect(await screen.findByText('pricing page')).toBeTruthy();
  });

  it('ignores an invalid plan', async () => {
    renderAt('/start?plan=free');
    expect(await screen.findByText('pricing page')).toBeTruthy();
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it('shows a way back to plans when checkout fails', async () => {
    createCheckout.mockRejectedValue(new Error('boom'));
    renderAt('/start?plan=monthly');
    expect((await screen.findByRole('link', { name: /back to plans/i })).getAttribute('href')).toBe('/pricing');
  });
});
