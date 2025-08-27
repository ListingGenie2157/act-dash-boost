import { Day, Lesson, DrillSession } from '../types';

export const mathDrills: DrillSession[] = [
  {
    id: 'math-basics',
    subject: 'math',
    title: 'Math Basics Rapid Fire',
    // Increased time limit to allow for a deeper set of questions
    timeLimit: 90,
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
      ,
      // Additional drill questions to provide more depth and challenge
      {
        id: 'mb6',
        question: 'Solve for x: 3x - 7 = 2',
        options: ['1', '3', '2', '5'],
        correctAnswer: 2,
        explanation: '3x - 7 = 2 → 3x = 9 → x = 3',
        difficulty: 'medium'
      },
      {
        id: 'mb7',
        question: 'What is log₁₀(1000)?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 1,
        explanation: 'log base 10 of 1000 equals 3 because 10³ = 1000',
        difficulty: 'medium'
      },
      {
        id: 'mb8',
        question: 'Simplify (x² - y²) / (x - y)',
        options: ['x + y', 'x - y', 'x² + y', 'xy'],
        correctAnswer: 0,
        explanation: 'x² - y² factors to (x - y)(x + y); dividing by (x - y) leaves x + y',
        difficulty: 'medium'
      },
      {
        id: 'mb9',
        question: 'Solve the inequality: 2x + 5 ≤ 11',
        options: ['x ≤ 3', 'x ≥ 3', 'x ≤ -3', 'x ≥ -3'],
        correctAnswer: 0,
        explanation: '2x + 5 ≤ 11 → 2x ≤ 6 → x ≤ 3',
        difficulty: 'medium'
      }
    ]
  }
];

