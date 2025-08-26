import { Day, Lesson, DrillSession } from '../types';

export const mathDrills: DrillSession[] = [
  {
    id: 'math-basics',
    subject: 'math',
    title: 'Math Basics Rapid Fire',
    timeLimit: 60,
    questions: [
      {
        id: 'mb1',
        question: 'What is 25% of 80?',
        options: ['15', '20', '25', '30'],
        correctAnswer: 1,
        explanation: '25% = 1/4, so 80 ÷ 4 = 20',
        difficulty: 'easy'
      },
      {
        id: 'mb2',
        question: 'If the ratio of cats to dogs is 3:4 and there are 12 cats, how many dogs are there?',
        options: ['9', '16', '18', '20'],
        correctAnswer: 1,
        explanation: '3:4 ratio means 3x cats to 4x dogs. If 3x = 12, then x = 4, so 4x = 16 dogs',
        difficulty: 'easy'
      },
      {
        id: 'mb3',
        question: 'Solve for x: 2x + 5 = 13',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        explanation: '2x + 5 = 13, so 2x = 8, therefore x = 4',
        difficulty: 'easy'
      },
      {
        id: 'mb4',
        question: 'What is 3/5 as a percentage?',
        options: ['35%', '50%', '60%', '65%'],
        correctAnswer: 2,
        explanation: '3/5 = 0.6 = 60%',
        difficulty: 'easy'
      },
      {
        id: 'mb5',
        question: 'If x = 3, what is 2x²?',
        options: ['6', '9', '12', '18'],
        correctAnswer: 3,
        explanation: '2x² = 2(3)² = 2(9) = 18',
        difficulty: 'easy'
      }
    ]
  }
];

export const englishDrills: DrillSession[] = [
  {
    id: 'grammar-basics',
    subject: 'english',
    title: 'Grammar Rules Rapid Fire',
    timeLimit: 90,
    questions: [
      {
        id: 'gb1',
        question: 'Which sentence has correct subject-verb agreement?',
        options: [
          'The group of students are studying.',
          'The group of students is studying.',
          'The group of students were studying.',
          'The group of students have studying.'
        ],
        correctAnswer: 1,
        explanation: '"Group" is singular, so it takes the singular verb "is"',
        difficulty: 'easy'
      },
      {
        id: 'gb2',
        question: 'Which sentence uses commas correctly?',
        options: [
          'I went to the store, and bought milk.',
          'I went to the store and, bought milk.',
          'I went to the store, and, bought milk.',
          'I went to the store and bought milk.'
        ],
        correctAnswer: 3,
        explanation: 'No comma needed before "and" when joining two phrases without separate subjects',
        difficulty: 'easy'
      },
      {
        id: 'gb3',
        question: 'Which sentence is punctuated correctly?',
        options: [
          'Its a beautiful day outside.',
          "It's a beautiful day outside.",
          'Its\' a beautiful day outside.',
          'It\'s a beautiful day outside.'
        ],
        correctAnswer: 1,
        explanation: '"It\'s" is the contraction for "it is"',
        difficulty: 'easy'
      }
    ]
  }
];

