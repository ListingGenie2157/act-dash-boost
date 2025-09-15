import { useMemo } from 'react';

interface Question {
  id: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
}

interface ShuffledQuestion extends Question {
  shuffledChoices: string[];
  correctIndex: number;
  choiceOrder: number[];
}

export function useQuestionShuffle(questions: Question[], seed?: string): ShuffledQuestion[] {
  return useMemo(() => {
    return questions.map((question) => {
      const choices = [
        question.choice_a,
        question.choice_b,
        question.choice_c,
        question.choice_d,
      ];
      
      // Create a deterministic shuffle based on question ID and optional seed
      const shuffleSeed = `${question.id}-${seed || ''}`;
      const choiceOrder = [0, 1, 2, 3]; // A=0, B=1, C=2, D=3
      
      // Simple deterministic shuffle using string hash
      const hash = Array.from(shuffleSeed).reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      
      for (let i = choiceOrder.length - 1; i > 0; i--) {
        const j = Math.abs(hash + i) % (i + 1);
        [choiceOrder[i], choiceOrder[j]] = [choiceOrder[j], choiceOrder[i]];
      }
      
      const shuffledChoices = choiceOrder.map(index => choices[index]);
      
      const originalAnswerIndex = question.answer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      const correctIndex = choiceOrder.indexOf(originalAnswerIndex);
      
      return {
        ...question,
        shuffledChoices,
        correctIndex,
        choiceOrder,
      };
    });
  }, [questions, seed]);
}