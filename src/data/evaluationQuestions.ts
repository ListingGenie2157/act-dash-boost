// Evaluation questions for the diagnostic test
export const evaluationQuestions = {
  english: [
    {
      id: 'eng1',
      question: 'Choose the best revision for the underlined portion.',
      passage: 'The student was very excited about the upcoming exam because they studied hard for it.',
      underlined: 'they',
      options: [
        'NO CHANGE',
        'he or she',
        'the student',
        'one'
      ],
      correctAnswer: 1,
      explanation: 'Use gender-neutral pronouns or repeat the noun for clarity.',
      skill: 'pronoun-antecedent agreement'
    },
    {
      id: 'eng2',
      question: 'Which choice best maintains the tone of the passage?',
      passage: 'The research demonstrates conclusively that climate change has significant impacts.',
      options: [
        'proves beyond a doubt',
        'shows',
        'indicates',
        'demonstrates'
      ],
      correctAnswer: 3,
      explanation: 'The original maintains appropriate academic tone.',
      skill: 'tone and style'
    }
  ],
  math: [
    {
      id: 'math1',
      question: 'If 3x + 7 = 22, what is the value of x?',
      options: ['3', '5', '7', '9'],
      correctAnswer: 1,
      explanation: '3x + 7 = 22, so 3x = 15, therefore x = 5',
      skill: 'linear equations'
    },
    {
      id: 'math2',
      question: 'What is the area of a circle with radius 4?',
      options: ['8π', '12π', '16π', '32π'],
      correctAnswer: 2,
      explanation: 'Area = πr² = π(4)² = 16π',
      skill: 'circles and areas'
    }
  ],
  reading: [
    {
      id: 'read1',
      question: 'Based on the passage, the author would most likely agree that:',
      passage: 'Technology has revolutionized education, but it cannot replace the human connection between teacher and student.',
      options: [
        'Technology should be banned from classrooms',
        'Human relationships remain important in education',
        'Traditional teaching methods are outdated',
        'Students learn better without technology'
      ],
      correctAnswer: 1,
      explanation: 'The passage emphasizes the importance of human connection.',
      skill: 'author attitude'
    }
  ],
  science: [
    {
      id: 'sci1',
      question: 'According to the data in the table, which variable has the strongest correlation with temperature?',
      options: ['Humidity', 'Pressure', 'Wind speed', 'Altitude'],
      correctAnswer: 0,
      explanation: 'Look for the variable that changes most consistently with temperature.',
      skill: 'data analysis'
    }
  ]
};