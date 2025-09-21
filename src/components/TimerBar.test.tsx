import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TimerBar } from './TimerBar';

describe('TimerBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('calls onTimeEnd once when time elapses to zero', () => {
    const onTimeEnd = vi.fn();
    render(<TimerBar timeLeftSec={3} totalTimeSec={3} onTimeEnd={onTimeEnd} />);

    // Advance 3 seconds
    vi.advanceTimersByTime(3000);

    expect(onTimeEnd).toHaveBeenCalledTimes(1);
  });

  it('does not call onTimeEnd when paused (isActive=false)', () => {
    const onTimeEnd = vi.fn();
    render(<TimerBar timeLeftSec={2} totalTimeSec={2} onTimeEnd={onTimeEnd} isActive={false} />);
    vi.advanceTimersByTime(5000);
    expect(onTimeEnd).not.toHaveBeenCalled();
  });
});

