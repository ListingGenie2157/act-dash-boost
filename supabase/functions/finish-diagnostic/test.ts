import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

// Pure scorer function for testing
export function scoreDiagnostic(blocks: Array<{
  questions: Array<{ id: string; skill_tags?: string[] }>;
  answers: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>;
}>): { score: number; skillAccuracy: Record<string, { correct: number; total: number }> } {
  let totalCorrect = 0;
  let totalQuestions = 0;
  const skillAccuracy: Record<string, { correct: number; total: number }> = {};

  // Skill mapping for diagnostic questions
  const skillMapping: Record<string, string[]> = {
    'algebra': ['math-algebra-linear', 'math-algebra-systems'],
    'geometry': ['math-geometry-coordinate', 'math-geometry-plane'],
    'trigonometry': ['math-trigonometry-basic', 'math-trigonometry-graphs'],
    'grammar': ['english-grammar-usage', 'english-grammar-punctuation'],
    'rhetoric': ['english-rhetoric-strategy', 'english-rhetoric-organization'],
    'reading-comprehension': ['reading-main-ideas', 'reading-details'],
    'scientific-reasoning': ['science-data-representation', 'science-research-summaries']
  };

  function getSkillFromTags(tags: string[] = []): string | null {
    for (const tag of tags) {
      if (skillMapping[tag]) {
        return skillMapping[tag][0];
      }
    }
    return null;
  }

  for (const block of blocks) {
    for (let i = 0; i < block.questions.length; i++) {
      const question = block.questions[i];
      const answer = block.answers[i];
      
      if (answer) {
        totalQuestions++;
        if (answer.isCorrect) {
          totalCorrect++;
        }

        // Track skill-level accuracy
        const skill = getSkillFromTags(question.skill_tags);
        if (skill) {
          if (!skillAccuracy[skill]) {
            skillAccuracy[skill] = { correct: 0, total: 0 };
          }
          skillAccuracy[skill].total++;
          if (answer.isCorrect) {
            skillAccuracy[skill].correct++;
          }
        }
      }
    }
  }

  const score = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  return { score, skillAccuracy };
}

Deno.test('scoreDiagnostic - basic scoring', () => {
  const blocks = [
    {
      questions: [
        { id: 'q1', skill_tags: ['grammar'] },
        { id: 'q2', skill_tags: ['algebra'] }
      ],
      answers: [
        { questionId: 'q1', selectedAnswer: 'A', isCorrect: true },
        { questionId: 'q2', selectedAnswer: 'B', isCorrect: false }
      ]
    }
  ];

  const result = scoreDiagnostic(blocks);
  
  assertEquals(result.score, 50);
  assertEquals(result.skillAccuracy['english-grammar-usage'].correct, 1);
  assertEquals(result.skillAccuracy['english-grammar-usage'].total, 1);
  assertEquals(result.skillAccuracy['math-algebra-linear'].correct, 0);
  assertEquals(result.skillAccuracy['math-algebra-linear'].total, 1);
});

Deno.test('scoreDiagnostic - perfect score', () => {
  const blocks = [
    {
      questions: [
        { id: 'q1', skill_tags: ['grammar'] },
        { id: 'q2', skill_tags: ['rhetoric'] }
      ],
      answers: [
        { questionId: 'q1', selectedAnswer: 'A', isCorrect: true },
        { questionId: 'q2', selectedAnswer: 'B', isCorrect: true }
      ]
    }
  ];

  const result = scoreDiagnostic(blocks);
  
  assertEquals(result.score, 100);
  assertEquals(result.skillAccuracy['english-grammar-usage'].correct, 1);
  assertEquals(result.skillAccuracy['english-rhetoric-strategy'].correct, 1);
});

Deno.test('scoreDiagnostic - no answers', () => {
  const blocks = [
    {
      questions: [
        { id: 'q1', skill_tags: ['grammar'] }
      ],
      answers: []
    }
  ];

  const result = scoreDiagnostic(blocks);
  
  assertEquals(result.score, 0);
  assertEquals(Object.keys(result.skillAccuracy).length, 0);
});

Deno.test('scoreDiagnostic - multiple blocks', () => {
  const blocks = [
    {
      questions: [
        { id: 'q1', skill_tags: ['grammar'] }
      ],
      answers: [
        { questionId: 'q1', selectedAnswer: 'A', isCorrect: true }
      ]
    },
    {
      questions: [
        { id: 'q2', skill_tags: ['grammar'] }
      ],
      answers: [
        { questionId: 'q2', selectedAnswer: 'B', isCorrect: false }
      ]
    }
  ];

  const result = scoreDiagnostic(blocks);
  
  assertEquals(result.score, 50);
  assertEquals(result.skillAccuracy['english-grammar-usage'].correct, 1);
  assertEquals(result.skillAccuracy['english-grammar-usage'].total, 2);
});

Deno.test('scoreDiagnostic - unknown skill tags', () => {
  const blocks = [
    {
      questions: [
        { id: 'q1', skill_tags: ['unknown-skill'] },
        { id: 'q2' } // No skill tags
      ],
      answers: [
        { questionId: 'q1', selectedAnswer: 'A', isCorrect: true },
        { questionId: 'q2', selectedAnswer: 'B', isCorrect: true }
      ]
    }
  ];

  const result = scoreDiagnostic(blocks);
  
  assertEquals(result.score, 100);
  assertEquals(Object.keys(result.skillAccuracy).length, 0);
});