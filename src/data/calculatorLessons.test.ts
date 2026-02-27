import { describe, it, expect } from 'vitest';
import { calculatorLessons, CalculatorModel } from './calculatorLessons';

describe('Calculator Lab content integrity', () => {
  it('has at least one lesson', () => {
    expect(calculatorLessons.length).toBeGreaterThan(0);
  });

  it('has lessons for both TI-84 and Desmos models', () => {
    const models = new Set<CalculatorModel>();
    calculatorLessons.forEach(l => l.model.forEach(m => models.add(m)));
    expect(models.has('TI-84')).toBe(true);
    expect(models.has('Desmos')).toBe(true);
  });

  it('every lesson has required fields', () => {
    calculatorLessons.forEach(lesson => {
      expect(lesson.id).toBeTruthy();
      expect(lesson.title).toBeTruthy();
      expect(lesson.steps.length).toBeGreaterThan(0);
      expect(lesson.whenToUse).toBeTruthy();
      expect(lesson.model.length).toBeGreaterThan(0);
      expect(['beginner', 'intermediate', 'advanced']).toContain(lesson.difficulty);
    });
  });

  it('lessons with interactiveSteps have valid step structure', () => {
    const withSteps = calculatorLessons.filter(l => l.interactiveSteps?.length);
    expect(withSteps.length).toBeGreaterThan(0);
    withSteps.forEach(lesson => {
      lesson.interactiveSteps!.forEach(step => {
        expect(step.instruction).toBeTruthy();
        expect(step.buttonId).toBeTruthy();
        expect(step.screenDisplay).toBeTruthy();
      });
    });
  });

  it('lessons with challengeMode have valid timing expectations', () => {
    const withChallenge = calculatorLessons.filter(l => l.challengeMode);
    expect(withChallenge.length).toBeGreaterThan(0);
    withChallenge.forEach(lesson => {
      const cm = lesson.challengeMode!;
      expect(cm.expectedManualTime).toBeGreaterThan(0);
      expect(cm.expectedCalcTime).toBeGreaterThan(0);
      expect(cm.expectedCalcTime).toBeLessThan(cm.expectedManualTime);
      expect(cm.manualProblem).toBeTruthy();
      expect(cm.calculatorProblem).toBeTruthy();
    });
  });

  it('no duplicate lesson IDs', () => {
    const ids = calculatorLessons.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
