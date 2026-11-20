import { describe, it, expect } from 'vitest';
import { localDateString, addDaysToDateString } from './localDate';

describe('localDateString', () => {
  it("uses the student's calendar day, not UTC", () => {
    // 9pm on Nov 19 local time is already Nov 20 in UTC for US time zones
    expect(localDateString(new Date(2026, 10, 19, 21, 0))).toBe('2026-11-19');
    expect(localDateString(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
  });
});

describe('addDaysToDateString', () => {
  it('moves across month and year ends', () => {
    expect(addDaysToDateString('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysToDateString('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDaysToDateString('2026-11-19', 6)).toBe('2026-11-25');
  });
});
