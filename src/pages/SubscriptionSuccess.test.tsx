import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SubscriptionSuccess from './SubscriptionSuccess';

let isSubscribed = false;
const refetch = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({ isSubscribed, refetch }),
}));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/subscription-success']}>
      <Routes>
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/start" element={<p>start page</p>} />
        <Route path="/pricing" element={<p>pricing page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  isSubscribed = false;
  refetch.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('SubscriptionSuccess', () => {
  it('continues to /start once the trial is active', async () => {
    isSubscribed = true;
    renderPage();
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('start page')).toBeTruthy();
  });

  it('never sends a paying family back to pricing while the webhook lags', async () => {
    renderPage();
    for (let i = 0; i < 12; i++) {
      await act(async () => { vi.advanceTimersByTime(3000); });
    }
    expect(screen.queryByText('pricing page')).toBeNull();
    expect(screen.queryByText('start page')).toBeNull();
    expect(screen.getByRole('button', { name: /check again/i })).toBeTruthy();
  });

  it('does not offer a dashboard shortcut that skips onboarding', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /go to dashboard/i })).toBeNull();
  });
});
