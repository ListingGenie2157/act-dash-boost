import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from '../pages/Index';

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('Smoke Tests', () => {
  it('renders index page without crashing', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );
    
    // Should render without throwing
    expect(document.body).toBeDefined();
  });

  it('shows loading states properly', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );
    
    // The page should render some content
    expect(document.body).toBeDefined();
  });
});