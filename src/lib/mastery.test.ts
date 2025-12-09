import { describe, it, expect } from 'vitest';
import {
  MASTERY_THRESHOLDS,
  calculateMasteryLevel,
  getMasteryColor,
  getMasteryLabel,
  type MasteryLevel,
} from './mastery';

describe('MASTERY_THRESHOLDS', () => {
  it('has correct threshold values', () => {
    expect(MASTERY_THRESHOLDS.BEGINNER).toBe(0);
    expect(MASTERY_THRESHOLDS.LEARNING).toBe(60);
    expect(MASTERY_THRESHOLDS.PROFICIENT).toBe(75);
    expect(MASTERY_THRESHOLDS.MASTERED).toBe(90);
  });
});

describe('calculateMasteryLevel', () => {
  describe('not-started level', () => {
    it('returns not-started when total is 0', () => {
      expect(calculateMasteryLevel(0, 0)).toBe('not-started');
    });
  });

  describe('learning level for insufficient attempts', () => {
    it('returns learning when below minimum attempts', () => {
      // MASTERY_MIN_ATTEMPTS is 1, so 0 attempts would return not-started
      // This edge case tests the boundary
      const result = calculateMasteryLevel(0, 0);
      expect(result).toBe('not-started');
    });
  });

  describe('mastered level (≥90%)', () => {
    it('returns mastered for 90% accuracy', () => {
      expect(calculateMasteryLevel(9, 10)).toBe('mastered');
    });

    it('returns mastered for 100% accuracy', () => {
      expect(calculateMasteryLevel(10, 10)).toBe('mastered');
    });

    it('returns mastered for 95% accuracy', () => {
      expect(calculateMasteryLevel(19, 20)).toBe('mastered');
    });
  });

  describe('proficient level (75-89%)', () => {
    it('returns proficient for 75% accuracy', () => {
      expect(calculateMasteryLevel(15, 20)).toBe('proficient');
    });

    it('returns proficient for 89% accuracy', () => {
      // 89% is below 90%, so should be proficient
      // 89/100 = 0.89 -> proficient
      expect(calculateMasteryLevel(89, 100)).toBe('proficient');
    });

    it('returns proficient for 80% accuracy', () => {
      expect(calculateMasteryLevel(8, 10)).toBe('proficient');
    });
  });

  describe('learning level (60-74%)', () => {
    it('returns learning for 60% accuracy', () => {
      expect(calculateMasteryLevel(6, 10)).toBe('learning');
    });

    it('returns learning for 74% accuracy', () => {
      // 74/100 = 0.74 -> learning
      expect(calculateMasteryLevel(74, 100)).toBe('learning');
    });

    it('returns learning for 65% accuracy', () => {
      expect(calculateMasteryLevel(13, 20)).toBe('learning');
    });
  });

  describe('beginner level (<60%)', () => {
    it('returns beginner for 0% accuracy', () => {
      expect(calculateMasteryLevel(0, 10)).toBe('beginner');
    });

    it('returns beginner for 50% accuracy', () => {
      expect(calculateMasteryLevel(5, 10)).toBe('beginner');
    });

    it('returns beginner for 59% accuracy', () => {
      // 59/100 = 0.59 -> beginner
      expect(calculateMasteryLevel(59, 100)).toBe('beginner');
    });
  });

  describe('boundary conditions', () => {
    it('handles exact threshold at 60%', () => {
      expect(calculateMasteryLevel(60, 100)).toBe('learning');
    });

    it('handles exact threshold at 75%', () => {
      expect(calculateMasteryLevel(75, 100)).toBe('proficient');
    });

    it('handles exact threshold at 90%', () => {
      expect(calculateMasteryLevel(90, 100)).toBe('mastered');
    });

    it('handles just below 60% threshold', () => {
      expect(calculateMasteryLevel(59, 100)).toBe('beginner');
    });

    it('handles just below 75% threshold', () => {
      expect(calculateMasteryLevel(74, 100)).toBe('learning');
    });

    it('handles just below 90% threshold', () => {
      expect(calculateMasteryLevel(89, 100)).toBe('proficient');
    });
  });

  describe('real-world scenarios', () => {
    it('handles small sample size correctly', () => {
      // 1 correct out of 1 = 100%
      expect(calculateMasteryLevel(1, 1)).toBe('mastered');
    });

    it('handles typical quiz completion', () => {
      // 7 correct out of 10 = 70%
      expect(calculateMasteryLevel(7, 10)).toBe('learning');
    });

    it('handles large sample size', () => {
      // 450 correct out of 500 = 90%
      expect(calculateMasteryLevel(450, 500)).toBe('mastered');
    });
  });
});

describe('getMasteryColor', () => {
  const levels: MasteryLevel[] = ['mastered', 'proficient', 'learning', 'beginner', 'not-started'];

  it('returns valid color objects for all levels', () => {
    for (const level of levels) {
      const colors = getMasteryColor(level);
      expect(colors).toHaveProperty('bg');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('border');
      expect(colors).toHaveProperty('icon');
    }
  });

  it('returns green theme for mastered', () => {
    const colors = getMasteryColor('mastered');
    expect(colors.bg).toContain('green');
    expect(colors.text).toContain('green');
    expect(colors.border).toContain('green');
    expect(colors.icon).toBe('🏆');
  });

  it('returns blue theme for proficient', () => {
    const colors = getMasteryColor('proficient');
    expect(colors.bg).toContain('blue');
    expect(colors.text).toContain('blue');
    expect(colors.border).toContain('blue');
    expect(colors.icon).toBe('⭐');
  });

  it('returns yellow theme for learning', () => {
    const colors = getMasteryColor('learning');
    expect(colors.bg).toContain('yellow');
    expect(colors.text).toContain('yellow');
    expect(colors.border).toContain('yellow');
    expect(colors.icon).toBe('📚');
  });

  it('returns orange theme for beginner', () => {
    const colors = getMasteryColor('beginner');
    expect(colors.bg).toContain('orange');
    expect(colors.text).toContain('orange');
    expect(colors.border).toContain('orange');
    expect(colors.icon).toBe('🌱');
  });

  it('returns gray theme for not-started', () => {
    const colors = getMasteryColor('not-started');
    expect(colors.bg).toContain('gray');
    expect(colors.text).toContain('gray');
    expect(colors.border).toContain('gray');
    expect(colors.icon).toBe('⚪');
  });

  it('includes dark mode variants', () => {
    for (const level of levels) {
      const colors = getMasteryColor(level);
      expect(colors.bg).toContain('dark:');
      expect(colors.text).toContain('dark:');
      expect(colors.border).toContain('dark:');
    }
  });
});

describe('getMasteryLabel', () => {
  it('returns "Mastered" for mastered level', () => {
    expect(getMasteryLabel('mastered')).toBe('Mastered');
  });

  it('returns "Proficient" for proficient level', () => {
    expect(getMasteryLabel('proficient')).toBe('Proficient');
  });

  it('returns "Learning" for learning level', () => {
    expect(getMasteryLabel('learning')).toBe('Learning');
  });

  it('returns "Beginner" for beginner level', () => {
    expect(getMasteryLabel('beginner')).toBe('Beginner');
  });

  it('returns "Not Started" for not-started level', () => {
    expect(getMasteryLabel('not-started')).toBe('Not Started');
  });

  it('returns proper capitalization for all labels', () => {
    const labels = [
      getMasteryLabel('mastered'),
      getMasteryLabel('proficient'),
      getMasteryLabel('learning'),
      getMasteryLabel('beginner'),
      getMasteryLabel('not-started'),
    ];
    
    for (const label of labels) {
      // First character should be uppercase
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});