export const englishDrills: DrillSession[] = [
  {
    id: 'grammar-basics',
    subject: 'english',
    title: 'Grammar Rules Rapid Fire',
    // Extended the time limit to accommodate a richer set of questions
    timeLimit: 120,
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
      ,
      // Additional drill questions for deeper grammar practice
      {
        id: 'gb4',
        question: 'Identify the sentence with correct comma usage.',
        options: [
          'After the game we went out for pizza.',
          'After the game, we went out for pizza.',
          'After, the game we went out for pizza.',
          'After the game we went, out for pizza.'
        ],
        correctAnswer: 1,
        explanation: 'Introductory phrases should be followed by a comma.',
        difficulty: 'medium'
      },
      {
        id: 'gb5',
        question: 'Choose the correctly punctuated sentence.',
        options: [
          'She enjoys reading writing and skiing.',
          'She enjoys reading, writing and skiing.',
          'She enjoys reading, writing, and skiing.',
          'She enjoys, reading, writing, and skiing.'
        ],
        correctAnswer: 2,
        explanation: 'Use commas to separate all items in a series (Oxford comma optional but recommended).',
        difficulty: 'medium'
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
      concept: 'Percentages represent parts of 100 and are crucial for the ACT. They appear in word problems, data analysis, and coordinate geometry. Ratios express relationships between quantities and are foundational for proportions, similar figures, and probability. Master these concepts by understanding three key conversions: fraction ↔ decimal ↔ percentage, and by recognizing that ratios create proportional relationships.',
      examples: [
        'Percentage conversions: 25% = 25/100 = 1/4 = 0.25',
        'Finding percentages: To find 30% of 60, multiply 0.30 × 60 = 18',
        'Percentage increase: If a price goes from $20 to $25, the increase is (25-20)/20 × 100% = 25%',
        'Basic ratios: 2:3 means for every 2 of one item, there are 3 of another',
        'Ratio to fraction: 2:3 = 2/(2+3) = 2/5 of the total is the first quantity',
        'Proportion solving: If 2:3 = x:15, then 3x = 30, so x = 10',
        'Real ACT example: In a class of 24 students, if the ratio of boys to girls is 5:3, there are 5×3=15 boys and 3×3=9 girls'
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
      title: 'Subject-Verb Agreement Fundamentals',
      subject: 'english',
      concept: 'Subject-verb agreement is one of the most tested grammar concepts on the ACT. The basic rule is simple: singular subjects take singular verbs, plural subjects take plural verbs. However, the ACT tests tricky situations where the subject is separated from the verb, compound subjects, collective nouns, and indefinite pronouns. Mastering these patterns will significantly improve your English score.',
      examples: [
        'Basic agreement: The cat runs (singular) vs. The cats run (plural)',
        'Prepositional phrase interference: The books [on the shelf] are dusty (ignore "shelf")',
        'Collective nouns: The team is playing well (team = one unit, use singular)',
        'Compound subjects with "and": John and Mary are coming (always plural)',
        'Compound subjects with "or/nor": Either John or his sisters are coming (agree with closest)',
        'Indefinite pronouns: Everyone has finished (everyone = singular), Few have arrived (few = plural)',
        'Tricky plurals: The news is good (news looks plural but is singular)',
        'Inverted order: There are many reasons (subject "reasons" comes after verb)'
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
  },
  // Day 2
  {
    day: 2,
    completed: false,
    mathLesson: {
      id: 'math-day2',
      title: 'Fractions, Decimals, and Operations',
      subject: 'math',
      concept: 'Fraction operations and conversions are fundamental ACT skills that appear in algebra, geometry, and word problems. You must be fluent in converting between fractions, decimals, and percentages, and performing all four operations with fractions. The key strategies are: find common denominators for addition/subtraction, multiply straight across for multiplication, and remember that dividing by a fraction means multiplying by its reciprocal.',
      examples: [
        'Triple conversion: 3/4 = 0.75 = 75% (memorize common fractions)',
        'Addition with different denominators: 2/3 + 1/6 = 4/6 + 1/6 = 5/6',
        'Subtraction: 5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2',
        'Multiplication: 3/4 × 2/5 = 6/20 = 3/10 (multiply numerators and denominators)',
        'Division (key concept): 2/3 ÷ 1/4 = 2/3 × 4/1 = 8/3',
        'Mixed numbers: 1 2/3 = 5/3 (multiply whole by denominator, add numerator)',
        'Decimal to fraction: 0.375 = 375/1000 = 3/8 (simplify by dividing by GCD)',
        'Word problem application: If 3/4 of students passed and there are 20 students, then 3/4 × 20 = 15 students passed'
      ],
      practiceQuestions: [
        {
          id: 'p2m1',
          question: 'What is 5/8 as a decimal?',
          options: ['0.525', '0.625', '0.725', '0.825'],
          correctAnswer: 1,
          explanation: '5 ÷ 8 = 0.625',
          difficulty: 'easy'
        },
        {
          id: 'p2m2',
          question: 'Calculate: 2/3 + 1/4',
          options: ['3/7', '8/12', '11/12', '3/12'],
          correctAnswer: 2,
          explanation: '2/3 + 1/4 = 8/12 + 3/12 = 11/12',
          difficulty: 'medium'
        },
        {
          id: 'p2m3',
          question: 'What is 0.375 as a fraction in lowest terms?',
          options: ['3/8', '375/1000', '15/40', '6/16'],
          correctAnswer: 0,
          explanation: '0.375 = 375/1000 = 3/8 when simplified',
          difficulty: 'medium'
        },
        {
          id: 'p2m4',
          question: 'Calculate: 3/4 × 2/5',
          options: ['5/9', '6/20', '3/10', '6/9'],
          correctAnswer: 2,
          explanation: '3/4 × 2/5 = 6/20 = 3/10',
          difficulty: 'easy'
        },
        {
          id: 'p2m5',
          question: 'What is 1 2/3 as an improper fraction?',
          options: ['5/3', '6/3', '7/3', '8/3'],
          correctAnswer: 0,
          explanation: '1 2/3 = (3×1 + 2)/3 = 5/3',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q2m1',
          question: 'Convert 7/16 to a decimal.',
          options: ['0.4375', '0.5625', '0.6875', '0.7125'],
          correctAnswer: 0,
          explanation: '7 ÷ 16 = 0.4375',
          difficulty: 'easy'
        },
        {
          id: 'q2m2',
          question: 'Calculate: 5/6 - 1/3',
          options: ['4/3', '1/2', '2/3', '1/3'],
          correctAnswer: 1,
          explanation: '5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2',
          difficulty: 'medium'
        },
        {
          id: 'q2m3',
          question: 'What is 2.75 as a mixed number?',
          options: ['2 3/4', '2 1/4', '2 2/3', '2 1/2'],
          correctAnswer: 0,
          explanation: '2.75 = 2 + 0.75 = 2 + 3/4 = 2 3/4',
          difficulty: 'easy'
        },
        {
          id: 'q2m4',
          question: 'Calculate: 1 1/2 ÷ 3/4',
          options: ['1', '2', '3', '4'],
          correctAnswer: 1,
          explanation: '1 1/2 ÷ 3/4 = 3/2 × 4/3 = 12/6 = 2',
          difficulty: 'medium'
        },
        {
          id: 'q2m5',
          question: 'Which is largest: 3/4, 0.8, or 85%?',
          options: ['3/4', '0.8', '85%', 'They are equal'],
          correctAnswer: 2,
          explanation: '3/4 = 0.75 = 75%, 0.8 = 80%, 85% = 0.85. So 85% is largest.',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day2',
      title: 'Comma Rules and Advanced Usage',
      subject: 'english',
      concept: 'Comma usage is heavily tested on the ACT English section. Students must master six key comma rules: items in a series (Oxford comma), before coordinating conjunctions joining independent clauses, after introductory words/phrases/clauses, around non-essential information, between coordinate adjectives, and in addresses/dates. The ACT will often present sentences where commas are missing, unnecessary, or incorrectly placed.',
      examples: [
        'Series (Oxford comma): I bought apples, oranges, and bananas',
        'Coordinating conjunction: I wanted to go, but it was raining (two complete thoughts)',
        'Introductory elements: After the game, we went home (phrase); Surprisingly, he passed (word)',
        'Non-essential clauses: My brother, who lives in Texas, is visiting (extra info)',
        'Essential vs. non-essential: Students who study hard succeed (no commas - essential)',
        'Coordinate adjectives: It was a long, difficult test (both describe "test" equally)',
        'Addresses: I live in Austin, Texas, and love it here',
        'Common mistake: No comma needed when "and" joins phrases without separate subjects'
      ],
      practiceQuestions: [
        {
          id: 'p2e1',
          question: 'Which sentence uses commas correctly?',
          options: [
            'I need to buy bread, milk and, eggs.',
            'I need to buy bread, milk, and eggs.',
            'I need to buy bread milk, and eggs.',
            'I need to buy, bread, milk, and eggs.'
          ],
          correctAnswer: 1,
          explanation: 'Use commas to separate items in a series, including the Oxford comma',
          difficulty: 'easy'
        },
        {
          id: 'p2e2',
          question: 'Where should commas be placed? "The teacher who was very patient helped me understand."',
          options: [
            'No commas needed',
            'The teacher, who was very patient, helped me understand.',
            'The teacher who was very patient, helped me understand.',
            'The teacher, who was very patient helped me understand.'
          ],
          correctAnswer: 0,
          explanation: 'The clause "who was very patient" is essential to identify which teacher, so no commas.',
          difficulty: 'medium'
        },
        {
          id: 'p2e3',
          question: 'Which sentence is punctuated correctly?',
          options: [
            'Before leaving the house I checked my keys.',
            'Before leaving the house, I checked my keys.',
            'Before leaving, the house I checked my keys.',
            'Before leaving the house I, checked my keys.'
          ],
          correctAnswer: 1,
          explanation: 'Use a comma after an introductory phrase',
          difficulty: 'easy'
        },
        {
          id: 'p2e4',
          question: 'Choose the correct sentence:',
          options: [
            'The book that I borrowed, is overdue.',
            'The book, that I borrowed is overdue.',
            'The book that I borrowed is overdue.',
            'The book, that I borrowed, is overdue.'
          ],
          correctAnswer: 2,
          explanation: '"That I borrowed" is essential information, so no commas are needed',
          difficulty: 'medium'
        },
        {
          id: 'p2e5',
          question: 'Which uses commas correctly with a coordinating conjunction?',
          options: [
            'I wanted to go but, it was raining.',
            'I wanted to go, but it was raining.',
            'I wanted to go but it was, raining.',
            'I wanted, to go but it was raining.'
          ],
          correctAnswer: 1,
          explanation: 'Use a comma before coordinating conjunctions joining independent clauses',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q2e1',
          question: 'Which sentence needs commas?',
          options: [
            'My sister who lives in California is a doctor.',
            'The car that I drive is red.',
            'Students who study hard succeed.',
            'All of the above need commas.'
          ],
          correctAnswer: 0,
          explanation: 'Only the first sentence needs commas because "who lives in California" is non-essential information',
          difficulty: 'medium'
        },
        {
          id: 'q2e2',
          question: 'Where do commas go? "After we finished dinner we watched a movie."',
          options: [
            'After we finished, dinner we watched a movie.',
            'After we finished dinner, we watched a movie.',
            'After, we finished dinner we watched a movie.',
            'No commas needed.'
          ],
          correctAnswer: 1,
          explanation: 'Use a comma after the introductory clause "After we finished dinner"',
          difficulty: 'easy'
        },
        {
          id: 'q2e3',
          question: 'Which sentence is correct?',
          options: [
            'Yes I will attend the meeting.',
            'Yes, I will attend the meeting.',
            'Yes I will, attend the meeting.',
            'Yes I, will attend the meeting.'
          ],
          correctAnswer: 1,
          explanation: 'Use a comma after "yes" when it begins a sentence',
          difficulty: 'easy'
        },
        {
          id: 'q2e4',
          question: 'Choose the correctly punctuated sentence:',
          options: [
            'The company which was founded in 1995 is successful.',
            'The company, which was founded in 1995, is successful.',
            'The company which was founded in 1995, is successful.',
            'The company, which was founded in 1995 is successful.'
          ],
          correctAnswer: 1,
          explanation: '"Which was founded in 1995" is non-essential, so it needs commas around it',
          difficulty: 'medium'
        },
        {
          id: 'q2e5',
          question: 'Which uses commas correctly in a list?',
          options: [
            'I visited Paris France, London England, and Rome Italy.',
            'I visited Paris, France, London, England, and Rome, Italy.',
            'I visited Paris, France; London, England; and Rome, Italy.',
            'Both B and C are correct.'
          ],
          correctAnswer: 3,
          explanation: 'Both options B and C are correct ways to punctuate lists with internal commas',
          difficulty: 'hard'
        }
      ]
    }
  },
  // Day 3
  {
    day: 3,
    completed: false,
    mathLesson: {
      id: 'math-day3',
      title: 'Advanced Ratios and Proportions',
      subject: 'math',
      concept: 'Solving complex ratio problems and understanding proportional relationships',
      examples: [
        'If a:b = 3:4 and b:c = 2:5, then a:b:c = 6:8:20',
        'Cross multiplication: 3/x = 5/15, so 3×15 = 5×x, x = 9',
        'Scale problems: 1 inch = 50 miles, so 3.5 inches = 175 miles'
      ],
      practiceQuestions: [
        {
          id: 'p3m1',
          question: 'If 3 pizzas cost $27, how much do 5 pizzas cost?',
          options: ['$40', '$45', '$50', '$55'],
          correctAnswer: 1,
          explanation: 'Set up proportion: 3/27 = 5/x. Cross multiply: 3x = 135, x = 45',
          difficulty: 'easy'
        },
        {
          id: 'p3m2',
          question: 'A recipe calls for 2 cups flour to 3 cups sugar. How much flour for 9 cups sugar?',
          options: ['4 cups', '5 cups', '6 cups', '7 cups'],
          correctAnswer: 2,
          explanation: '2/3 = x/9. Cross multiply: 3x = 18, x = 6',
          difficulty: 'medium'
        },
        {
          id: 'p3m3',
          question: 'If a:b = 4:5 and a:c = 2:3, what is b:c?',
          options: ['8:15', '10:12', '8:12', '10:15'],
          correctAnswer: 1,
          explanation: 'Make a consistent: a:b:c = 4:5:6, so b:c = 5:6 = 10:12',
          difficulty: 'hard'
        },
        {
          id: 'p3m4',
          question: 'A car travels 120 miles in 2 hours. At this rate, how far in 5 hours?',
          options: ['250 miles', '280 miles', '300 miles', '320 miles'],
          correctAnswer: 2,
          explanation: 'Rate = 120/2 = 60 mph. Distance = 60 × 5 = 300 miles',
          difficulty: 'easy'
        },
        {
          id: 'p3m5',
          question: 'The ratio of boys to girls is 3:5. If there are 15 boys, how many total students?',
          options: ['24', '25', '40', '48'],
          correctAnswer: 3,
          explanation: 'If 3 parts = 15 boys, then 1 part = 5. Total = 8 parts = 40 students',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q3m1',
          question: 'If 4 workers can complete a job in 6 days, how many days for 3 workers?',
          options: ['4.5 days', '7 days', '8 days', '9 days'],
          correctAnswer: 2,
          explanation: 'Total work = 4×6 = 24 worker-days. For 3 workers: 24÷3 = 8 days',
          difficulty: 'medium'
        },
        {
          id: 'q3m2',
          question: 'On a map, 2 cm represents 5 km. What distance does 7 cm represent?',
          options: ['14 km', '17.5 km', '20 km', '25 km'],
          correctAnswer: 1,
          explanation: '2/5 = 7/x. Cross multiply: 2x = 35, x = 17.5',
          difficulty: 'easy'
        },
        {
          id: 'q3m3',
          question: 'If x:y = 2:7 and y:z = 3:4, what is x:z?',
          options: ['6:28', '2:4', '6:7', '3:14'],
          correctAnswer: 0,
          explanation: 'Make y consistent: x:y:z = 6:21:28, so x:z = 6:28',
          difficulty: 'hard'
        },
        {
          id: 'q3m4',
          question: 'A machine produces 150 items in 5 hours. How many items in 8 hours?',
          options: ['200', '240', '280', '300'],
          correctAnswer: 1,
          explanation: 'Rate = 150/5 = 30 items/hour. In 8 hours: 30×8 = 240 items',
          difficulty: 'easy'
        },
        {
          id: 'q3m5',
          question: 'The ratio of cats to dogs to birds is 2:3:5. If there are 30 birds, how many cats?',
          options: ['6', '10', '12', '18'],
          correctAnswer: 2,
          explanation: 'If 5 parts = 30 birds, then 1 part = 6. Cats = 2 parts = 12',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day3',
      title: 'Advanced Punctuation: Semicolons, Colons, and Apostrophes',
      subject: 'english',
      concept: 'Advanced punctuation rules distinguish strong ACT English students. Semicolons connect independent clauses and separate complex list items. Colons introduce lists, explanations, or examples after complete sentences. Apostrophes show possession (never for plurals) and form contractions. These punctuation marks are frequently tested, and incorrect usage will lower your score.',
      examples: [
        'Semicolon connecting clauses: I love reading; it relaxes me after long days',
        'Semicolon with transitional words: I studied hard; however, the test was still difficult',
        'Semicolon in complex lists: I visited Paris, France; London, England; and Rome, Italy',
        'Colon introducing lists: Buy these items: milk, bread, eggs, and cheese',
        'Colon for explanations: She had one clear goal: to graduate with honors',
        'Singular possessive: The dog\'s toy, James\'s book (add \'s even after s)',
        'Plural possessive: The dogs\' toys, the students\' papers (apostrophe after s)',
        'Contractions: It\'s (it is), you\'re (you are), who\'s (who is) vs. whose (possessive)'
      ],
      practiceQuestions: [
        {
          id: 'p3e1',
          question: 'Which sentence uses a semicolon correctly?',
          options: [
            'I like apples; oranges, and bananas.',
            'I like apples; however, I prefer oranges.',
            'I like; apples and oranges.',
            'I like apples and; oranges.'
          ],
          correctAnswer: 1,
          explanation: 'Semicolons connect independent clauses, especially with transitional words',
          difficulty: 'medium'
        },
        {
          id: 'p3e2',
          question: 'Where should the colon be placed? "I need three things for the recipe flour sugar and eggs."',
          options: [
            'I need three things for the recipe: flour, sugar, and eggs.',
            'I need: three things for the recipe flour, sugar, and eggs.',
            'I need three things: for the recipe flour, sugar, and eggs.',
            'I need three things for the recipe flour: sugar, and eggs.'
          ],
          correctAnswer: 0,
          explanation: 'Use a colon before a list when preceded by a complete sentence',
          difficulty: 'easy'
        },
        {
          id: 'p3e3',
          question: 'Which shows correct apostrophe usage?',
          options: [
            'The cats toy was lost.',
            'The cat\'s toy was lost.',
            'The cats\' toy was lost.',
            'The cat\'s toys were lost.'
          ],
          correctAnswer: 1,
          explanation: 'For singular possessive, add \'s to the noun',
          difficulty: 'easy'
        },
        {
          id: 'p3e4',
          question: 'Choose the correct sentence:',
          options: [
            'Its a beautiful day outside.',
            'It\'s a beautiful day outside.',
            'Its\' a beautiful day outside.',
            'It\'s\' a beautiful day outside.'
          ],
          correctAnswer: 1,
          explanation: 'It\'s is the contraction for "it is"',
          difficulty: 'easy'
        },
        {
          id: 'p3e5',
          question: 'Which sentence uses punctuation correctly?',
          options: [
            'The students\' books were on the desk.',
            'The student\'s books were on the desk.',
            'The students books\' were on the desk.',
            'The students book\'s were on the desk.'
          ],
          correctAnswer: 0,
          explanation: 'For plural possessive, add an apostrophe after the s',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q3e1',
          question: 'Which sentence needs a semicolon?',
          options: [
            'I love to read books are my passion.',
            'I love to read, books are my passion.',
            'I love to read; books are my passion.',
            'I love to read books, they are my passion.'
          ],
          correctAnswer: 2,
          explanation: 'Use a semicolon to connect two related independent clauses',
          difficulty: 'medium'
        },
        {
          id: 'q3e2',
          question: 'Where does the colon belong? "She had one dream to become a teacher."',
          options: [
            'She had: one dream to become a teacher.',
            'She had one dream: to become a teacher.',
            'She had one dream to become: a teacher.',
            'She had one dream to: become a teacher.'
          ],
          correctAnswer: 1,
          explanation: 'Use a colon to introduce an explanation or elaboration',
          difficulty: 'easy'
        },
        {
          id: 'q3e3',
          question: 'Which is correct for multiple students owning one book?',
          options: [
            'The student\'s book',
            'The students book',
            'The students\' book',
            'The students book\''
          ],
          correctAnswer: 2,
          explanation: 'For plural possessive, add apostrophe after the s',
          difficulty: 'medium'
        },
        {
          id: 'q3e4',
          question: 'Choose the correct contraction:',
          options: [
            'Whos going to the party?',
            'Who\'s going to the party?',
            'Whose going to the party?',
            'Whos\' going to the party?'
          ],
          correctAnswer: 1,
          explanation: 'Who\'s is the contraction for "who is"',
          difficulty: 'easy'
        },
        {
          id: 'q3e5',
          question: 'Which sentence uses a semicolon correctly?',
          options: [
            'I studied hard; therefore I passed the test.',
            'I studied hard; therefore, I passed the test.',
            'I studied hard, therefore; I passed the test.',
            'I studied hard therefore; I passed the test.'
          ],
          correctAnswer: 1,
          explanation: 'Use semicolon before and comma after transitional words between clauses',
          difficulty: 'hard'
        }
      ]
    }
  }
  // Additional days 4-11 would follow the same pattern...
];