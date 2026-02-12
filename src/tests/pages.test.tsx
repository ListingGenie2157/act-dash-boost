import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase client to avoid real network calls
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock('@/lib/env', () => ({
  getSupabaseUrl: vi.fn().mockReturnValue('https://test.supabase.co'),
  getSupabaseAnonKey: vi.fn().mockReturnValue('test-key'),
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Public pages render without crashing', () => {
  it('LandingPage renders', async () => {
    const { default: LandingPage } = await import('@/pages/LandingPage');
    const { container } = render(<TestWrapper><LandingPage /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('Login renders', async () => {
    const { default: Login } = await import('@/pages/Login');
    const { container } = render(<TestWrapper><Login /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('Pricing renders', async () => {
    const { default: Pricing } = await import('@/pages/Pricing');
    const { container } = render(<TestWrapper><Pricing /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('Terms renders', async () => {
    const { default: Terms } = await import('@/pages/Terms');
    const { container } = render(<TestWrapper><Terms /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('Privacy renders', async () => {
    const { default: Privacy } = await import('@/pages/Privacy');
    const { container } = render(<TestWrapper><Privacy /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('HealthCheck renders', async () => {
    const { HealthCheck } = await import('@/pages/HealthCheck');
    const { container } = render(<TestWrapper><HealthCheck /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('NotFound renders', async () => {
    const { default: NotFound } = await import('@/pages/NotFound');
    const { container } = render(<TestWrapper><NotFound /></TestWrapper>);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
