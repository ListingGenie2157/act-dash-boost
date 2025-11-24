/**
 * Shuffle choices for a question while tracking the correct answer
 */

export interface ShuffledQuestion<T> {
  original: T;
  choices: string[];
  correctIndex: number;
  choiceOrder: number[]; // Maps shuffled index back to original [0,1,2,3]
}

/**
 * Shuffle answer choices and track correct answer position
 * 
 * @param question - Question with choice_a, choice_b, choice_c, choice_d, answer
 * @returns Shuffled choices with correct index tracked
 */
export function shuffleQuestionChoices<T extends {
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
}>(question: T, seed?: string): ShuffledQuestion<T> {
  // Validate answer field
  const answer = question.answer?.toUpperCase() || '';
  if (!['A', 'B', 'C', 'D'].includes(answer)) {
    console.error(`Invalid answer "${question.answer}" in shuffleQuestionChoices. Defaulting to 'A'.`);
    // Return unshuffled with answer defaulted to 'A' as fallback
    return {
      original: question,
      choices: [question.choice_a, question.choice_b, question.choice_c, question.choice_d],
      correctIndex: 0,
      choiceOrder: [0, 1, 2, 3],
    };
  }

  // Original choices in order
  const originalChoices = [
    question.choice_a,
    question.choice_b,
    question.choice_c,
    question.choice_d,
  ];

  // Find which index (0-3) corresponds to the correct answer (A-D)
  const originalCorrectIndex = ['A', 'B', 'C', 'D'].indexOf(answer);

  // Create shuffled order using Fisher-Yates
  const choiceOrder = [0, 1, 2, 3];
  
  // Use seed for consistent shuffling (if provided)
  const random = seed ? seededRandom(seed) : Math.random;
  
  for (let i = choiceOrder.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choiceOrder[i], choiceOrder[j]] = [choiceOrder[j], choiceOrder[i]];
  }

  // Apply shuffle to choices
  const shuffledChoices = choiceOrder.map(index => originalChoices[index]);

  // Find new position of correct answer
  const correctIndex = choiceOrder.indexOf(originalCorrectIndex);

  return {
    original: question,
    choices: shuffledChoices,
    correctIndex,
    choiceOrder,
  };
}

/**
 * Shuffle an array of questions
 */
export function shuffleQuestions<T>(questions: T[], seed?: string): T[] {
  const shuffled = [...questions];
  const random = seed ? seededRandom(seed) : Math.random;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Simple seeded random number generator
 * Returns a function that generates pseudo-random numbers based on seed
 */
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * Shuffle choices for multiple questions at once
 */
export function shuffleAllQuestions<T extends {
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
}>(questions: T[], seedPrefix?: string): ShuffledQuestion<T>[] {
  return questions.map((q, idx) => {
    // Use question index as part of seed for consistent but varied shuffling
    const seed = seedPrefix ? `${seedPrefix}-${idx}` : undefined;
    return shuffleQuestionChoices(q, seed);
  });
}

/**
 * Map user's selected shuffled index back to original answer letter
 * 
 * @param selectedIndex - Index user clicked (0-3) in shuffled array
 * @param choiceOrder - The shuffle mapping
 * @returns Original answer letter (A, B, C, or D)
 */
export function mapShuffledIndexToLetter(selectedIndex: number, choiceOrder: number[]): string {
  const originalIndex = choiceOrder[selectedIndex];
  return ['A', 'B', 'C', 'D'][originalIndex];
}

/**
 * Check if shuffled answer is correct
 * 
 * @param selectedIndex - Index user clicked in shuffled array
 * @param correctIndex - Correct index in shuffled array
 * @returns true if correct
 */
export function isShuffledAnswerCorrect(selectedIndex: number, correctIndex: number): boolean {
  return selectedIndex === correctIndex;
}
