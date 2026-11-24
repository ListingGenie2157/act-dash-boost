import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Onboarding from './Onboarding';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { onboarding_complete: false } }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/diagnostic" element={<p>diagnostic page</p>} />
        <Route path="/dashboard" element={<p>dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completeForm() {
  fireEvent.change(await screen.findByLabelText(/first name/i), { target: { value: 'Sam' } });
  for (const id of ['age', 'tos', 'privacy']) {
    fireEvent.click(document.getElementById(id)!);
  }
  fireEvent.click(screen.getByRole('button', { name: /get started/i }));
}

describe('Onboarding finish', () => {
  it('offers the diagnostic or skipping, instead of jumping to the dashboard', async () => {
    renderPage();
    await completeForm();
    expect(await screen.findByRole('button', { name: /take the diagnostic/i })).toBeTruthy();
    expect(screen.queryByText('dashboard page')).toBeNull();
  });

  it('skip goes to the dashboard', async () => {
    renderPage();
    await completeForm();
    fireEvent.click(await screen.findByRole('button', { name: /skip for now/i }));
    expect(await screen.findByText('dashboard page')).toBeTruthy();
  });

  it('take the diagnostic goes to the diagnostic', async () => {
    renderPage();
    await completeForm();
    fireEvent.click(await screen.findByRole('button', { name: /take the diagnostic/i }));
    expect(await screen.findByText('diagnostic page')).toBeTruthy();
  });
});
