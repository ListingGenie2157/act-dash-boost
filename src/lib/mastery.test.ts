import { describe, it, expect } from 'vitest';
import { calculateMasteryLevel } from './mastery';

describe('calculateMasteryLevel', () => {
  it('returns not-started when total is 0', () => {
    expect(calculateMasteryLevel(0, 0)).toBe('not-started');
    expect(calculateMasteryLevel(5, 0)).toBe('not-started');
  });

  it('returns learning when attempts are below minimum', () => {
    expect(calculateMasteryLevel(1, 0)).toBe('learning');
  });

  it('returns beginner for accuracy below 60%', () => {
    expect(calculateMasteryLevel(5, 10)).toBe('beginner'); // 50%
    expect(calculateMasteryLevel(0, 10)).toBe('beginner'); // 0%
    expect(calculateMasteryLevel(59, 100)).toBe('beginner'); // 59%
  });

  it('returns learning for accuracy 60-74%', () => {
    expect(calculateMasteryLevel(6, 10)).toBe('learning'); // 60%
    expect(calculateMasteryLevel(7, 10)).toBe('learning'); // 70%
    expect(calculateMasteryLevel(74, 100)).toBe('learning'); // 74%
  });

  it('returns proficient for accuracy 75-89%', () => {
    expect(calculateMasteryLevel(75, 100)).toBe('proficient'); // 75%
    expect(calculateMasteryLevel(80, 100)).toBe('proficient'); // 80%
    expect(calculateMasteryLevel(89, 100)).toBe('proficient'); // 89%
  });

  it('returns mastered for accuracy 90%+', () => {
    expect(calculateMasteryLevel(90, 100)).toBe('mastered'); // 90%
    expect(calculateMasteryLevel(95, 100)).toBe('mastered'); // 95%
    expect(calculateMasteryLevel(100, 100)).toBe('mastered'); // 100%
  });

  it('handles edge cases correctly', () => {
    expect(calculateMasteryLevel(60, 100)).toBe('learning');
    expect(calculateMasteryLevel(75, 100)).toBe('proficient');
    expect(calculateMasteryLevel(90, 100)).toBe('mastered');
  });

  it('handles large numbers correctly', () => {
    expect(calculateMasteryLevel(900, 1000)).toBe('mastered'); // 90%
    expect(calculateMasteryLevel(750, 1000)).toBe('proficient'); // 75%
    expect(calculateMasteryLevel(600, 1000)).toBe('learning'); // 60%
    expect(calculateMasteryLevel(500, 1000)).toBe('beginner'); // 50%
  });
});
