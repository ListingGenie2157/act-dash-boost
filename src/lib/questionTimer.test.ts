import { describe, it, expect } from 'vitest';
import { createQuestionTimer } from './questionTimer';

describe('createQuestionTimer', () => {
  it('measures time a question is on screen', () => {
    let now = 1000;
    const timer = createQuestionTimer(() => now);
    timer.show('q1');
    now = 4000;
    expect(timer.elapsed('q1')).toBe(3000);
  });

  it('adds up time across revisits and pauses while another question is shown', () => {
    let now = 0;
    const timer = createQuestionTimer(() => now);
    timer.show('q1');
    now = 2000;
    timer.show('q2'); // q1 paused
    now = 7000;
    timer.show('q1'); // back to q1
    now = 8000;
    expect(timer.elapsed('q1')).toBe(3000);
    expect(timer.elapsed('q2')).toBe(5000);
  });

  it('stops counting after pause()', () => {
    let now = 0;
    const timer = createQuestionTimer(() => now);
    timer.show('q1');
    now = 1000;
    timer.pause();
    now = 9000;
    expect(timer.elapsed('q1')).toBe(1000);
  });

  it('returns 0 for a question never shown', () => {
    expect(createQuestionTimer(() => 0).elapsed('nope')).toBe(0);
  });
});
