import { describe, it, expect, vi } from 'vitest';

// Mock supabase for data integrity queries
const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

/**
 * These tests verify the companion tips data has complete coverage
 * for all sections and tip keys used by useTestCompanion.
 */
describe('Companion tips coverage', () => {
  it('getCompanionTip returns a tip for all general keys', async () => {
    const { getCompanionTip } = await import('@/data/companionTips');
    const generalKeys = [
      'TIME_WARNING_60S', 'TIME_WARNING_90S', 'PACE_WARNING',
      'GUESS_BLANKS', 'FINAL_PUSH', 'MIDPOINT_ENCOURAGEMENT',
      'MARK_FOR_REVIEW', 'REVIEW_FLAGGED', 'DIGITAL_NAVIGATION',
      'QUICK_PASS_REMINDER', 'DEEP_DIVE_START',
    ];
    generalKeys.forEach(key => {
      const tip = getCompanionTip(key, 'EN');
      expect(tip, `Missing tip for key: ${key}`).not.toBeNull();
      expect(tip!.message.length).toBeGreaterThan(0);
    });
  });

  it('getCompanionTip returns section-specific SECTION_START for all sections', async () => {
    const { getCompanionTip } = await import('@/data/companionTips');
    ['EN', 'MATH', 'RD', 'SCI'].forEach(section => {
      const tip = getCompanionTip('SECTION_START', section);
      expect(tip, `Missing SECTION_START for ${section}`).not.toBeNull();
      expect(tip!.section).toBe(section);
    });
  });

  it('TIP_KEYS exports all expected keys', async () => {
    const { TIP_KEYS } = await import('@/data/companionTips');
    expect(TIP_KEYS.MARK_FOR_REVIEW).toBe('MARK_FOR_REVIEW');
    expect(TIP_KEYS.PACE_WARNING).toBe('PACE_WARNING');
    expect(TIP_KEYS.SECTION_START).toBe('SECTION_START');
    expect(TIP_KEYS.QUICK_PASS_REMINDER).toBe('QUICK_PASS_REMINDER');
    expect(TIP_KEYS.DEEP_DIVE_START).toBe('DEEP_DIVE_START');
  });
});

/**
 * ACT Enhanced format question count targets per section.
 * These are used as assertion baselines in live data integrity tests.
 */
describe('ACT Enhanced format constants', () => {
  const ACT_TARGETS = { EN: 50, MATH: 45, RD: 36, SCI: 40 };

  it('targets are defined for all 4 sections', () => {
    expect(Object.keys(ACT_TARGETS)).toEqual(['EN', 'MATH', 'RD', 'SCI']);
  });

  it('targets match Enhanced ACT format', () => {
    expect(ACT_TARGETS.EN).toBe(50);
    expect(ACT_TARGETS.MATH).toBe(45);
    expect(ACT_TARGETS.RD).toBe(36);
    expect(ACT_TARGETS.SCI).toBe(40);
  });
});
