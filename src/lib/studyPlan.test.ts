import { describe, it, expect } from 'vitest';

// Test helper functions extracted from generate-study-plan logic
// These test the pure functions that can be unit tested

describe('Study Plan Generation Logic', () => {
  describe('calculateDaysLeft', () => {
    const calculateDaysLeft = (
      today: Date,
      testDate: Date | null,
    ): number | null => {
      if (!testDate) return null;
      const timeDiff = testDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff;
    };

    it('returns null when test date is null', () => {
      const today = new Date('2024-01-01');
      expect(calculateDaysLeft(today, null)).toBeNull();
    });

    it('calculates days correctly for future dates', () => {
      const today = new Date('2024-01-01');
      const testDate = new Date('2024-01-15');
      expect(calculateDaysLeft(today, testDate)).toBe(14);
    });

    it('handles same day correctly', () => {
      const today = new Date('2024-01-01');
      const testDate = new Date('2024-01-01');
      expect(calculateDaysLeft(today, testDate)).toBe(0);
    });

    it('handles past dates (negative days)', () => {
      const today = new Date('2024-01-15');
      const testDate = new Date('2024-01-01');
      expect(calculateDaysLeft(today, testDate)).toBe(-14);
    });
  });

  describe('getStudyMode', () => {
    const getStudyMode = (daysLeft: number | null): {
      name: 'CRASH' | 'ACCEL' | 'MASTERY';
      allowLearn: boolean;
    } => {
      if (daysLeft === null || daysLeft > 30) {
        return { name: 'MASTERY', allowLearn: true };
      } else if (daysLeft <= 7) {
        return { name: 'CRASH', allowLearn: false };
      } else {
        return { name: 'ACCEL', allowLearn: true };
      }
    };

    it('returns MASTERY mode when daysLeft is null', () => {
      const mode = getStudyMode(null);
      expect(mode.name).toBe('MASTERY');
      expect(mode.allowLearn).toBe(true);
    });

    it('returns MASTERY mode when daysLeft > 30', () => {
      expect(getStudyMode(31).name).toBe('MASTERY');
      expect(getStudyMode(100).name).toBe('MASTERY');
    });

    it('returns CRASH mode when daysLeft <= 7', () => {
      expect(getStudyMode(7).name).toBe('CRASH');
      expect(getStudyMode(1).name).toBe('CRASH');
      expect(getStudyMode(0).name).toBe('CRASH');
      expect(getStudyMode(-1).name).toBe('CRASH');
    });

    it('returns ACCEL mode when 7 < daysLeft <= 30', () => {
      expect(getStudyMode(8).name).toBe('ACCEL');
      expect(getStudyMode(15).name).toBe('ACCEL');
      expect(getStudyMode(30).name).toBe('ACCEL');
    });

    it('CRASH mode disallows learning', () => {
      expect(getStudyMode(5).allowLearn).toBe(false);
    });

    it('MASTERY and ACCEL modes allow learning', () => {
      expect(getStudyMode(null).allowLearn).toBe(true);
      expect(getStudyMode(15).allowLearn).toBe(true);
    });
  });

  describe('selectPlaylist (task selection with time cap)', () => {
    interface Task {
      type: 'REVIEW' | 'DRILL' | 'LEARN';
      estimatedMins: number;
      priority: number;
    }

    const selectPlaylist = (priorities: Task[], capMins: number): Task[] => {
      const selected: Task[] = [];
      let remainingMins = capMins;

      for (const task of priorities) {
        if (task.estimatedMins <= remainingMins) {
          selected.push(task);
          remainingMins -= task.estimatedMins;
          if (selected.length >= 3) break; // Max 3 tasks
        }
      }

      return selected;
    };

    it('selects tasks within time cap', () => {
      const tasks: Task[] = [
        { type: 'LEARN', estimatedMins: 15, priority: 1 },
        { type: 'DRILL', estimatedMins: 20, priority: 2 },
        { type: 'REVIEW', estimatedMins: 10, priority: 3 },
      ];
      const selected = selectPlaylist(tasks, 50);
      expect(selected.length).toBe(3);
      expect(selected.reduce((sum, t) => sum + t.estimatedMins, 0)).toBeLessThanOrEqual(50);
    });

    it('stops at max 3 tasks', () => {
      const tasks: Task[] = [
        { type: 'LEARN', estimatedMins: 5, priority: 1 },
        { type: 'DRILL', estimatedMins: 5, priority: 2 },
        { type: 'REVIEW', estimatedMins: 5, priority: 3 },
        { type: 'LEARN', estimatedMins: 5, priority: 4 },
      ];
      const selected = selectPlaylist(tasks, 50);
      expect(selected.length).toBe(3);
    });

    it('skips tasks that exceed remaining time', () => {
      const tasks: Task[] = [
        { type: 'LEARN', estimatedMins: 20, priority: 1 },
        { type: 'DRILL', estimatedMins: 30, priority: 2 }, // Too large
        { type: 'REVIEW', estimatedMins: 10, priority: 3 },
      ];
      const selected = selectPlaylist(tasks, 35);
      expect(selected.length).toBe(2);
      expect(selected[0].type).toBe('LEARN');
      expect(selected[1].type).toBe('REVIEW');
    });

    it('returns empty array when no tasks fit', () => {
      const tasks: Task[] = [
        { type: 'LEARN', estimatedMins: 50, priority: 1 },
      ];
      const selected = selectPlaylist(tasks, 30);
      expect(selected.length).toBe(0);
    });
  });
});
