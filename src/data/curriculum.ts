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
  // Day 1 - Combined Math & English Fundamentals
  {
    day: 1,
    completed: false,
    mathLesson: {
      id: 'math-day1',
      title: 'Percentages, Ratios, and Fractions',
      subject: 'math',
      concept: 'Percentages, ratios, and fractions are fundamental to ACT math success. Percentages represent parts of 100, ratios express relationships between quantities, and fractions show parts of a whole. These concepts appear in word problems, data analysis, coordinate geometry, and probability. Master conversions between fractions, decimals, and percentages, and understand how ratios create proportional relationships.',
      examples: [
        'Percentage conversions: 25% = 25/100 = 1/4 = 0.25',
        'Finding percentages: To find 30% of 60, multiply 0.30 × 60 = 18',
        'Percentage increase: If a price goes from $20 to $25, the increase is (25-20)/20 × 100% = 25%',
        'Basic ratios: 2:3 means for every 2 of one item, there are 3 of another',
        'Ratio to fraction: 2:3 = 2/(2+3) = 2/5 of the total is the first quantity',
        'Fraction operations: 3/4 + 1/6 = 9/12 + 2/12 = 11/12',
        'Decimal to fraction: 0.75 = 75/100 = 3/4 (simplified)',
        'Mixed numbers: 2 3/4 = (2×4+3)/4 = 11/4'
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
          question: 'Express 5/8 as a decimal.',
          options: ['0.625', '0.650', '0.675', '0.700'],
          correctAnswer: 0,
          explanation: '5 ÷ 8 = 0.625',
          difficulty: 'easy'
        },
        {
          id: 'p1m4',
          question: 'In a class of 30 students, the ratio of boys to girls is 3:2. How many boys are there?',
          options: ['12', '15', '18', '20'],
          correctAnswer: 2,
          explanation: 'Ratio 3:2 means 3+2=5 parts total. Boys = (3/5) × 30 = 18',
          difficulty: 'medium'
        },
        {
          id: 'p1m5',
          question: 'What is 2/3 + 1/4?',
          options: ['3/7', '8/12', '11/12', '3/4'],
          correctAnswer: 2,
          explanation: '2/3 + 1/4 = 8/12 + 3/12 = 11/12',
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
          question: 'Convert 3.75 to a mixed number.',
          options: ['3 1/4', '3 3/4', '3 1/2', '3 2/3'],
          correctAnswer: 1,
          explanation: '3.75 = 3 + 0.75 = 3 + 3/4 = 3 3/4',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day1',
      title: 'Subject-Verb Agreement and Comma Usage',
      subject: 'english',
      concept: 'Subject-verb agreement is crucial for ACT English success. Singular subjects take singular verbs, plural subjects take plural verbs. Watch for tricky situations like compound subjects, indefinite pronouns, and subjects separated from verbs by phrases. Comma usage follows specific rules: separate items in lists, set off introductory elements, separate independent clauses, and set off non-essential information.',
      examples: [
        'Basic agreement: "The cat runs" (singular) vs "The cats run" (plural)',
        'Compound subjects: "Tom and Jerry are friends" (plural verb)',
        'Indefinite pronouns: "Everyone is here" (singular), "Both are correct" (plural)',
        'Separated subjects: "The box of cookies is empty" (box is singular)',
        'Comma in lists: "I bought apples, oranges, and bananas"',
        'After introductions: "After the game, we went home"',
        'Between clauses: "I studied hard, and I passed the test"',
        'Non-essential info: "My brother, who lives in Texas, is visiting"'
      ],
      practiceQuestions: [
        {
          id: 'p1e1',
          question: 'Choose the correct verb: "The group of students _____ working hard."',
          options: ['is', 'are', 'were', 'have'],
          correctAnswer: 0,
          explanation: '"Group" is singular, so use "is"',
          difficulty: 'easy'
        },
        {
          id: 'p1e2',
          question: 'Where should commas be placed? "After dinner we watched a movie played games and ate dessert."',
          options: [
            'After dinner, we watched a movie, played games, and ate dessert.',
            'After dinner we watched a movie, played games and ate dessert.',
            'After dinner, we watched a movie played games, and ate dessert.',
            'After dinner we watched a movie played games and ate dessert.'
          ],
          correctAnswer: 0,
          explanation: 'Comma after introductory phrase and between items in a series',
          difficulty: 'medium'
        },
        {
          id: 'p1e3',
          question: 'Which is correct?',
          options: [
            'Neither of the books are interesting.',
            'Neither of the books is interesting.',
            'Neither of the books were interesting.',
            'Neither of the books have been interesting.'
          ],
          correctAnswer: 1,
          explanation: '"Neither" is singular and takes a singular verb',
          difficulty: 'medium'
        },
        {
          id: 'p1e4',
          question: 'Choose the correctly punctuated sentence:',
          options: [
            'The teacher who was new struggled with the lesson.',
            'The teacher, who was new, struggled with the lesson.',
            'The teacher who was new, struggled with the lesson.',
            'The teacher, who was new struggled with the lesson.'
          ],
          correctAnswer: 1,
          explanation: 'Use commas around non-essential clauses',
          difficulty: 'medium'
        },
        {
          id: 'p1e5',
          question: 'Select the correct verb: "Each of the players _____ their own equipment."',
          options: ['bring', 'brings', 'brought', 'have brought'],
          correctAnswer: 1,
          explanation: '"Each" is singular, so use "brings"',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q1e1',
          question: 'Choose the correct sentence:',
          options: [
            'The team are playing well.',
            'The team is playing well.',
            'The team were playing well.',
            'The team have been playing well.'
          ],
          correctAnswer: 1,
          explanation: '"Team" is a collective noun treated as singular',
          difficulty: 'easy'
        },
        {
          id: 'q1e2',
          question: 'Which sentence is punctuated correctly?',
          options: [
            'I need to buy milk bread and eggs.',
            'I need to buy milk, bread and eggs.',
            'I need to buy milk, bread, and eggs.',
            'I need to buy, milk, bread, and eggs.'
          ],
          correctAnswer: 2,
          explanation: 'Use commas to separate items in a series, including the Oxford comma',
          difficulty: 'easy'
        },
        {
          id: 'q1e3',
          question: 'Select the correct verb: "Either Sarah or her brothers _____ going to the party."',
          options: ['is', 'are', 'was', 'were'],
          correctAnswer: 1,
          explanation: 'With "either...or," the verb agrees with the closer subject (brothers = plural)',
          difficulty: 'hard'
        }
      ]
    }
  },
  // Day 2 - Algebra and Writing Mechanics
  {
    day: 2,
    completed: false,
    mathLesson: {
      id: 'math-day2',
      title: 'Linear Equations and Inequalities',
      subject: 'math',
      concept: 'Linear equations form the foundation of algebra on the ACT. They represent straight lines and have the form y = mx + b or ax + by = c. Master solving one-step, multi-step, and systems of equations. Inequalities use <, >, ≤, ≥ symbols and follow similar solving rules, but remember to flip the inequality sign when multiplying or dividing by negative numbers.',
      examples: [
        'One-step: x + 5 = 12, so x = 7',
        'Multi-step: 3x - 7 = 14, so 3x = 21, therefore x = 7',
        'Distributive: 2(x + 3) = 10, so 2x + 6 = 10, then 2x = 4, so x = 2',
        'With fractions: x/3 + 2 = 5, so x/3 = 3, therefore x = 9',
        'Inequality: 2x + 3 > 7, so 2x > 4, therefore x > 2',
        'Negative coefficient: -3x < 12, so x > -4 (flip the sign)',
        'Systems: x + y = 5 and 2x - y = 1, substitute to get 3x = 6, so x = 2, y = 3'
      ],
      practiceQuestions: [
        {
          id: 'p2m1',
          question: 'Solve for x: 3x + 7 = 22',
          options: ['3', '5', '7', '9'],
          correctAnswer: 1,
          explanation: '3x + 7 = 22, so 3x = 15, therefore x = 5',
          difficulty: 'easy'
        },
        {
          id: 'p2m2',
          question: 'Solve for x: 2(x - 4) = 10',
          options: ['7', '8', '9', '10'],
          correctAnswer: 2,
          explanation: '2(x - 4) = 10, so 2x - 8 = 10, then 2x = 18, so x = 9',
          difficulty: 'medium'
        },
        {
          id: 'p2m3',
          question: 'Which values satisfy 3x - 5 ≥ 7?',
          options: ['x ≥ 3', 'x ≥ 4', 'x ≥ 5', 'x ≥ 6'],
          correctAnswer: 1,
          explanation: '3x - 5 ≥ 7, so 3x ≥ 12, therefore x ≥ 4',
          difficulty: 'medium'
        },
        {
          id: 'p2m4',
          question: 'Solve for y: 2y/3 = 8',
          options: ['10', '11', '12', '13'],
          correctAnswer: 2,
          explanation: '2y/3 = 8, so 2y = 24, therefore y = 12',
          difficulty: 'easy'
        },
        {
          id: 'p2m5',
          question: 'If 4x - 3y = 12 and x = 6, what is y?',
          options: ['2', '3', '4', '5'],
          correctAnswer: 2,
          explanation: '4(6) - 3y = 12, so 24 - 3y = 12, then -3y = -12, so y = 4',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q2m1',
          question: 'Solve for x: 5x - 3 = 2x + 9',
          options: ['2', '3', '4', '5'],
          correctAnswer: 2,
          explanation: '5x - 3 = 2x + 9, so 3x = 12, therefore x = 4',
          difficulty: 'medium'
        },
        {
          id: 'q2m2',
          question: 'What is the solution to -2x + 5 < 11?',
          options: ['x > -3', 'x < -3', 'x > 3', 'x < 3'],
          correctAnswer: 0,
          explanation: '-2x + 5 < 11, so -2x < 6, therefore x > -3 (flip the inequality)',
          difficulty: 'hard'
        },
        {
          id: 'q2m3',
          question: 'If 3x + 2y = 16 and x = 2, find y.',
          options: ['3', '4', '5', '6'],
          correctAnswer: 2,
          explanation: '3(2) + 2y = 16, so 6 + 2y = 16, then 2y = 10, so y = 5',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day2',
      title: 'Apostrophes and Sentence Structure',
      subject: 'english',
      concept: 'Apostrophes serve two main purposes: showing possession and forming contractions. For possession, add \'s to singular nouns and just \' to plural nouns ending in s. Contractions combine two words by replacing letters with an apostrophe. Sentence structure involves understanding complete sentences (subject + predicate), avoiding fragments and run-ons, and using proper coordination and subordination.',
      examples: [
        'Singular possession: "The cat\'s toy" (one cat owns the toy)',
        'Plural possession: "The cats\' toys" (multiple cats own toys)',
        'Irregular plural: "The children\'s books" (children doesn\'t end in s)',
        'Contractions: "don\'t" = "do not", "it\'s" = "it is", "who\'s" = "who is"',
        'Its vs. it\'s: "The dog wagged its tail" vs. "It\'s raining outside"',
        'Complete sentence: "The student studied hard." (subject + predicate)',
        'Fragment: "Because I was tired." (incomplete thought)',
        'Run-on: "I studied hard I passed the test." (needs punctuation or conjunction)'
      ],
      practiceQuestions: [
        {
          id: 'p2e1',
          question: 'Which is correct?',
          options: [
            'The students books are on the desk.',
            'The student\'s books are on the desk.',
            'The students\' books are on the desk.',
            'The students book\'s are on the desk.'
          ],
          correctAnswer: 2,
          explanation: 'Multiple students own books, so use students\' (plural possessive)',
          difficulty: 'medium'
        },
        {
          id: 'p2e2',
          question: 'Choose the correct contraction:',
          options: [
            'Theyre going to the store.',
            'They\'re going to the store.',
            'Their going to the store.',
            'There going to the store.'
          ],
          correctAnswer: 1,
          explanation: 'They\'re is the contraction for "they are"',
          difficulty: 'easy'
        },
        {
          id: 'p2e3',
          question: 'Which is a complete sentence?',
          options: [
            'Running through the park.',
            'The dog running through the park.',
            'The dog runs through the park.',
            'Through the park running.'
          ],
          correctAnswer: 2,
          explanation: 'A complete sentence needs a subject (dog) and predicate (runs)',
          difficulty: 'easy'
        },
        {
          id: 'p2e4',
          question: 'Fix this run-on sentence: "I love pizza it tastes great."',
          options: [
            'I love pizza, it tastes great.',
            'I love pizza; it tastes great.',
            'I love pizza because it tastes great.',
            'Both B and C are correct.'
          ],
          correctAnswer: 3,
          explanation: 'Both semicolon and subordinating conjunction fix the run-on',
          difficulty: 'medium'
        },
        {
          id: 'p2e5',
          question: 'Which uses apostrophes correctly?',
          options: [
            'The womens\' room is upstairs.',
            'The women\'s room is upstairs.',
            'The womens room is upstairs.',
            'The women\'s\' room is upstairs.'
          ],
          correctAnswer: 1,
          explanation: 'Women is already plural, so add \'s for possession',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q2e1',
          question: 'Which sentence is correct?',
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
          id: 'q2e2',
          question: 'Identify the sentence fragment:',
          options: [
            'The rain stopped.',
            'After the rain stopped.',
            'The rain stopped suddenly.',
            'When the rain stopped, we went outside.'
          ],
          correctAnswer: 1,
          explanation: '"After the rain stopped" is incomplete - it needs a main clause',
          difficulty: 'medium'
        },
        {
          id: 'q2e3',
          question: 'Which shows correct possession for multiple children?',
          options: [
            'The childrens\' toys',
            'The children\'s toys',
            'The childrens toys',
            'The children toys\''
          ],
          correctAnswer: 1,
          explanation: 'Children is irregular plural, so add \'s',
          difficulty: 'medium'
        }
      ]
    }
  },
  // Day 3 - Geometry and Advanced Grammar
  {
    day: 3,
    completed: false,
    mathLesson: {
      id: 'math-day3',
      title: 'Basic Geometry and Area',
      subject: 'math',
      concept: 'Geometry on the ACT covers area, perimeter, angles, and basic properties of shapes. Key formulas include: rectangle area = length × width, triangle area = ½ × base × height, circle area = πr², and circle circumference = 2πr. Understand angle relationships: complementary angles sum to 90°, supplementary angles sum to 180°, and vertical angles are equal.',
      examples: [
        'Rectangle: A = l × w, P = 2l + 2w',
        'Triangle: A = ½bh, where b is base and h is height',
        'Circle: A = πr², C = 2πr or πd',
        'Square: A = s², P = 4s',
        'Complementary angles: 30° and 60° sum to 90°',
        'Supplementary angles: 120° and 60° sum to 180°',
        'Vertical angles: When two lines cross, opposite angles are equal',
        'Pythagorean theorem: a² + b² = c² for right triangles'
      ],
      practiceQuestions: [
        {
          id: 'p3m1',
          question: 'What is the area of a rectangle with length 8 and width 5?',
          options: ['26', '40', '45', '50'],
          correctAnswer: 1,
          explanation: 'Area = length × width = 8 × 5 = 40',
          difficulty: 'easy'
        },
        {
          id: 'p3m2',
          question: 'A circle has radius 6. What is its area? (Use π ≈ 3.14)',
          options: ['113.04', '115.04', '117.04', '119.04'],
          correctAnswer: 0,
          explanation: 'A = πr² = 3.14 × 6² = 3.14 × 36 = 113.04',
          difficulty: 'medium'
        },
        {
          id: 'p3m3',
          question: 'If two angles are complementary and one is 35°, what is the other?',
          options: ['45°', '55°', '65°', '75°'],
          correctAnswer: 1,
          explanation: 'Complementary angles sum to 90°, so 90° - 35° = 55°',
          difficulty: 'easy'
        },
        {
          id: 'p3m4',
          question: 'What is the area of a triangle with base 10 and height 6?',
          options: ['30', '60', '16', '32'],
          correctAnswer: 0,
          explanation: 'A = ½bh = ½ × 10 × 6 = 30',
          difficulty: 'easy'
        },
        {
          id: 'p3m5',
          question: 'A square has perimeter 20. What is its area?',
          options: ['20', '25', '30', '35'],
          correctAnswer: 1,
          explanation: 'If P = 20, then each side = 5, so A = 5² = 25',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q3m1',
          question: 'What is the circumference of a circle with diameter 14? (Use π ≈ 3.14)',
          options: ['43.96', '44.96', '45.96', '46.96'],
          correctAnswer: 0,
          explanation: 'C = πd = 3.14 × 14 = 43.96',
          difficulty: 'easy'
        },
        {
          id: 'q3m2',
          question: 'If angles in a triangle are 45°, 60°, and x°, what is x?',
          options: ['65°', '70°', '75°', '80°'],
          correctAnswer: 2,
          explanation: 'Angles in a triangle sum to 180°, so x = 180° - 45° - 60° = 75°',
          difficulty: 'medium'
        },
        {
          id: 'q3m3',
          question: 'A right triangle has legs of length 3 and 4. What is the hypotenuse?',
          options: ['5', '6', '7', '8'],
          correctAnswer: 0,
          explanation: 'Using Pythagorean theorem: 3² + 4² = 9 + 16 = 25, so c = 5',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day3',
      title: 'Punctuation and Transition Words',
      subject: 'english',
      concept: 'Proper punctuation clarifies meaning and improves readability. Master semicolons (connect related independent clauses), colons (introduce lists, explanations, or quotes), and transition words (show relationships between ideas). Common transitions include: however, therefore, moreover, furthermore, consequently, and meanwhile. Each serves a specific purpose in connecting thoughts.',
      examples: [
        'Semicolon use: "I studied hard; therefore, I passed the exam."',
        'Colon for lists: "I need three things: milk, bread, and eggs."',
        'Colon for explanation: "She had one goal: to graduate with honors."',
        'Contrast transition: "The weather was cold; however, we went hiking."',
        'Addition transition: "She studied math; moreover, she practiced piano."',
        'Cause-effect: "It rained heavily; consequently, the game was canceled."',
        'Time transition: "First, mix the ingredients; then, bake for 30 minutes."',
        'Comparison: "John likes basketball; similarly, his brother enjoys soccer."'
      ],
      practiceQuestions: [
        {
          id: 'p3e1',
          question: 'Which sentence uses a semicolon correctly?',
          options: [
            'I went to the store; and bought milk.',
            'I went to the store; I bought milk.',
            'I went to the store; because I needed milk.',
            'I went to the store; for milk.'
          ],
          correctAnswer: 1,
          explanation: 'Semicolons connect two independent clauses',
          difficulty: 'medium'
        },
        {
          id: 'p3e2',
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
          id: 'p3e3',
          question: 'Choose the best transition: "John studied all night. _____, he felt confident about the test."',
          options: ['However', 'Therefore', 'Meanwhile', 'Nevertheless'],
          correctAnswer: 1,
          explanation: '"Therefore" shows cause and effect relationship',
          difficulty: 'medium'
        },
        {
          id: 'p3e4',
          question: 'Which sentence is punctuated correctly?',
          options: [
            'The meeting starts at 3:00 PM; please be on time.',
            'The meeting starts at 3:00 PM, please be on time.',
            'The meeting starts at 3:00 PM please be on time.',
            'The meeting starts at 3:00 PM: please be on time.'
          ],
          correctAnswer: 0,
          explanation: 'Use semicolon to connect related independent clauses',
          difficulty: 'medium'
        },
        {
          id: 'p3e5',
          question: 'Select the correct transition: "The weather was terrible. _____, we decided to stay home."',
          options: ['Furthermore', 'Consequently', 'Moreover', 'Similarly'],
          correctAnswer: 1,
          explanation: '"Consequently" shows result/effect',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q3e1',
          question: 'Which uses a colon correctly?',
          options: [
            'I have: three cats, two dogs, and one bird.',
            'I have three pets: cats, dogs, and birds.',
            'I have three: cats, dogs, and birds.',
            'I have three pets, cats: dogs, and birds.'
          ],
          correctAnswer: 1,
          explanation: 'Use colon after complete statement to introduce a list',
          difficulty: 'medium'
        },
        {
          id: 'q3e2',
          question: 'Choose the best transition: "Sarah loves reading novels. _____, her sister prefers poetry."',
          options: ['Therefore', 'However', 'Furthermore', 'Consequently'],
          correctAnswer: 1,
          explanation: '"However" shows contrast between the two preferences',
          difficulty: 'easy'
        },
        {
          id: 'q3e3',
          question: 'Which sentence uses semicolon correctly?',
          options: [
            'The concert was amazing; the band played all my favorite songs.',
            'The concert was amazing; because the band was great.',
            'The concert was amazing; and I loved every minute.',
            'The concert was amazing; so we stayed until the end.'
          ],
          correctAnswer: 0,
          explanation: 'Semicolons connect two independent, related clauses',
          difficulty: 'medium'
        }
      ]
    }
  },
  // Day 4 - Functions and Pronoun Usage
  {
    day: 4,
    completed: false,
    mathLesson: {
      id: 'math-day4',
      title: 'Functions and Coordinate Geometry',
      subject: 'math',
      concept: 'Functions represent relationships between input and output values. The notation f(x) means "function f of x." Key concepts include domain (input values), range (output values), and function evaluation. Coordinate geometry places points on a grid using (x,y) coordinates. Master plotting points, finding distances, midpoints, and understanding slope as rise over run.',
      examples: [
        'Function notation: f(x) = 2x + 3, so f(4) = 2(4) + 3 = 11',
        'Domain and range: For f(x) = x², domain is all real numbers, range is y ≥ 0',
        'Coordinate points: (3,4) means go 3 right, 4 up from origin',
        'Distance formula: d = √[(x₂-x₁)² + (y₂-y₁)²]',
        'Midpoint formula: M = ((x₁+x₂)/2, (y₁+y₂)/2)',
        'Slope: m = (y₂-y₁)/(x₂-x₁) = rise/run',
        'Slope types: positive (↗), negative (↘), zero (→), undefined (↕)',
        'Linear function: f(x) = mx + b, where m is slope and b is y-intercept'
      ],
      practiceQuestions: [
        {
          id: 'p4m1',
          question: 'If f(x) = 3x - 5, what is f(4)?',
          options: ['7', '8', '9', '10'],
          correctAnswer: 0,
          explanation: 'f(4) = 3(4) - 5 = 12 - 5 = 7',
          difficulty: 'easy'
        },
        {
          id: 'p4m2',
          question: 'What is the slope between points (2,3) and (6,7)?',
          options: ['1', '2', '3', '4'],
          correctAnswer: 0,
          explanation: 'Slope = (7-3)/(6-2) = 4/4 = 1',
          difficulty: 'medium'
        },
        {
          id: 'p4m3',
          question: 'What is the midpoint of (1,3) and (7,11)?',
          options: ['(4,7)', '(3,6)', '(4,8)', '(5,7)'],
          correctAnswer: 0,
          explanation: 'Midpoint = ((1+7)/2, (3+11)/2) = (4,7)',
          difficulty: 'medium'
        },
        {
          id: 'p4m4',
          question: 'If g(x) = x² + 2, what is g(3)?',
          options: ['10', '11', '12', '13'],
          correctAnswer: 1,
          explanation: 'g(3) = 3² + 2 = 9 + 2 = 11',
          difficulty: 'easy'
        },
        {
          id: 'p4m5',
          question: 'What is the distance between (0,0) and (3,4)?',
          options: ['5', '6', '7', '8'],
          correctAnswer: 0,
          explanation: 'Distance = √(3² + 4²) = √(9 + 16) = √25 = 5',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q4m1',
          question: 'If h(x) = 2x² - 3x + 1, what is h(2)?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 0,
          explanation: 'h(2) = 2(2)² - 3(2) + 1 = 8 - 6 + 1 = 3',
          difficulty: 'medium'
        },
        {
          id: 'q4m2',
          question: 'What is the slope of the line passing through (-1,2) and (3,-4)?',
          options: ['-3/2', '-2/3', '2/3', '3/2'],
          correctAnswer: 0,
          explanation: 'Slope = (-4-2)/(3-(-1)) = -6/4 = -3/2',
          difficulty: 'hard'
        },
        {
          id: 'q4m3',
          question: 'What is the y-intercept of f(x) = 4x - 7?',
          options: ['-7', '-4', '4', '7'],
          correctAnswer: 0,
          explanation: 'In f(x) = mx + b form, b is the y-intercept, so b = -7',
          difficulty: 'easy'
        }
      ]
    },
    englishLesson: {
      id: 'english-day4',
      title: 'Pronoun Agreement and Clarity',
      subject: 'english',
      concept: 'Pronouns must agree with their antecedents in number (singular/plural) and gender. Common errors include unclear pronoun references, using "they" for singular antecedents, and mismatching pronoun cases. Understand the difference between subject pronouns (I, you, he, she, it, we, they) and object pronouns (me, you, him, her, it, us, them). Possessive pronouns (my, your, his, her, its, our, their) show ownership.',
      examples: [
        'Number agreement: "Each student must bring his or her book" (not "their")',
        'Clear reference: "John told Mike that he was late" (unclear - who was late?)',
        'Better: "John told Mike, \'You are late\'" (clear reference)',
        'Subject pronoun: "She and I went to the store" (not "Her and me")',
        'Object pronoun: "The teacher gave the book to him and me" (not "he and I")',
        'Possessive: "The dog wagged its tail" (not "it\'s")',
        'Reflexive: "I made it myself" (not "I made it by my own")',
        'Who vs. whom: "Who is calling?" (subject) vs. "To whom are you speaking?" (object)'
      ],
      practiceQuestions: [
        {
          id: 'p4e1',
          question: 'Choose the correct pronoun: "Everyone should bring _____ own lunch."',
          options: ['their', 'his or her', 'they\'re', 'there'],
          correctAnswer: 1,
          explanation: '"Everyone" is singular, so use "his or her" not "their"',
          difficulty: 'medium'
        },
        {
          id: 'p4e2',
          question: 'Which is correct?',
          options: [
            'Between you and I, this is difficult.',
            'Between you and me, this is difficult.',
            'Between yourself and I, this is difficult.',
            'Between yourself and myself, this is difficult.'
          ],
          correctAnswer: 1,
          explanation: 'After prepositions, use object pronouns: "between you and me"',
          difficulty: 'medium'
        },
        {
          id: 'p4e3',
          question: 'Select the sentence with clear pronoun reference:',
          options: [
            'When Sarah saw Lisa, she was happy.',
            'Sarah was happy when she saw Lisa.',
            'She was happy when Sarah saw Lisa.',
            'When she saw her, she was happy.'
          ],
          correctAnswer: 1,
          explanation: 'This version clearly shows that Sarah was the one who was happy',
          difficulty: 'medium'
        },
        {
          id: 'p4e4',
          question: 'Choose the correct pronoun: "The team celebrated _____ victory."',
          options: ['their', 'its', 'it\'s', 'there'],
          correctAnswer: 1,
          explanation: '"Team" is a collective noun treated as singular, so use "its"',
          difficulty: 'hard'
        },
        {
          id: 'p4e5',
          question: 'Which uses "who" or "whom" correctly?',
          options: [
            'Who did you give the book to?',
            'Whom did you give the book to?',
            'Who did you give the book?',
            'Whom did you give the book?'
          ],
          correctAnswer: 1,
          explanation: '"Whom" is correct because it\'s the object of the preposition "to"',
          difficulty: 'hard'
        }
      ],
      quiz: [
        {
          id: 'q4e1',
          question: 'Choose the correct pronoun: "Neither of the boys brought _____ homework."',
          options: ['their', 'his', 'they\'re', 'there'],
          correctAnswer: 1,
          explanation: '"Neither" is singular, so use "his"',
          difficulty: 'medium'
        },
        {
          id: 'q4e2',
          question: 'Which sentence has correct pronoun usage?',
          options: [
            'My sister and me went shopping.',
            'My sister and I went shopping.',
            'Me and my sister went shopping.',
            'Myself and my sister went shopping.'
          ],
          correctAnswer: 1,
          explanation: 'Use subject pronoun "I" when it\'s part of the subject',
          difficulty: 'easy'
        },
        {
          id: 'q4e3',
          question: 'Select the sentence with clear pronoun reference:',
          options: [
            'Tom told his father he needed help.',
            'Tom told his father that Tom needed help.',
            'Tom told his father, "I need help."',
            'Both B and C are clear.'
          ],
          correctAnswer: 3,
          explanation: 'Both options clearly identify who needs help',
          difficulty: 'medium'
        }
      ]
    }
  },
  // Day 5 - Statistics and Logical Connections
  {
    day: 5,
    completed: false,
    mathLesson: {
      id: 'math-day5',
      title: 'Statistics and Data Analysis',
      subject: 'math',
      concept: 'Statistics help us understand and interpret data. Key measures include mean (average), median (middle value), mode (most frequent), and range (highest - lowest). Understand how to read charts, graphs, and tables. Learn to calculate probability as favorable outcomes divided by total outcomes. Percentiles show relative position in a dataset.',
      examples: [
        'Mean: (2+4+6+8)/4 = 20/4 = 5',
        'Median: For 2,4,6,8, median = (4+6)/2 = 5',
        'Mode: In 2,3,3,4,5, mode = 3 (appears most)',
        'Range: For 2,4,6,8, range = 8-2 = 6',
        'Probability: P(heads) = 1/2 = 0.5 = 50%',
        'Reading graphs: Bar charts show categories, line graphs show trends',
        'Percentiles: 75th percentile means 75% of data is below this value',
        'Outliers: Values significantly different from others (like 100 in: 1,2,3,100)'
      ],
      practiceQuestions: [
        {
          id: 'p5m1',
          question: 'What is the mean of 3, 7, 11, 15, 19?',
          options: ['10', '11', '12', '13'],
          correctAnswer: 1,
          explanation: 'Mean = (3+7+11+15+19)/5 = 55/5 = 11',
          difficulty: 'easy'
        },
        {
          id: 'p5m2',
          question: 'What is the median of 4, 8, 12, 16, 20?',
          options: ['10', '12', '14', '16'],
          correctAnswer: 1,
          explanation: 'For odd number of values, median is the middle value: 12',
          difficulty: 'easy'
        },
        {
          id: 'p5m3',
          question: 'If you roll a standard die, what\'s the probability of getting an even number?',
          options: ['1/6', '1/3', '1/2', '2/3'],
          correctAnswer: 2,
          explanation: 'Even numbers: 2,4,6. So P(even) = 3/6 = 1/2',
          difficulty: 'medium'
        },
        {
          id: 'p5m4',
          question: 'What is the range of 15, 23, 8, 42, 17?',
          options: ['27', '34', '35', '42'],
          correctAnswer: 1,
          explanation: 'Range = highest - lowest = 42 - 8 = 34',
          difficulty: 'easy'
        },
        {
          id: 'p5m5',
          question: 'In a class of 20 students, 8 prefer math. What percentage prefer math?',
          options: ['35%', '40%', '45%', '50%'],
          correctAnswer: 1,
          explanation: 'Percentage = (8/20) × 100% = 40%',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q5m1',
          question: 'What is the median of 2, 5, 8, 12, 15, 18?',
          options: ['8', '9', '10', '12'],
          correctAnswer: 2,
          explanation: 'For even number of values, median = (8+12)/2 = 10',
          difficulty: 'medium'
        },
        {
          id: 'q5m2',
          question: 'If a bag contains 3 red, 4 blue, and 5 green marbles, what\'s P(blue)?',
          options: ['1/4', '1/3', '1/2', '2/3'],
          correctAnswer: 1,
          explanation: 'P(blue) = 4/(3+4+5) = 4/12 = 1/3',
          difficulty: 'medium'
        },
        {
          id: 'q5m3',
          question: 'What is the mode of 5, 8, 3, 8, 2, 8, 7?',
          options: ['3', '5', '7', '8'],
          correctAnswer: 3,
          explanation: '8 appears three times, more than any other number',
          difficulty: 'easy'
        }
      ]
    },
    englishLesson: {
      id: 'english-day5',
      title: 'Logical Transitions and Sentence Flow',
      subject: 'english',
      concept: 'Effective writing uses logical connections between ideas. Transition words and phrases guide readers through your thoughts. Choose transitions that accurately reflect relationships: addition (also, furthermore), contrast (however, nevertheless), cause-effect (therefore, consequently), time (first, then, finally), and emphasis (indeed, in fact). Sentence variety improves flow by mixing simple, compound, and complex structures.',
      examples: [
        'Addition: "The weather was nice. Furthermore, we had time to spare."',
        'Contrast: "I studied hard. However, the test was still difficult."',
        'Cause-effect: "It rained heavily. Consequently, the game was postponed."',
        'Time sequence: "First, gather ingredients. Then, mix them carefully."',
        'Emphasis: "The project was challenging. Indeed, it took months to complete."',
        'Simple sentence: "The dog barked."',
        'Compound: "The dog barked, and the cat ran away."',
        'Complex: "When the dog barked, the cat ran away."'
      ],
      practiceQuestions: [
        {
          id: 'p5e1',
          question: 'Choose the best transition: "I forgot my umbrella. _____, I got soaked in the rain."',
          options: ['Furthermore', 'Consequently', 'Moreover', 'Similarly'],
          correctAnswer: 1,
          explanation: '"Consequently" shows the result of forgetting the umbrella',
          difficulty: 'easy'
        },
        {
          id: 'p5e2',
          question: 'Select the best transition: "The movie was entertaining. _____, the acting was superb."',
          options: ['However', 'Therefore', 'Additionally', 'Consequently'],
          correctAnswer: 2,
          explanation: '"Additionally" adds another positive point about the movie',
          difficulty: 'medium'
        },
        {
          id: 'p5e3',
          question: 'Which sentence type adds variety to this passage? "The sun was shining. The birds were singing. We decided to go for a walk."',
          options: [
            'Add another simple sentence',
            'Combine with coordination: "The sun was shining, and the birds were singing, so we decided to go for a walk."',
            'Use subordination: "Because the sun was shining and the birds were singing, we decided to go for a walk."',
            'Both B and C improve variety'
          ],
          correctAnswer: 3,
          explanation: 'Both coordination and subordination create sentence variety',
          difficulty: 'medium'
        },
        {
          id: 'p5e4',
          question: 'Choose the best transition: "The recipe looked easy. _____, it turned out to be quite complicated."',
          options: ['Therefore', 'However', 'Furthermore', 'Meanwhile'],
          correctAnswer: 1,
          explanation: '"However" shows contrast between expectation and reality',
          difficulty: 'easy'
        },
        {
          id: 'p5e5',
          question: 'Select the most logical transition: "We studied the map carefully. _____, we planned our route."',
          options: ['However', 'Then', 'Nevertheless', 'Otherwise'],
          correctAnswer: 1,
          explanation: '"Then" shows the logical sequence of actions',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q5e1',
          question: 'Choose the best transition: "The concert was expensive. _____, it was worth every penny."',
          options: ['Therefore', 'Nevertheless', 'Furthermore', 'Consequently'],
          correctAnswer: 1,
          explanation: '"Nevertheless" shows contrast - despite being expensive, it was worthwhile',
          difficulty: 'medium'
        },
        {
          id: 'q5e2',
          question: 'Which provides the best sentence variety?',
          options: [
            'I woke up. I brushed my teeth. I ate breakfast.',
            'I woke up, brushed my teeth, and ate breakfast.',
            'After I woke up, I brushed my teeth and ate breakfast.',
            'Both B and C improve variety.'
          ],
          correctAnswer: 3,
          explanation: 'Both options combine ideas and create more sophisticated sentences',
          difficulty: 'medium'
        },
        {
          id: 'q5e3',
          question: 'Select the best transition: "The team practiced for months. _____, they were confident about the championship."',
          options: ['However', 'Therefore', 'Meanwhile', 'Otherwise'],
          correctAnswer: 1,
          explanation: '"Therefore" shows the result of months of practice',
          difficulty: 'easy'
        }
      ]
    }
  },
  // Day 6 - Quadratics and Style/Tone
  {
    day: 6,
    completed: false,
    mathLesson: {
      id: 'math-day6',
      title: 'Quadratic Equations and Parabolas',
      subject: 'math',
      concept: 'Quadratic equations have the form ax² + bx + c = 0 and create parabola graphs. Key methods for solving include factoring, completing the square, and the quadratic formula. Parabolas open upward (a > 0) or downward (a < 0). The vertex is the highest or lowest point, and the axis of symmetry passes through the vertex. Understanding these concepts helps with optimization problems.',
      examples: [
        'Standard form: y = ax² + bx + c',
        'Factoring: x² - 5x + 6 = (x-2)(x-3) = 0, so x = 2 or x = 3',
        'Quadratic formula: x = (-b ± √(b²-4ac))/2a',
        'Vertex form: y = a(x-h)² + k, where vertex is (h,k)',
        'Vertex formula: x = -b/2a finds x-coordinate of vertex',
        'Discriminant: b²-4ac tells us number of solutions',
        'If discriminant > 0: two real solutions',
        'If discriminant = 0: one solution (touches x-axis)',
        'If discriminant < 0: no real solutions (doesn\'t cross x-axis)'
      ],
      practiceQuestions: [
        {
          id: 'p6m1',
          question: 'Factor x² - 7x + 12',
          options: ['(x-3)(x-4)', '(x-2)(x-6)', '(x-1)(x-12)', '(x+3)(x+4)'],
          correctAnswer: 0,
          explanation: 'Find two numbers that multiply to 12 and add to -7: -3 and -4',
          difficulty: 'medium'
        },
        {
          id: 'p6m2',
          question: 'What is the vertex of y = x² - 4x + 3?',
          options: ['(2, -1)', '(2, 1)', '(-2, -1)', '(-2, 1)'],
          correctAnswer: 0,
          explanation: 'x = -b/2a = -(-4)/2(1) = 2. y = 2² - 4(2) + 3 = -1. Vertex: (2,-1)',
          difficulty: 'hard'
        },
        {
          id: 'p6m3',
          question: 'Solve x² - 9 = 0',
          options: ['x = ±3', 'x = ±9', 'x = 3', 'x = 9'],
          correctAnswer: 0,
          explanation: 'x² = 9, so x = ±√9 = ±3',
          difficulty: 'easy'
        },
        {
          id: 'p6m4',
          question: 'If y = -2x² + 8x - 6, does the parabola open up or down?',
          options: ['Up', 'Down', 'Neither', 'Cannot determine'],
          correctAnswer: 1,
          explanation: 'Since a = -2 < 0, the parabola opens downward',
          difficulty: 'easy'
        },
        {
          id: 'p6m5',
          question: 'How many real solutions does x² - 2x + 5 = 0 have?',
          options: ['0', '1', '2', '3'],
          correctAnswer: 0,
          explanation: 'Discriminant = (-2)² - 4(1)(5) = 4 - 20 = -16 < 0, so no real solutions',
          difficulty: 'hard'
        }
      ],
      quiz: [
        {
          id: 'q6m1',
          question: 'Solve x² + 5x - 14 = 0 by factoring',
          options: ['x = 2 or x = -7', 'x = -2 or x = 7', 'x = 14 or x = -1', 'x = -14 or x = 1'],
          correctAnswer: 0,
          explanation: '(x+7)(x-2) = 0, so x = -7 or x = 2',
          difficulty: 'medium'
        },
        {
          id: 'q6m2',
          question: 'What is the y-intercept of y = 3x² - 2x + 4?',
          options: ['2', '3', '4', '-2'],
          correctAnswer: 2,
          explanation: 'Y-intercept occurs when x = 0: y = 3(0)² - 2(0) + 4 = 4',
          difficulty: 'easy'
        },
        {
          id: 'q6m3',
          question: 'Find the axis of symmetry for y = 2x² - 8x + 1',
          options: ['x = 2', 'x = -2', 'x = 4', 'x = -4'],
          correctAnswer: 0,
          explanation: 'Axis of symmetry: x = -b/2a = -(-8)/2(2) = 8/4 = 2',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day6',
      title: 'Writing Style and Tone',
      subject: 'english',
      concept: 'Writing style and tone convey attitude and purpose. Formal writing uses complete sentences, proper grammar, and sophisticated vocabulary. Informal writing may use contractions, casual language, and shorter sentences. Tone can be serious, humorous, persuasive, or informative. Word choice (diction) and sentence structure create the desired effect. Consistency in style and tone is crucial throughout a piece.',
      examples: [
        'Formal: "The results indicate a significant correlation between variables."',
        'Informal: "The results show these things are definitely connected."',
        'Serious tone: "Climate change poses unprecedented challenges."',
        'Humorous: "My cooking skills are legendary—for all the wrong reasons."',
        'Persuasive: "We must act now to secure our future."',
        'Informative: "Photosynthesis converts sunlight into chemical energy."',
        'Active voice: "The team won the championship."',
        'Passive voice: "The championship was won by the team."'
      ],
      practiceQuestions: [
        {
          id: 'p6e1',
          question: 'Which sentence maintains formal tone?',
          options: [
            'The experiment didn\'t work out like we wanted.',
            'The experiment failed to produce expected results.',
            'The experiment was a total bust.',
            'We really messed up the experiment.'
          ],
          correctAnswer: 1,
          explanation: 'Formal writing avoids contractions and casual expressions',
          difficulty: 'medium'
        },
        {
          id: 'p6e2',
          question: 'Choose the most persuasive version:',
          options: [
            'Some people think recycling might be good.',
            'Recycling is something to consider.',
            'We must embrace recycling to protect our planet.',
            'Recycling exists as an option.'
          ],
          correctAnswer: 2,
          explanation: 'Strong, decisive language creates persuasive tone',
          difficulty: 'medium'
        },
        {
          id: 'p6e3',
          question: 'Which version uses active voice?',
          options: [
            'The book was read by the student.',
            'The student read the book.',
            'The book was being read.',
            'Reading was done by the student.'
          ],
          correctAnswer: 1,
          explanation: 'Active voice: subject performs the action directly',
          difficulty: 'easy'
        },
        {
          id: 'p6e4',
          question: 'Select the most informative tone:',
          options: [
            'Mitosis is totally amazing and cool!',
            'Mitosis is the process by which cells divide.',
            'I think mitosis is when cells split.',
            'Mitosis might involve cell division or something.'
          ],
          correctAnswer: 1,
          explanation: 'Clear, factual statement without opinion or uncertainty',
          difficulty: 'easy'
        },
        {
          id: 'p6e5',
          question: 'Which maintains consistent formal style?',
          options: [
            'The study shows that exercise helps. It\'s pretty obvious.',
            'The study demonstrates that exercise is beneficial. This finding supports previous research.',
            'The study proves exercise rocks. This is important stuff.',
            'The study says exercise is good. We all knew that.'
          ],
          correctAnswer: 1,
          explanation: 'Maintains formal vocabulary and sentence structure throughout',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q6e1',
          question: 'Choose the sentence with appropriate academic tone:',
          options: [
            'The results were pretty surprising, I guess.',
            'The results are totally mind-blowing!',
            'The results reveal significant findings.',
            'The results are kinda interesting.'
          ],
          correctAnswer: 2,
          explanation: 'Academic tone uses precise, formal language',
          difficulty: 'easy'
        },
        {
          id: 'q6e2',
          question: 'Which version best conveys urgency?',
          options: [
            'Action should probably be taken soon.',
            'Perhaps we should consider taking action.',
            'Immediate action is essential.',
            'Action might be needed eventually.'
          ],
          correctAnswer: 2,
          explanation: 'Strong, definitive language conveys urgency',
          difficulty: 'medium'
        },
        {
          id: 'q6e3',
          question: 'Select the most objective tone:',
          options: [
            'I believe this theory is completely wrong.',
            'This theory is obviously flawed.',
            'Alternative theories merit consideration.',
            'Everyone knows this theory is bad.'
          ],
          correctAnswer: 2,
          explanation: 'Objective tone avoids personal opinion and absolute statements',
          difficulty: 'medium'
        }
      ]
    }
  },
  // Day 7 - Trigonometry and Rhetorical Strategy
  {
    day: 7,
    completed: false,
    mathLesson: {
      id: 'math-day7',
      title: 'Basic Trigonometry and Right Triangles',
      subject: 'math',
      concept: 'Trigonometry studies relationships between angles and sides in triangles. In right triangles, the three main ratios are sine (opposite/hypotenuse), cosine (adjacent/hypotenuse), and tangent (opposite/adjacent). Remember SOH-CAH-TOA. These ratios help find unknown sides and angles. The Pythagorean theorem (a² + b² = c²) is fundamental for right triangle problems.',
      examples: [
        'SOH: sin(θ) = opposite/hypotenuse',
        'CAH: cos(θ) = adjacent/hypotenuse',
        'TOA: tan(θ) = opposite/adjacent',
        'Special angles: sin(30°) = 1/2, cos(30°) = √3/2, tan(30°) = 1/√3',
        'sin(45°) = cos(45°) = √2/2, tan(45°) = 1',
        'sin(60°) = √3/2, cos(60°) = 1/2, tan(60°) = √3',
        'Complementary angles: sin(θ) = cos(90° - θ)',
        'Unit circle: radius = 1, coordinates = (cos θ, sin θ)'
      ],
      practiceQuestions: [
        {
          id: 'p7m1',
          question: 'In a right triangle, if the opposite side is 3 and hypotenuse is 5, what is sin(θ)?',
          options: ['3/5', '4/5', '3/4', '5/3'],
          correctAnswer: 0,
          explanation: 'sin(θ) = opposite/hypotenuse = 3/5',
          difficulty: 'easy'
        },
        {
          id: 'p7m2',
          question: 'If cos(θ) = 4/5, what is sin(θ) in the same right triangle?',
          options: ['3/5', '4/3', '5/4', '5/3'],
          correctAnswer: 0,
          explanation: 'If cos(θ) = 4/5, then adjacent = 4, hypotenuse = 5. By Pythagorean theorem, opposite = 3, so sin(θ) = 3/5',
          difficulty: 'medium'
        },
        {
          id: 'p7m3',
          question: 'What is tan(45°)?',
          options: ['1/2', '√2/2', '1', '√3'],
          correctAnswer: 2,
          explanation: 'In a 45-45-90 triangle, opposite = adjacent, so tan(45°) = 1',
          difficulty: 'medium'
        },
        {
          id: 'p7m4',
          question: 'In a right triangle with legs 6 and 8, what is the hypotenuse?',
          options: ['10', '12', '14', '16'],
          correctAnswer: 0,
          explanation: 'Using Pythagorean theorem: 6² + 8² = 36 + 64 = 100, so c = 10',
          difficulty: 'easy'
        },
        {
          id: 'p7m5',
          question: 'If sin(θ) = 5/13, what is cos(θ)?',
          options: ['12/13', '13/12', '5/12', '12/5'],
          correctAnswer: 0,
          explanation: 'If sin(θ) = 5/13, then opposite = 5, hypotenuse = 13. Adjacent = √(13² - 5²) = 12, so cos(θ) = 12/13',
          difficulty: 'hard'
        }
      ],
      quiz: [
        {
          id: 'q7m1',
          question: 'What is sin(30°)?',
          options: ['1/2', '√2/2', '√3/2', '1'],
          correctAnswer: 0,
          explanation: 'sin(30°) = 1/2 (special angle)',
          difficulty: 'medium'
        },
        {
          id: 'q7m2',
          question: 'In a right triangle, if tan(θ) = 3/4, and the adjacent side is 8, what is the opposite side?',
          options: ['6', '8', '10', '12'],
          correctAnswer: 0,
          explanation: 'tan(θ) = opposite/adjacent = 3/4. If adjacent = 8, then opposite = (3/4) × 8 = 6',
          difficulty: 'medium'
        },
        {
          id: 'q7m3',
          question: 'What is cos(60°)?',
          options: ['1/2', '√2/2', '√3/2', '1'],
          correctAnswer: 0,
          explanation: 'cos(60°) = 1/2 (special angle)',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day7',
      title: 'Rhetorical Strategies and Argument Structure',
      subject: 'english',
      concept: 'Rhetorical strategies help writers persuade and inform effectively. Key strategies include ethos (credibility), pathos (emotional appeal), and logos (logical reasoning). Argument structure typically includes claim, evidence, and reasoning. Effective arguments anticipate counterarguments and address them. Understanding audience and purpose guides strategy selection.',
      examples: [
        'Ethos: "As a practicing physician with 20 years of experience..."',
        'Pathos: "Imagine your child struggling to breathe..."',
        'Logos: "Studies show a 40% reduction in symptoms..."',
        'Claim: "School uniforms should be mandatory."',
        'Evidence: "Research indicates improved focus and reduced bullying."',
        'Reasoning: "When students focus on learning rather than appearance, academic performance improves."',
        'Counterargument: "Critics argue uniforms limit self-expression, but..."',
        'Analogy: "Like a foundation supports a house, evidence supports an argument."'
      ],
      practiceQuestions: [
        {
          id: 'p7e1',
          question: 'Which appeals to ethos?',
          options: [
            'This heartbreaking situation demands action.',
            'Statistics prove our point beyond doubt.',
            'As your elected representative, I understand your concerns.',
            'Everyone agrees this is the right choice.'
          ],
          correctAnswer: 2,
          explanation: 'Appeals to credibility by establishing authority and connection to audience',
          difficulty: 'medium'
        },
        {
          id: 'p7e2',
          question: 'Identify the logical fallacy: "If we allow students to choose their classes, soon they\'ll demand to choose their teachers, and eventually schools will collapse."',
          options: [
            'Ad hominem',
            'Slippery slope',
            'False dilemma',
            'Straw man'
          ],
          correctAnswer: 1,
          explanation: 'Slippery slope assumes one action will lead to extreme consequences',
          difficulty: 'hard'
        },
        {
          id: 'p7e3',
          question: 'Which provides the strongest evidence for an argument about exercise benefits?',
          options: [
            'My friend says exercise helps.',
            'I feel better when I exercise.',
            'A 10-year study of 50,000 participants shows...',
            'Everyone knows exercise is good.'
          ],
          correctAnswer: 2,
          explanation: 'Large-scale, long-term studies provide strongest empirical evidence',
          difficulty: 'easy'
        },
        {
          id: 'p7e4',
          question: 'Which appeals to pathos?',
          options: [
            'Research indicates a significant correlation.',
            'Consider the children who will suffer without our help.',
            'I have studied this issue for decades.',
            'Logic dictates we must choose carefully.'
          ],
          correctAnswer: 1,
          explanation: 'Appeals to emotion by focusing on vulnerable children',
          difficulty: 'easy'
        },
        {
          id: 'p7e5',
          question: 'What makes this argument structure effective? "Homework should be limited because excessive assignments cause stress, reduce family time, and impede other learning activities."',
          options: [
            'It uses emotional language',
            'It provides multiple supporting reasons',
            'It appeals to authority',
            'It uses statistics'
          ],
          correctAnswer: 1,
          explanation: 'Multiple reasons strengthen the argument by providing various angles of support',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q7e1',
          question: 'Which best demonstrates logos?',
          options: [
            'Your heart will break seeing these conditions.',
            'As an expert, I recommend this course of action.',
            'Data from five studies consistently show improvement.',
            'This is clearly the only reasonable choice.'
          ],
          correctAnswer: 2,
          explanation: 'Logos uses logical reasoning and evidence (data from studies)',
          difficulty: 'medium'
        },
        {
          id: 'q7e2',
          question: 'Identify the counterargument strategy: "While critics claim uniforms limit creativity, this policy actually frees students to express themselves through academic achievement rather than clothing choices."',
          options: [
            'Ignoring the criticism',
            'Attacking the critics',
            'Acknowledging and redirecting',
            'Agreeing completely'
          ],
          correctAnswer: 2,
          explanation: 'Acknowledges the criticism then provides an alternative perspective',
          difficulty: 'hard'
        },
        {
          id: 'q7e3',
          question: 'Which rhetorical strategy is most appropriate for a scientific paper?',
          options: [
            'Heavy use of pathos',
            'Personal anecdotes',
            'Logos with supporting data',
            'Emotional language'
          ],
          correctAnswer: 2,
          explanation: 'Scientific writing relies on logical reasoning and empirical evidence',
          difficulty: 'easy'
        }
      ]
    }
  },
  // Day 8 - Complex Numbers and Research Skills
  {
    day: 8,
    completed: false,
    mathLesson: {
      id: 'math-day8',
      title: 'Sequences, Series, and Patterns',
      subject: 'math',
      concept: 'Sequences are ordered lists of numbers following a pattern. Arithmetic sequences add the same value each time (common difference), while geometric sequences multiply by the same value (common ratio). Series are sums of sequence terms. Understanding patterns helps predict future terms and solve real-world problems involving growth and decay.',
      examples: [
        'Arithmetic: 3, 7, 11, 15... (common difference = 4)',
        'Arithmetic formula: an = a1 + (n-1)d',
        'Geometric: 2, 6, 18, 54... (common ratio = 3)',
        'Geometric formula: an = a1 × r^(n-1)',
        'Sum of arithmetic series: Sn = n(a1 + an)/2',
        'Sum of geometric series: Sn = a1(1-r^n)/(1-r)',
        'Fibonacci: 1, 1, 2, 3, 5, 8... (each term = sum of previous two)',
        'Finding patterns: Look for differences, ratios, or other relationships'
      ],
      practiceQuestions: [
        {
          id: 'p8m1',
          question: 'What is the 5th term of the arithmetic sequence 2, 5, 8, 11...?',
          options: ['14', '15', '16', '17'],
          correctAnswer: 0,
          explanation: 'Common difference = 3. 5th term = 2 + (5-1)×3 = 2 + 12 = 14',
          difficulty: 'easy'
        },
        {
          id: 'p8m2',
          question: 'In the geometric sequence 3, 12, 48, 192..., what is the common ratio?',
          options: ['3', '4', '9', '16'],
          correctAnswer: 1,
          explanation: 'Common ratio = 12/3 = 4 (or 48/12 = 4)',
          difficulty: 'easy'
        },
        {
          id: 'p8m3',
          question: 'What is the next term in the sequence 1, 4, 9, 16, 25...?',
          options: ['30', '32', '36', '40'],
          correctAnswer: 2,
          explanation: 'These are perfect squares: 1², 2², 3², 4², 5², so next is 6² = 36',
          difficulty: 'medium'
        },
        {
          id: 'p8m4',
          question: 'Find the 4th term of the geometric sequence where a1 = 5 and r = 2.',
          options: ['20', '30', '40', '80'],
          correctAnswer: 2,
          explanation: 'a4 = 5 × 2^(4-1) = 5 × 2³ = 5 × 8 = 40',
          difficulty: 'medium'
        },
        {
          id: 'p8m5',
          question: 'What is the sum of the first 4 terms of the arithmetic sequence 6, 9, 12, 15?',
          options: ['36', '42', '48', '54'],
          correctAnswer: 1,
          explanation: 'Sum = 6 + 9 + 12 + 15 = 42',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q8m1',
          question: 'In an arithmetic sequence, if a1 = 7 and d = -3, what is a6?',
          options: ['-8', '-5', '-2', '1'],
          correctAnswer: 0,
          explanation: 'a6 = 7 + (6-1)×(-3) = 7 + 5×(-3) = 7 - 15 = -8',
          difficulty: 'medium'
        },
        {
          id: 'q8m2',
          question: 'What type of sequence is 1, 1/2, 1/4, 1/8...?',
          options: ['Arithmetic with d = -1/2', 'Geometric with r = 1/2', 'Geometric with r = 2', 'Neither arithmetic nor geometric'],
          correctAnswer: 1,
          explanation: 'Each term is half the previous term, so r = 1/2',
          difficulty: 'medium'
        },
        {
          id: 'q8m3',
          question: 'Find the pattern: 2, 5, 10, 17, 26... What\'s the next term?',
          options: ['35', '37', '39', '41'],
          correctAnswer: 1,
          explanation: 'Differences: 3, 5, 7, 9... (increasing by 2). Next difference is 11, so 26 + 11 = 37',
          difficulty: 'hard'
        }
      ]
    },
    englishLesson: {
      id: 'english-day8',
      title: 'Research and Citation Skills',
      subject: 'english',
      concept: 'Effective research requires evaluating source credibility, synthesizing information from multiple sources, and properly citing references. Look for authoritative, recent, and relevant sources. Primary sources provide firsthand information, while secondary sources interpret primary sources. Proper citation prevents plagiarism and allows readers to verify information. MLA and APA are common citation styles.',
      examples: [
        'Primary source: Original research study, historical document, interview',
        'Secondary source: Textbook, review article, documentary',
        'Credible indicators: Peer review, established publication, expert author',
        'Red flags: No author listed, extreme bias, outdated information',
        'MLA in-text: (Smith 45) or Smith argues that... (45)',
        'APA in-text: (Smith, 2023, p. 45) or Smith (2023) found...',
        'Synthesis: Combining ideas from multiple sources to form new insights',
        'Paraphrasing: Restating ideas in your own words while citing the source'
      ],
      practiceQuestions: [
        {
          id: 'p8e1',
          question: 'Which is the most credible source for information about climate change?',
          options: [
            'A blog post by an anonymous author',
            'A peer-reviewed article in a scientific journal',
            'A social media post by a celebrity',
            'An opinion piece in a newspaper'
          ],
          correctAnswer: 1,
          explanation: 'Peer-reviewed scientific journals have rigorous fact-checking standards',
          difficulty: 'easy'
        },
        {
          id: 'p8e2',
          question: 'Which represents proper synthesis of sources?',
          options: [
            'Copying information from one source only',
            'Combining ideas from multiple sources to develop a new argument',
            'Using only direct quotes from sources',
            'Ignoring contradictory information'
          ],
          correctAnswer: 1,
          explanation: 'Synthesis involves combining multiple sources to create new insights',
          difficulty: 'medium'
        },
        {
          id: 'p8e3',
          question: 'What makes this citation incorrect? "Johnson said that exercise improves health."',
          options: [
            'Missing page number',
            'Wrong format',
            'No publication year provided',
            'All of the above'
          ],
          correctAnswer: 3,
          explanation: 'Proper citation requires author, year, and page number (when applicable)',
          difficulty: 'medium'
        },
        {
          id: 'p8e4',
          question: 'Which is a primary source for research on the Civil War?',
          options: [
            'A modern history textbook',
            'A letter written by a soldier in 1863',
            'A documentary made in 2020',
            'A biography of Abraham Lincoln'
          ],
          correctAnswer: 1,
          explanation: 'Primary sources are original documents from the time period being studied',
          difficulty: 'easy'
        },
        {
          id: 'p8e5',
          question: 'When should you cite a source?',
          options: [
            'Only when using direct quotes',
            'Only when using statistics',
            'When using any ideas that are not your own',
            'Only when required by the teacher'
          ],
          correctAnswer: 2,
          explanation: 'All borrowed ideas, whether quoted or paraphrased, must be cited',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q8e1',
          question: 'Which source would be most appropriate for current medical research?',
          options: [
            'A medical journal article from 1985',
            'A recent peer-reviewed study in a medical journal',
            'A health blog by a non-expert',
            'A general encyclopedia entry'
          ],
          correctAnswer: 1,
          explanation: 'Recent, peer-reviewed medical research provides the most current and reliable information',
          difficulty: 'easy'
        },
        {
          id: 'q8e2',
          question: 'What is plagiarism?',
          options: [
            'Using too many sources',
            'Citing sources incorrectly',
            'Using someone else\'s ideas without proper attribution',
            'Writing too short a paper'
          ],
          correctAnswer: 2,
          explanation: 'Plagiarism is presenting others\' ideas as your own without proper citation',
          difficulty: 'easy'
        },
        {
          id: 'q8e3',
          question: 'Which indicates a potentially biased source?',
          options: [
            'Multiple authors listed',
            'Recent publication date',
            'Extreme language and one-sided presentation',
            'Inclusion of statistics'
          ],
          correctAnswer: 2,
          explanation: 'Extreme language and lack of balanced perspective suggest bias',
          difficulty: 'medium'
        }
      ]
    }
  },
  // Day 9 - Advanced Algebra and Editing Skills
  {
    day: 9,
    completed: false,
    mathLesson: {
      id: 'math-day9',
      title: 'Logarithms and Exponential Functions',
      subject: 'math',
      concept: 'Exponential functions have the form f(x) = a·b^x and show rapid growth or decay. Logarithms are the inverse of exponential functions. If b^x = y, then log_b(y) = x. Common logarithms use base 10 (log), natural logarithms use base e (ln). These functions model real-world phenomena like population growth, radioactive decay, and compound interest.',
      examples: [
        'Exponential growth: f(x) = 2^x (doubles each time)',
        'Exponential decay: f(x) = (1/2)^x (halves each time)',
        'Logarithm definition: log_2(8) = 3 because 2³ = 8',
        'Common log: log(100) = 2 because 10² = 100',
        'Natural log: ln(e) = 1 because e¹ = e',
        'Log properties: log(xy) = log(x) + log(y)',
        'log(x/y) = log(x) - log(y)',
        'log(x^n) = n·log(x)'
      ],
      practiceQuestions: [
        {
          id: 'p9m1',
          question: 'What is log₂(16)?',
          options: ['2', '3', '4', '5'],
          correctAnswer: 2,
          explanation: 'log₂(16) = 4 because 2⁴ = 16',
          difficulty: 'easy'
        },
        {
          id: 'p9m2',
          question: 'If f(x) = 3^x, what is f(4)?',
          options: ['12', '64', '81', '243'],
          correctAnswer: 2,
          explanation: 'f(4) = 3⁴ = 81',
          difficulty: 'easy'
        },
        {
          id: 'p9m3',
          question: 'Solve for x: 2^x = 32',
          options: ['4', '5', '6', '7'],
          correctAnswer: 1,
          explanation: '2⁵ = 32, so x = 5',
          difficulty: 'medium'
        },
        {
          id: 'p9m4',
          question: 'What is log(1000)?',
          options: ['2', '3', '4', '10'],
          correctAnswer: 1,
          explanation: 'log(1000) = log(10³) = 3',
          difficulty: 'easy'
        },
        {
          id: 'p9m5',
          question: 'If log(x) + log(y) = 3, what is log(xy)?',
          options: ['1', '2', '3', '6'],
          correctAnswer: 2,
          explanation: 'Using log property: log(x) + log(y) = log(xy) = 3',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q9m1',
          question: 'Solve for x: log₃(x) = 4',
          options: ['12', '64', '81', '256'],
          correctAnswer: 2,
          explanation: 'If log₃(x) = 4, then x = 3⁴ = 81',
          difficulty: 'medium'
        },
        {
          id: 'q9m2',
          question: 'What is the y-intercept of f(x) = 5·2^x?',
          options: ['0', '2', '5', '10'],
          correctAnswer: 2,
          explanation: 'When x = 0, f(0) = 5·2⁰ = 5·1 = 5',
          difficulty: 'medium'
        },
        {
          id: 'q9m3',
          question: 'Simplify: log₂(8) + log₂(4)',
          options: ['5', '6', '7', '8'],
          correctAnswer: 0,
          explanation: 'log₂(8) = 3, log₂(4) = 2, so 3 + 2 = 5',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day9',
      title: 'Editing and Revision Strategies',
      subject: 'english',
      concept: 'Effective editing involves reviewing for content, organization, grammar, and style. Revision focuses on big-picture changes: clarity, coherence, and argument strength. Editing addresses surface-level issues: grammar, punctuation, and word choice. Read aloud to catch errors, check for consistent tense and voice, and ensure smooth transitions between ideas. Peer review provides valuable outside perspective.',
      examples: [
        'Content revision: Does this paragraph support the main argument?',
        'Organization: Are ideas presented in logical order?',
        'Clarity: Is this sentence confusing or ambiguous?',
        'Grammar check: Subject-verb agreement, pronoun reference',
        'Style consistency: Formal vs. informal tone throughout',
        'Transition quality: How well do paragraphs connect?',
        'Word choice: Is there a more precise synonym?',
        'Conciseness: Can this be said in fewer words?'
      ],
      practiceQuestions: [
        {
          id: 'p9e1',
          question: 'Which represents a revision (not editing) concern?',
          options: [
            'Fixing a comma splice',
            'Correcting a misspelled word',
            'Reorganizing paragraphs for better flow',
            'Changing "their" to "there"'
          ],
          correctAnswer: 2,
          explanation: 'Revision involves major structural changes; editing fixes surface errors',
          difficulty: 'medium'
        },
        {
          id: 'p9e2',
          question: 'What should you do first when revising an essay?',
          options: [
            'Check for spelling errors',
            'Fix comma placement',
            'Evaluate overall argument and structure',
            'Correct verb tenses'
          ],
          correctAnswer: 2,
          explanation: 'Start with big-picture issues before addressing surface-level errors',
          difficulty: 'easy'
        },
        {
          id: 'p9e3',
          question: 'Which sentence needs editing for conciseness? "In my personal opinion, I believe that students should be required to wear uniforms to school every day."',
          options: [
            'The grammar is incorrect',
            'It contains redundant phrases',
            'The punctuation is wrong',
            'The spelling is incorrect'
          ],
          correctAnswer: 1,
          explanation: '"In my personal opinion" and "I believe" are redundant',
          difficulty: 'medium'
        },
        {
          id: 'p9e4',
          question: 'Which is the most effective revision strategy?',
          options: [
            'Edit while writing the first draft',
            'Focus only on grammar errors',
            'Read the paper aloud to catch problems',
            'Make all changes at once'
          ],
          correctAnswer: 2,
          explanation: 'Reading aloud helps identify unclear passages and errors',
          difficulty: 'easy'
        },
        {
          id: 'p9e5',
          question: 'What type of error is this? "The students was working hard on their projects."',
          options: [
            'Pronoun agreement',
            'Subject-verb agreement',
            'Verb tense',
            'Comma usage'
          ],
          correctAnswer: 1,
          explanation: 'Plural subject "students" requires plural verb "were"',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q9e1',
          question: 'Which shows the best revision for clarity? Original: "The book that was written by the author who won the prize is on the table."',
          options: [
            'The book that was written by the author who won the prize is on the table.',
            'The prize-winning author\'s book is on the table.',
            'The author wrote a book that won a prize and is on the table.',
            'On the table is the book by the author with the prize.'
          ],
          correctAnswer: 1,
          explanation: 'Eliminates wordiness while maintaining clarity',
          difficulty: 'medium'
        },
        {
          id: 'q9e2',
          question: 'Which editing concern should be addressed last?',
          options: [
            'Paragraph organization',
            'Argument development',
            'Comma placement',
            'Thesis clarity'
          ],
          correctAnswer: 2,
          explanation: 'Punctuation is a surface-level issue addressed after content and structure',
          difficulty: 'easy'
        },
        {
          id: 'q9e3',
          question: 'Identify the revision needed: "Technology is helpful. It can also be harmful. Students use it constantly."',
          options: [
            'Add more examples',
            'Improve sentence variety and transitions',
            'Check grammar',
            'Add citations'
          ],
          correctAnswer: 1,
          explanation: 'Choppy sentences need better flow and connections',
          difficulty: 'medium'
        }
      ]
    }
  },
  // Day 10 - Review and Integration
  {
    day: 10,
    completed: false,
    mathLesson: {
      id: 'math-day10',
      title: 'ACT Math Review and Test Strategies',
      subject: 'math',
      concept: 'Success on the ACT Math section requires strategic thinking and efficient problem-solving. Review key concepts: algebra, geometry, trigonometry, and statistics. Time management is crucial—spend approximately 1 minute per question. Use estimation when appropriate, eliminate obviously wrong answers, and work backward from answer choices when helpful. Practice mental math and memorize key formulas.',
      examples: [
        'Time strategy: 60 questions in 60 minutes = 1 minute each',
        'Estimation: Is 23% of 197 closer to 40 or 400?',
        'Working backward: If f(x) = 2x + 3 and f(a) = 11, test a = 4',
        'Process of elimination: Remove impossible answers first',
        'Formula shortcuts: Area of triangle = ½bh, Pythagorean theorem',
        'Calculator use: Verify computations, but don\'t rely solely on it',
        'Coordinate geometry: Distance, midpoint, slope formulas',
        'Test-taking: Skip difficult questions initially, return if time permits'
      ],
      practiceQuestions: [
        {
          id: 'p10m1',
          question: 'If 3x + 7 = 22, what is 6x + 14?',
          options: ['30', '37', '44', '52'],
          correctAnswer: 2,
          explanation: 'If 3x + 7 = 22, then 3x = 15. So 6x + 14 = 2(3x) + 14 = 2(15) + 14 = 44',
          difficulty: 'medium'
        },
        {
          id: 'p10m2',
          question: 'A circle has area 49π. What is its radius?',
          options: ['7', '14', '49', '98'],
          correctAnswer: 0,
          explanation: 'A = πr², so 49π = πr², therefore r² = 49, so r = 7',
          difficulty: 'medium'
        },
        {
          id: 'p10m3',
          question: 'In triangle ABC, if angle A = 30° and angle B = 60°, what is angle C?',
          options: ['60°', '90°', '120°', '150°'],
          correctAnswer: 1,
          explanation: 'Angles in a triangle sum to 180°: 30° + 60° + C = 180°, so C = 90°',
          difficulty: 'easy'
        },
        {
          id: 'p10m4',
          question: 'If f(x) = x² - 4x + 3, what is f(2)?',
          options: ['-1', '0', '1', '3'],
          correctAnswer: 0,
          explanation: 'f(2) = 2² - 4(2) + 3 = 4 - 8 + 3 = -1',
          difficulty: 'easy'
        },
        {
          id: 'p10m5',
          question: 'What is 25% of 25% of 400?',
          options: ['25', '50', '100', '200'],
          correctAnswer: 0,
          explanation: '25% of 400 = 100, then 25% of 100 = 25',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q10m1',
          question: 'A rectangle has perimeter 24 and width 4. What is its area?',
          options: ['32', '40', '48', '96'],
          correctAnswer: 0,
          explanation: 'If P = 24 and w = 4, then 2l + 2(4) = 24, so l = 8. Area = 8 × 4 = 32',
          difficulty: 'medium'
        },
        {
          id: 'q10m2',
          question: 'If log₂(x) = 5, what is x?',
          options: ['10', '25', '32', '125'],
          correctAnswer: 2,
          explanation: 'If log₂(x) = 5, then x = 2⁵ = 32',
          difficulty: 'medium'
        },
        {
          id: 'q10m3',
          question: 'What is the slope of the line through (2,3) and (6,11)?',
          options: ['1', '2', '3', '4'],
          correctAnswer: 1,
          explanation: 'Slope = (11-3)/(6-2) = 8/4 = 2',
          difficulty: 'easy'
        }
      ]
    },
    englishLesson: {
      id: 'english-day10',
      title: 'ACT English Review and Test Strategies',
      subject: 'english',
      concept: 'The ACT English section tests grammar, usage, punctuation, and rhetorical skills. Key strategies include reading each passage completely, trusting your ear for grammar errors, and understanding question types. Some questions test specific rules (apostrophes, commas), while others assess style and organization. Practice identifying the most concise, clear, and grammatically correct options.',
      examples: [
        'Grammar focus: Subject-verb agreement, pronoun reference, verb tense',
        'Punctuation: Comma rules, apostrophes, semicolons, colons',
        'Style questions: Wordiness, tone, transitions',
        'Organization: Sentence placement, paragraph structure',
        'Strategy: Read surrounding sentences for context',
        'NO CHANGE is often correct—don\'t overthink',
        'Conciseness: Shorter is usually better if meaning is preserved',
        'Read answer choices in context, not in isolation'
      ],
      practiceQuestions: [
        {
          id: 'p10e1',
          question: 'Choose the best revision: "Due to the fact that it was raining, we stayed inside."',
          options: [
            'NO CHANGE',
            'Because it was raining, we stayed inside.',
            'As a result of the rain, we stayed inside.',
            'Given the fact that rain was occurring, we stayed inside.'
          ],
          correctAnswer: 1,
          explanation: '"Because" is more concise than "due to the fact that"',
          difficulty: 'easy'
        },
        {
          id: 'p10e2',
          question: 'Which is correct? "Each of the students _____ their own computer."',
          options: ['has', 'have', 'are having', 'were having'],
          correctAnswer: 0,
          explanation: '"Each" is singular and requires singular verb "has"',
          difficulty: 'medium'
        },
        {
          id: 'p10e3',
          question: 'Choose the best punctuation: "The teacher assigned homework _____ math, science, and English."',
          options: [':', ';', ',', '—'],
          correctAnswer: 0,
          explanation: 'Use colon to introduce a list after a complete statement',
          difficulty: 'medium'
        },
        {
          id: 'p10e4',
          question: 'Select the most effective transition: "The experiment failed. _____, we learned valuable lessons."',
          options: ['Therefore', 'However', 'Furthermore', 'Meanwhile'],
          correctAnswer: 1,
          explanation: '"However" shows contrast between failure and positive outcome',
          difficulty: 'easy'
        },
        {
          id: 'p10e5',
          question: 'Which maintains parallel structure? "I like swimming, running, and ______."',
          options: ['to bike', 'cycling', 'bike rides', 'when I bike'],
          correctAnswer: 1,
          explanation: 'Parallel structure requires same grammatical form: -ing verbs',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q10e1',
          question: 'Choose the best revision for clarity: "When students study hard, they usually succeed in passing their tests."',
          options: [
            'NO CHANGE',
            'When students study hard, they usually pass their tests.',
            'Students who study hard usually succeed in passing tests.',
            'Hard-studying students usually succeed in test-passing.'
          ],
          correctAnswer: 1,
          explanation: 'Eliminates redundancy ("succeed in passing" vs. "pass")',
          difficulty: 'medium'
        },
        {
          id: 'q10e2',
          question: 'Which sentence has correct apostrophe usage?',
          options: [
            'The dog wagged it\'s tail happily.',
            'The dogs\' owner called them home.',
            'Three dog\'s were playing in the park.',
            'The dogs tail\'s were wagging.'
          ],
          correctAnswer: 1,
          explanation: 'Multiple dogs own something, so use dogs\' (plural possessive)',
          difficulty: 'medium'
        },
        {
          id: 'q10e3',
          question: 'Select the sentence with the best style for academic writing:',
          options: [
            'The results were pretty amazing, honestly.',
            'OMG, the results were so good!',
            'The results exceeded expectations significantly.',
            'The results were totally awesome.'
          ],
          correctAnswer: 2,
          explanation: 'Academic writing requires formal, precise language',
          difficulty: 'easy'
        }
      ]
    }
  }
];
];