export const curriculum: Day[] = [
  // Day 1
  {
    day: 1,
    completed: false,
    mathLesson: {
      id: 'math-day1',
      title: 'Percentages and Basic Ratios',
      subject: 'math',
      concept: 'Understanding percentages as parts of 100 and basic ratio relationships',
      examples: [
        '25% = 25/100 = 1/4 = 0.25',
        'To find 30% of 60: 0.30 × 60 = 18',
        'Ratio 2:3 means for every 2 of one thing, there are 3 of another'
      ],
      practiceQuestions: [
        {
          id: 'p1m1',
          question: 'What is 15% of 200?',
          options: ['25', '30', '35', '40'],
          correctAnswer: 1,
          explanation: '15% = 0.15, so 0.15 × 200 = 30',
          difficulty: 'easy'
        },
        {
          id: 'p1m2',
          question: 'If 60% of a number is 36, what is the number?',
          options: ['54', '60', '66', '72'],
          correctAnswer: 1,
          explanation: 'If 60% of x = 36, then 0.6x = 36, so x = 36 ÷ 0.6 = 60',
          difficulty: 'medium'
        },
        {
          id: 'p1m3',
          question: 'In a class of 24 students, the ratio of boys to girls is 5:3. How many boys are there?',
          options: ['9', '12', '15', '18'],
          correctAnswer: 2,
          explanation: 'Ratio 5:3 means 5+3=8 parts total. Boys = (5/8) × 24 = 15',
          difficulty: 'medium'
        },
        {
          id: 'p1m4',
          question: 'Express 3/8 as a percentage.',
          options: ['32.5%', '35%', '37.5%', '40%'],
          correctAnswer: 2,
          explanation: '3/8 = 0.375 = 37.5%',
          difficulty: 'easy'
        },
        {
          id: 'p1m5',
          question: 'If the ratio of apples to oranges is 4:7 and there are 28 oranges, how many apples are there?',
          options: ['12', '16', '20', '24'],
          correctAnswer: 1,
          explanation: 'If 7 parts = 28 oranges, then 1 part = 4. So 4 parts = 16 apples',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q1m1',
          question: 'What percentage is 18 out of 120?',
          options: ['12%', '15%', '18%', '20%'],
          correctAnswer: 1,
          explanation: '18/120 = 0.15 = 15%',
          difficulty: 'easy'
        },
        {
          id: 'q1m2',
          question: 'A shirt costs $80. If there\'s a 25% discount, what\'s the sale price?',
          options: ['$55', '$60', '$65', '$70'],
          correctAnswer: 1,
          explanation: 'Discount = 25% of $80 = $20. Sale price = $80 - $20 = $60',
          difficulty: 'medium'
        },
        {
          id: 'q1m3',
          question: 'If a:b = 2:5 and b:c = 3:4, what is a:c?',
          options: ['6:20', '2:4', '3:10', '6:10'],
          correctAnswer: 0,
          explanation: 'a:b = 2:5, b:c = 3:4. To find a:c, make b the same: a:b:c = 6:15:20, so a:c = 6:20',
          difficulty: 'hard'
        },
        {
          id: 'q1m4',
          question: 'If 40% of students like math and 25% like both math and science, what percentage like only math?',
          options: ['15%', '20%', '25%', '30%'],
          correctAnswer: 0,
          explanation: 'Only math = Total math - Both = 40% - 25% = 15%',
          difficulty: 'medium'
        },
        {
          id: 'q1m5',
          question: 'Convert 0.125 to a percentage.',
          options: ['1.25%', '12.5%', '125%', '1250%'],
          correctAnswer: 1,
          explanation: '0.125 = 12.5%',
          difficulty: 'easy'
        }
      ]
    },
    englishLesson: {
      id: 'english-day1',
      title: 'Subject-Verb Agreement Basics',
      subject: 'english',
      concept: 'Ensuring subjects and verbs match in number (singular/plural)',
      examples: [
        'Singular: The cat runs quickly.',
        'Plural: The cats run quickly.',
        'Collective noun: The team is playing well. (team = one unit)',
        'Compound subject: John and Mary are coming.'
      ],
      practiceQuestions: [
        {
          id: 'p1e1',
          question: 'Which sentence is correct?',
          options: [
            'The books on the shelf is dusty.',
            'The books on the shelf are dusty.',
            'The books on the shelf was dusty.',
            'The books on the shelf were dusty.'
          ],
          correctAnswer: 1,
          explanation: '"Books" is plural, so use "are"',
          difficulty: 'easy'
        },
        {
          id: 'p1e2',
          question: 'Choose the correct verb: "Neither the teacher nor the students _____ ready."',
          options: ['is', 'are', 'was', 'were'],
          correctAnswer: 1,
          explanation: 'With "neither...nor," the verb agrees with the closer subject ("students" = plural)',
          difficulty: 'medium'
        },
        {
          id: 'p1e3',
          question: 'Which is correct?',
          options: [
            'Everyone have finished their homework.',
            'Everyone has finished their homework.',
            'Everyone have finished his homework.',
            'Everyone has finished his homework.'
          ],
          correctAnswer: 1,
          explanation: '"Everyone" is singular, so use "has." Modern usage accepts "their" for inclusive language.',
          difficulty: 'medium'
        },
        {
          id: 'p1e4',
          question: 'Select the correct sentence:',
          options: [
            'The data shows interesting trends.',
            'The data show interesting trends.',
            'The data is showing interesting trends.',
            'Both A and B are correct.'
          ],
          correctAnswer: 3,
          explanation: '"Data" can be treated as singular or plural in modern usage',
          difficulty: 'hard'
        },
        {
          id: 'p1e5',
          question: 'Which sentence has correct subject-verb agreement?',
          options: [
            'There is many reasons to study.',
            'There are many reasons to study.',
            'There was many reasons to study.',
            'There were many reason to study.'
          ],
          correctAnswer: 1,
          explanation: 'With "there are/is," the verb agrees with what follows: "reasons" is plural',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q1e1',
          question: 'The committee _____ meeting at 3 PM.',
          options: ['is', 'are', 'were', 'have'],
          correctAnswer: 0,
          explanation: '"Committee" is a collective noun treated as singular',
          difficulty: 'easy'
        },
        {
          id: 'q1e2',
          question: 'Which is correct?',
          options: [
            'Each of the students have a textbook.',
            'Each of the students has a textbook.',
            'Each of the students are having a textbook.',
            'Each of the students were having a textbook.'
          ],
          correctAnswer: 1,
          explanation: '"Each" is always singular, regardless of the prepositional phrase',
          difficulty: 'medium'
        },
        {
          id: 'q1e3',
          question: 'Either Sarah or her brothers _____ responsible.',
          options: ['is', 'are', 'was', 'been'],
          correctAnswer: 1,
          explanation: 'With "either...or," the verb agrees with the closer subject ("brothers" = plural)',
          difficulty: 'medium'
        },
        {
          id: 'q1e4',
          question: 'The news _____ surprising.',
          options: ['is', 'are', 'were', 'have been'],
          correctAnswer: 0,
          explanation: '"News" is always singular despite ending in -s',
          difficulty: 'easy'
        },
        {
          id: 'q1e5',
          question: 'A number of students _____ absent today.',
          options: ['is', 'are', 'was', 'has'],
          correctAnswer: 1,
          explanation: '"A number of" takes a plural verb',
          difficulty: 'medium'
        }
      ]
    }
  }
  // Additional days would follow the same pattern...
];