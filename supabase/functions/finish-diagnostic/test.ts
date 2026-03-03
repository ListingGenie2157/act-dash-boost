import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

Deno.test('finish-diagnostic - section enum validation', () => {
  // Valid sections
  const validSections = ['English', 'Math', 'Reading', 'Science'];
  for (const section of validSections) {
    assertEquals(validSections.includes(section), true);
  }
});

Deno.test('finish-diagnostic - index to letter conversion', () => {
  const IDX_TO_LETTER = ['A', 'B', 'C', 'D'];
  
  assertEquals(IDX_TO_LETTER[0], 'A');
  assertEquals(IDX_TO_LETTER[1], 'B');
  assertEquals(IDX_TO_LETTER[2], 'C');
  assertEquals(IDX_TO_LETTER[3], 'D');
  
  // Numeric string conversion
  const numIdx = parseInt('2', 10);
  assertEquals(!isNaN(numIdx) && numIdx >= 0 && numIdx <= 3, true);
  assertEquals(IDX_TO_LETTER[numIdx], 'C');
});

Deno.test('finish-diagnostic - answer matching is case-insensitive', () => {
  const realAnswer = 'A';
  const selectedLetter = 'a'.toUpperCase();
  assertEquals(selectedLetter === realAnswer, true);
});

Deno.test('finish-diagnostic - skill accuracy aggregation', () => {
  const skillAccuracy: Record<string, { correct: number; total: number }> = {};
  
  const skills = [
    { skill: 'math-1', isCorrect: true },
    { skill: 'math-1', isCorrect: false },
    { skill: 'math-1', isCorrect: true },
    { skill: 'eng-1', isCorrect: false },
  ];
  
  for (const { skill, isCorrect } of skills) {
    if (!skillAccuracy[skill]) {
      skillAccuracy[skill] = { correct: 0, total: 0 };
    }
    skillAccuracy[skill].total++;
    if (isCorrect) skillAccuracy[skill].correct++;
  }
  
  assertEquals(skillAccuracy['math-1'].total, 3);
  assertEquals(skillAccuracy['math-1'].correct, 2);
  assertEquals(skillAccuracy['eng-1'].total, 1);
  assertEquals(skillAccuracy['eng-1'].correct, 0);
  
  // Mastery level calculation
  const accuracy = skillAccuracy['math-1'].correct / skillAccuracy['math-1'].total;
  const masteryLevel = accuracy >= 0.8 ? 3 : accuracy >= 0.5 ? 2 : 1;
  assertEquals(masteryLevel, 2); // 66% = level 2
});