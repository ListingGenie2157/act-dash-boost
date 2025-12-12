import { vi } from 'vitest';

// Provide safe defaults for Vite-style env vars during unit tests.
// (Integration tests should supply real values via environment variables.)
if (typeof process !== 'undefined' && process.env) {
  process.env.VITE_SUPABASE_URL ??= 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));