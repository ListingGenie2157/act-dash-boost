import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Every family needs a plan or trial to be inside the app (trial-first signup).
const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

function routeLine(path: string): string {
  const line = app.split('\n').find((l) => l.includes(`path="${path}"`));
  if (!line) throw new Error(`route ${path} not found`);
  return line;
}

describe('route gating', () => {
  it.each([
    '/dashboard',
    '/onboarding',
    '/diagnostic',
    '/diagnostic-test/:formId',
    '/diagnostic-results/:formId',
    '/diagnostic-results-complete',
    '/analytics',
  ])('%s requires a plan or trial', (path) => {
    expect(routeLine(path)).toContain('<RequireSubscription>');
  });

  it.each(['/start', '/pricing', '/subscription-success', '/login'])(
    '%s stays reachable without a plan',
    (path) => {
      expect(routeLine(path)).not.toContain('<RequireSubscription>');
    },
  );
});
