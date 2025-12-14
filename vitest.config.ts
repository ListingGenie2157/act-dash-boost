import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    // Keep unit tests in Vitest; exclude Playwright + Deno edge-function tests.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'e2e/**',
      'supabase/**',
      // Integration tests require a real Supabase project/keys.
      'src/tests/rls.test.ts',
      'src/tests/smoke.test.tsx',
      'src/lib/mastery.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});