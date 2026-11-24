import { describe, it, expect } from 'vitest';
import { parsePlan, getPostAuthRoute } from './postAuthRoute';

const base = { isAdmin: false, hasAccess: false, onboardingComplete: false, plan: null };

describe('parsePlan', () => {
  it('accepts the three plan ids', () => {
    expect(parsePlan('monthly')).toBe('monthly');
    expect(parsePlan('90_day')).toBe('90_day');
    expect(parsePlan('12_month')).toBe('12_month');
  });
  it('rejects anything else', () => {
    expect(parsePlan('free')).toBeNull();
    expect(parsePlan('')).toBeNull();
    expect(parsePlan(null)).toBeNull();
    expect(parsePlan(undefined)).toBeNull();
  });
});

describe('getPostAuthRoute', () => {
  it('sends a user with access who has not onboarded to onboarding', () => {
    expect(getPostAuthRoute({ ...base, hasAccess: true })).toEqual({ kind: 'navigate', to: '/onboarding' });
    expect(getPostAuthRoute({ ...base, isAdmin: true })).toEqual({ kind: 'navigate', to: '/onboarding' });
  });
  it('sends an onboarded user with access to the dashboard, even with a plan in hand', () => {
    expect(getPostAuthRoute({ ...base, hasAccess: true, onboardingComplete: true, plan: 'monthly' }))
      .toEqual({ kind: 'navigate', to: '/dashboard' });
  });
  it('starts checkout for a user without access who picked a plan', () => {
    expect(getPostAuthRoute({ ...base, plan: '90_day' })).toEqual({ kind: 'checkout', plan: '90_day' });
  });
  it('sends a user without access and without a plan to pricing', () => {
    expect(getPostAuthRoute(base)).toEqual({ kind: 'navigate', to: '/pricing' });
    expect(getPostAuthRoute({ ...base, onboardingComplete: true })).toEqual({ kind: 'navigate', to: '/pricing' });
  });
});
