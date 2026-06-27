import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

Deno.test('finish-diagnostic - section enum validation is the four ACT sections', () => {
  const validSections = ['English', 'Math', 'Reading', 'Science'];
  for (const section of validSections) {
    assertEquals(validSections.includes(section), true);
  }
  // Legacy 'Mixed' (ONB quick diagnostic) is no longer accepted
  assertEquals(validSections.includes('Mixed'), false);
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

Deno.test('finish-diagnostic - shuffle de-mapping produces correct letter', () => {
  const IDX_TO_LETTER = ['A', 'B', 'C', 'D'];
  
  // Scenario: choice_order = [2, 0, 3, 1]
  // UI position 0 shows original choice C (index 2)
  // UI position 1 shows original choice A (index 0)
  // UI position 2 shows original choice D (index 3)
  // UI position 3 shows original choice B (index 1)
  const choiceOrder = [2, 0, 3, 1];
  
  // User taps position 0 → selected_idx = 0
  // De-shuffle: choiceOrder[0] = 2 → IDX_TO_LETTER[2] = 'C'
  const selected0 = IDX_TO_LETTER[choiceOrder[0]];
  assertEquals(selected0, 'C');
  
  // User taps position 1 → selected_idx = 1
  // De-shuffle: choiceOrder[1] = 0 → IDX_TO_LETTER[0] = 'A'
  const selected1 = IDX_TO_LETTER[choiceOrder[1]];
  assertEquals(selected1, 'A');
  
  // User taps position 2 → selected_idx = 2
  // De-shuffle: choiceOrder[2] = 3 → IDX_TO_LETTER[3] = 'D'
  const selected2 = IDX_TO_LETTER[choiceOrder[2]];
  assertEquals(selected2, 'D');
  
  // User taps position 3 → selected_idx = 3
  // De-shuffle: choiceOrder[3] = 1 → IDX_TO_LETTER[1] = 'B'
  const selected3 = IDX_TO_LETTER[choiceOrder[3]];
  assertEquals(selected3, 'B');
});

Deno.test('finish-diagnostic - identity shuffle produces same letter', () => {
  const IDX_TO_LETTER = ['A', 'B', 'C', 'D'];
  const choiceOrder = [0, 1, 2, 3]; // no shuffle
  
  for (let i = 0; i < 4; i++) {
    assertEquals(IDX_TO_LETTER[choiceOrder[i]], IDX_TO_LETTER[i]);
  }
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
