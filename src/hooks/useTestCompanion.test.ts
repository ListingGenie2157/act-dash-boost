import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTestCompanion, type UseTestCompanionParams } from './useTestCompanion';

vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

vi.mock('@/data/companionTips', () => ({
  getCompanionTip: (tipKey: string, section: string) => {
    const validKeys = [
      'MARK_FOR_REVIEW', 'TIME_WARNING_90S', 'PACE_WARNING',
      'GUESS_BLANKS', 'FINAL_PUSH', 'REVIEW_FLAGGED',
      'QUICK_PASS_REMINDER', 'DEEP_DIVE_START',
      'SECTION_START', 'MIDPOINT_ENCOURAGEMENT', 'DIGITAL_NAVIGATION',
    ];
    if (!validKeys.includes(tipKey)) return null;
    return { message: `${tipKey} tip for ${section}` };
  },
}));

import { toast } from 'sonner';

function tipCalls(key: string) {
  return (toast.info as ReturnType<typeof vi.fn>).mock.calls.filter(
    (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes(key)
  ).length;
}

const base: UseTestCompanionParams = {
  enabled: true,
  section: 'EN',
  currentQuestionIndex: 10,
  totalQuestions: 50,
  totalTimeLeftSec: 1500,
  totalTimeSec: 2100,
  hasAnswer: false,
  answeredCount: 20,
  flaggedCount: 0,
  currentPass: 'quick',
};

function rh(overrides: Partial<UseTestCompanionParams> = {}) {
  const props: UseTestCompanionParams = { ...base, ...overrides };
  return renderHook(
    (p: UseTestCompanionParams) => useTestCompanion(p),
    { initialProps: props }
  );
}

describe('useTestCompanion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('does not fire tips when disabled', () => {
    rh({ enabled: false });
    act(() => { vi.advanceTimersByTime(120000); });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('fires MARK_FOR_REVIEW after 60s stuck', () => {
    rh({ hasAnswer: false });
    act(() => { vi.advanceTimersByTime(61000); });
    expect(tipCalls('MARK_FOR_REVIEW')).toBeGreaterThanOrEqual(1);
  });

  // Progress-based triggers work via advanceAndRerender because their deps include totalTimeLeftSec
  it('fires PACE_WARNING when >50% time used and <40% complete', () => {
    const props: UseTestCompanionParams = { ...base, totalTimeLeftSec: 900, answeredCount: 15 };
    const { rerender } = renderHook((p: UseTestCompanionParams) => useTestCompanion(p), { initialProps: props });
    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...props, totalTimeLeftSec: 899 });
    expect(tipCalls('PACE_WARNING')).toBeGreaterThanOrEqual(1);
  });

  it('fires GUESS_BLANKS when <5min left and >5 unanswered', () => {
    const props: UseTestCompanionParams = { ...base, totalTimeLeftSec: 250, answeredCount: 40 };
    const { rerender } = renderHook((p: UseTestCompanionParams) => useTestCompanion(p), { initialProps: props });
    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...props, totalTimeLeftSec: 249 });
    expect(tipCalls('GUESS_BLANKS')).toBeGreaterThanOrEqual(1);
  });

  it('fires FINAL_PUSH when <2min left and blanks remain', () => {
    const props: UseTestCompanionParams = { ...base, totalTimeLeftSec: 100, answeredCount: 48 };
    const { rerender } = renderHook((p: UseTestCompanionParams) => useTestCompanion(p), { initialProps: props });
    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...props, totalTimeLeftSec: 99 });
    expect(tipCalls('FINAL_PUSH')).toBeGreaterThanOrEqual(1);
  });

  it('fires REVIEW_FLAGGED when flaggedCount > 0 and 4-5 min left', () => {
    const props: UseTestCompanionParams = { ...base, flaggedCount: 3, totalTimeLeftSec: 270 };
    const { rerender } = renderHook((p: UseTestCompanionParams) => useTestCompanion(p), { initialProps: props });
    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...props, totalTimeLeftSec: 269 });
    expect(tipCalls('REVIEW_FLAGGED')).toBeGreaterThanOrEqual(1);
  });

  // For effects depending on currentQuestionIndex/currentPass:
  // Mount with neutral values, advance past cooldown, then switch to trigger values
  it('fires QUICK_PASS_REMINDER at question 5 during quick pass', () => {
    const { rerender } = renderHook(
      (p: UseTestCompanionParams) => useTestCompanion(p),
      { initialProps: { ...base, currentQuestionIndex: 4, currentPass: 'quick' as const } }
    );
    act(() => { vi.advanceTimersByTime(46000); });
    // Now switch to question 5 to trigger the effect
    rerender({ ...base, currentQuestionIndex: 5, currentPass: 'quick' });
    expect(tipCalls('QUICK_PASS_REMINDER')).toBeGreaterThanOrEqual(1);
  });

  it('fires DEEP_DIVE_START during deep pass with flagged questions', () => {
    const init: UseTestCompanionParams = { ...base, currentPass: 'quick', flaggedCount: 3 };
    const { rerender } = renderHook(
      (p: UseTestCompanionParams) => useTestCompanion(p),
      { initialProps: init }
    );
    act(() => { vi.advanceTimersByTime(46000); });
    const next: UseTestCompanionParams = { ...base, currentPass: 'deep', flaggedCount: 3 };
    rerender(next);
    expect(tipCalls('DEEP_DIVE_START')).toBeGreaterThanOrEqual(1);
  });

  it('fires SECTION_START at question 0 after 3s delay', () => {
    const { rerender } = renderHook(
      (p: UseTestCompanionParams) => useTestCompanion(p),
      { initialProps: { ...base, currentQuestionIndex: 99 } }
    );
    // Advance past cooldown
    act(() => { vi.advanceTimersByTime(46000); });
    // Switch to question 0 - the setTimeout(3s) starts
    rerender({ ...base, currentQuestionIndex: 0 });
    act(() => { vi.advanceTimersByTime(4000); });
    expect(tipCalls('SECTION_START')).toBe(1);
  });

  it('fires MIDPOINT_ENCOURAGEMENT at midpoint', () => {
    const { rerender } = renderHook(
      (p: UseTestCompanionParams) => useTestCompanion(p),
      { initialProps: { ...base, currentQuestionIndex: 24 } }
    );
    act(() => { vi.advanceTimersByTime(46000); });
    // Switch to midpoint (25 = floor(50/2))
    rerender({ ...base, currentQuestionIndex: 25 });
    expect(tipCalls('MIDPOINT_ENCOURAGEMENT')).toBeGreaterThanOrEqual(1);
  });

  it('fires DIGITAL_NAVIGATION at question 3', () => {
    const { rerender } = renderHook(
      (p: UseTestCompanionParams) => useTestCompanion(p),
      { initialProps: { ...base, currentQuestionIndex: 2 } }
    );
    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...base, currentQuestionIndex: 3 });
    expect(tipCalls('DIGITAL_NAVIGATION')).toBeGreaterThanOrEqual(1);
  });

  it('each tip fires only once (dedup)', () => {
    const props: UseTestCompanionParams = { ...base, totalTimeLeftSec: 250, answeredCount: 40 };
    const { rerender } = renderHook((p: UseTestCompanionParams) => useTestCompanion(p), { initialProps: props });
    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...props, totalTimeLeftSec: 249 });
    expect(tipCalls('GUESS_BLANKS')).toBe(1);

    act(() => { vi.advanceTimersByTime(46000); });
    rerender({ ...props, totalTimeLeftSec: 248 });
    expect(tipCalls('GUESS_BLANKS')).toBe(1);
  });

  it('respects max tip cap of 15', () => {
    const { result } = rh({ currentQuestionIndex: 0 });
    for (let i = 0; i < 20; i++) {
      act(() => { vi.advanceTimersByTime(46000); });
      act(() => { result.current.fireTip(`CUSTOM_TIP_${i}`); });
    }
    expect(result.current.tipCount).toBeLessThanOrEqual(15);
  });

  it('reset clears state', () => {
    const { result } = rh({ currentQuestionIndex: 3 });
    act(() => { vi.advanceTimersByTime(46000); });
    act(() => { result.current.reset(); });
    expect(result.current.tipCount).toBe(0);
  });
});
