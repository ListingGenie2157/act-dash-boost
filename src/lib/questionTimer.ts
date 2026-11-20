/**
 * Tracks how long each question is on screen, summed across revisits.
 * Only one question counts at a time; showing another pauses the previous one.
 */
export interface QuestionTimer {
  show(questionId: string): void;
  pause(): void;
  elapsed(questionId: string): number;
}

export function createQuestionTimer(now: () => number = () => Date.now()): QuestionTimer {
  const totals = new Map<string, number>();
  let current: string | null = null;
  let since = 0;

  const flush = () => {
    if (current === null) return;
    totals.set(current, (totals.get(current) ?? 0) + (now() - since));
    current = null;
  };

  return {
    show(questionId) {
      if (current === questionId) return;
      flush();
      current = questionId;
      since = now();
    },
    pause: flush,
    elapsed(questionId) {
      const base = totals.get(questionId) ?? 0;
      return current === questionId ? base + (now() - since) : base;
    },
  };
}
