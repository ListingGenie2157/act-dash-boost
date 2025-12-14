// Run Styles Configuration for ADHD-friendly drill modes

export interface RunStyle {
  id: 'sprint' | 'marathon' | 'pomodoro' | 'random';
  label: string;
  icon: string;
  questionCount: number;
  timePerQuestionSec: number;
  breakAfter?: number; // questions before break prompt
  description: string;
  shortDescription: string;
}

export const RUN_STYLES: RunStyle[] = [
  {
    id: 'sprint',
    label: 'Sprint',
    icon: '⚡',
    questionCount: 5,
    timePerQuestionSec: 30, // Faster pace for intensity
    description: 'Short, intense burst of 5 questions with a faster pace. Great for building focus and speed.',
    shortDescription: '5 questions • Fast pace',
  },
  {
    id: 'marathon',
    label: 'Marathon',
    icon: '🏃',
    questionCount: 20,
    timePerQuestionSec: 45, // Standard ACT pace
    description: 'Steady 20-question session at standard ACT pace. Build endurance for test day.',
    shortDescription: '20 questions • Steady pace',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    icon: '🍅',
    questionCount: 10,
    timePerQuestionSec: 45,
    breakAfter: 10, // Break after completing all questions
    description: '10 questions with a break prompt after completion. Work-rest rhythm for sustained focus.',
    shortDescription: '10 questions • Built-in break',
  },
  {
    id: 'random',
    label: 'Random Mix',
    icon: '🎲',
    questionCount: 10,
    timePerQuestionSec: 45,
    description: 'Shuffled questions from various skills. Keep your brain engaged with variety.',
    shortDescription: '10 questions • Mixed skills',
  },
];

export const getRunStyle = (id: string): RunStyle | undefined => {
  return RUN_STYLES.find(style => style.id === id);
};

export const getDefaultRunStyle = (): RunStyle => {
  return RUN_STYLES[0]; // Sprint as default
};

// Calculate total time for a run style
export const calculateRunTime = (style: RunStyle, questionCount?: number): number => {
  const count = questionCount ?? style.questionCount;
  return count * style.timePerQuestionSec;
};
