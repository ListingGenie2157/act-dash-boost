import { Day, Lesson, DrillSession } from '../types';

// Drill sessions provide rapid-fire practice separate from the structured daily lessons.
// These drills are unchanged from the original curriculum and can be used for extra practice.
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
      },
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
      },
      {
        id: 'mb10',
        question: 'What is 15% of 60?',
        options: ['6', '9', '10', '12'],
        correctAnswer: 1,
        explanation: '15% = 0.15; 0.15 × 60 = 9',
        difficulty: 'easy'
      },
      {
        id: 'mb11',
        question: 'Simplify the ratio 9:21.',
        options: ['3:7', '7:3', '1:2', '3:9'],
        correctAnswer: 0,
        explanation: 'Divide both numbers by 3 to get 3:7.',
        difficulty: 'easy'
      },
      {
        id: 'mb12',
        question: 'Solve for x: 4x + 5 = 21.',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        explanation: 'Subtract 5: 4x = 16 → x = 4',
        difficulty: 'easy'
      },
      {
        id: 'mb13',
        question: 'What is 4/5 expressed as a percentage?',
        options: ['20%', '40%', '60%', '80%'],
        correctAnswer: 3,
        explanation: '4/5 = 0.8 = 80%',
        difficulty: 'medium'
      },
      {
        id: 'mb14',
        question: 'If x = 4, what is 3x²?',
        options: ['12', '36', '48', '64'],
        correctAnswer: 2,
        explanation: '3×4² = 3×16 = 48',
        difficulty: 'easy'
      },
      {
        id: 'mb15',
        question: 'Solve for x: 4x - 7 = 17',
        options: ['3', '4', '6', '5'],
        correctAnswer: 2,
        explanation: '4x = 24 → x = 6',
        difficulty: 'medium'
      },
      {
        id: 'mb16',
        question: 'What is log₁₀(10000)?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 2,
        explanation: 'log base 10 of 10000 equals 4 because 10⁴ = 10000',
        difficulty: 'medium'
      },
      {
        id: 'mb17',
        question: 'Simplify (x² - 9) / (x - 3)',
        options: ['x + 3', 'x - 3', 'x² + 3', 'x + 9'],
        correctAnswer: 0,
        explanation: 'x² - 9 factors to (x - 3)(x + 3); dividing by (x - 3) leaves x + 3',
        difficulty: 'medium'
      },
      {
        id: 'mb18',
        question: 'Solve the inequality: x - 3 < 7',
        options: ['x < 10', 'x > 10', 'x < -4', 'x > -4'],
        correctAnswer: 0,
        explanation: 'x - 3 < 7 → x < 10',
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
          "Its' a beautiful day outside.",
          "It's a beautiful day outside."
        ],
        correctAnswer: 1,
        explanation: '"It\'s" is the contraction for "it is"',
        difficulty: 'easy'
      },
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
      ,
      {
        id: 'gb6',
        question: 'Choose the correct pronoun: Either of the girls can bring ___ lunch.',
        options: ['their', 'her', 'hers', 'them'],
        correctAnswer: 1,
        explanation: '"Either" is singular, so use the singular pronoun "her"',
        difficulty: 'easy'
      },
      {
        id: 'gb7',
        question: 'Where should you place a comma? "Whenever she travels she buys souvenirs."',
        options: [
          'After she',
          'After travels',
          'After she travels',
          'No comma needed'
        ],
        correctAnswer: 2,
        explanation: 'An introductory clause should be followed by a comma.',
        difficulty: 'medium'
      },
      {
        id: 'gb8',
        question: 'Select the sentence with correct semicolon usage.',
        options: [
          'He loves to play basketball; he also enjoys soccer.',
          'He loves to play basketball; but he also enjoys soccer.',
          'He loves to play basketball, he also enjoys soccer.',
          'He loves to play basketball he also enjoys soccer.'
        ],
        correctAnswer: 0,
        explanation: 'A semicolon joins two closely related independent clauses without a conjunction.',
        difficulty: 'medium'
      },
      {
        id: 'gb9',
        question: 'Which sentence uses a colon correctly?',
        options: [
          'There are three primary colors: red, blue, and yellow.',
          'There are three primary colors: red, blue and yellow.',
          'There are three primary colors, red blue and yellow.',
          'There are three primary colors red, blue and yellow.'
        ],
        correctAnswer: 0,
        explanation: 'Use a colon after a complete sentence to introduce a list.',
        difficulty: 'medium'
      },
      {
        id: 'gb10',
        question: 'Choose the sentence with correct parallel structure.',
        options: [
          'She likes dancing, singing, and painting.',
          'She likes to dance, singing, and painting.',
          'She likes dancing, to sing, and painting.',
          'She likes dancing, singing, and to paint.'
        ],
        correctAnswer: 0,
        explanation: 'Parallel structure requires items in a list to have the same grammatical form.',
        difficulty: 'medium'
      }
    ]
  }
];

// Curriculum for the ACT study plan.  Each entry in this array represents a day's lessons for both math and English.
// The original curriculum defined separate days for percentages/ratios, fractions/operations, and advanced ratios.  This
// version combines those into a single foundational day and expands the plan into seven additional days to cover
// algebra, functions, geometry, statistics, matrices, review, and a final practice test.
export const curriculum: Day[] = [
  /**
   * Day 1: Combined fundamentals for math and English.
   * This lesson merges the original days 1–3, covering percentages, fractions/decimals,
   * ratios/proportions on the math side, and subject–verb agreement, comma rules,
   * and advanced punctuation on the English side. It provides a solid foundation
   * before moving into more advanced topics.
   */
  {
    day: 1,
    completed: false,
    mathLesson: {
      id: 'math-day1-3',
      title: 'Fundamentals: Percentages, Fractions & Ratios',
      subject: 'math',
      concept:
        'This combined lesson covers percentages, fractions/decimals, and ratios/proportions. Mastering these conversions and relationships is critical for solving word problems, interpreting data, and setting up equations on the ACT.',
      examples: [
        'Percentage conversions: 25% = 25/100 = 1/4 = 0.25',
        'Converting fractions to decimals: 3/8 = 0.375 = 37.5%',
        'Finding percentages: 30% of 60 = 0.30 × 60 = 18',
        'Ratios to proportions: If 2:3 = x:12, then 3x = 24, so x = 8',
        'Solving proportion word problems: 4 workers for 6 days ⇒ 3 workers for 8 days (24 worker‑days)'
      ],
      practiceQuestions: [
        {
          id: 'p1c1',
          question: 'Convert 0.2 to a percentage.',
          options: ['2%', '20%', '200%', '0.2%'],
          correctAnswer: 1,
          explanation: '0.2 = 20%',
          difficulty: 'easy'
        },
        {
          id: 'p1c2',
          question: 'Simplify the ratio 18:24.',
          options: ['2:3', '3:4', '4:3', '3:2'],
          correctAnswer: 1,
          explanation: '18:24 reduces to 3:4 after dividing both by 6.',
          difficulty: 'easy'
        },
        {
          id: 'p1c3',
          question: 'What is 3/5 expressed as a percentage?',
          options: ['35%', '40%', '50%', '60%'],
          correctAnswer: 3,
          explanation: '3/5 = 0.6 = 60%',
          difficulty: 'medium'
        },
        {
          id: 'p1c4',
          question: 'If 5 books cost $80, how much do 8 books cost at the same rate?',
          options: ['$128', '$120', '$115', '$140'],
          correctAnswer: 0,
          explanation: 'Unit rate: $80 ÷ 5 = $16/book; 8 × $16 = $128',
          difficulty: 'medium'
        },
        {
          id: 'p1c5',
          question: 'Solve for x: 2/3 = x/12.',
          options: ['4', '6', '8', '9'],
          correctAnswer: 2,
          explanation: 'Cross multiply: 2×12 = 3x → x = 8',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q1c1',
          question: 'What is 40% of 50?',
          options: ['10', '15', '20', '25'],
          correctAnswer: 2,
          explanation: '40% = 0.40; 0.40 × 50 = 20',
          difficulty: 'easy'
        },
        {
          id: 'q1c2',
          question: 'Convert 7/20 to a decimal.',
          options: ['0.35', '0.4', '0.45', '0.5'],
          correctAnswer: 0,
          explanation: '7 ÷ 20 = 0.35',
          difficulty: 'easy'
        },
        {
          id: 'q1c3',
          question: 'In a ratio of 3:5, what fraction of the whole is represented by the first quantity?',
          options: ['3/5', '3/8', '3/10', '5/8'],
          correctAnswer: 1,
          explanation: 'Total parts = 3 + 5 = 8; fraction = 3/8',
          difficulty: 'medium'
        },
        {
          id: 'q1c4',
          question: 'If 4:7 = x:42, what is x?',
          options: ['24', '28', '30', '36'],
          correctAnswer: 0,
          explanation: '4/7 = x/42 → 7x = 168 → x = 24',
          difficulty: 'medium'
        },
        {
          id: 'q1c5',
          question: 'Simplify: (3/4) ÷ (2/3).',
          options: ['9/8', '8/9', '3/8', '2/3'],
          correctAnswer: 0,
          explanation: '(3/4) ÷ (2/3) = (3/4) × (3/2) = 9/8',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day1-3',
      title: 'Core Grammar & Punctuation',
      subject: 'english',
      concept:
        'This combined lesson reviews subject–verb agreement, comma usage, and advanced punctuation (semicolons and colons). Understanding these rules ensures grammatically correct sentences and enhances clarity in writing.',
      examples: [
        'Agreement: The team is winning vs. The teams are winning',
        'Comma rule: After the game, we celebrated',
        'Semicolon: I wanted to go out; however, I had to study',
        'Colon: She packed three things: snacks, water, and a map'
      ],
      practiceQuestions: [
        {
          id: 'p1g1',
          question: 'Choose the sentence with correct subject–verb agreement.',
          options: [
            'Neither the students nor the teacher are late.',
            'Neither the students nor the teacher is late.',
            'Neither the students or the teacher is late.',
            'Neither the students or the teacher are late.'
          ],
          correctAnswer: 1,
          explanation: 'With neither/nor, the verb agrees with the noun closest to it (teacher = singular → "is").',
          difficulty: 'medium'
        },
        {
          id: 'p1g2',
          question: 'Insert commas: "During the summer we swim hike and camp."',
          options: [
            'During the summer, we swim, hike and camp.',
            'During the summer we, swim, hike and camp.',
            'During the summer we swim, hike, and camp.',
            'During the summer, we swim, hike, and camp.'
          ],
          correctAnswer: 3,
          explanation: 'Use a comma after an introductory phrase and between items in a series. Oxford comma is recommended.',
          difficulty: 'medium'
        },
        {
          id: 'p1g3',
          question: 'Select the correctly punctuated sentence.',
          options: [
            'He asked me to bring pencils paper and pens.',
            'He asked me to bring pencils, paper, and pens.',
            'He asked me to bring pencils; paper and pens.',
            'He asked me to bring pencils, paper and pens.'
          ],
          correctAnswer: 1,
          explanation: 'Use commas to separate all items in a series. Option D omits the Oxford comma.',
          difficulty: 'easy'
        },
        {
          id: 'p1g4',
          question: 'Where should you place the semicolon? "I have an exam tomorrow therefore I will study tonight."',
          options: [
            'After "exam" with a comma after "therefore"',
            'After "tomorrow" and no comma after "therefore"',
            'After "tomorrow" with a comma after "therefore"',
            'After "exam" and no comma after "therefore"'
          ],
          correctAnswer: 2,
          explanation: 'Use a semicolon before a conjunctive adverb (therefore) and a comma after it.',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q1g1',
          question: 'Identify the correct use of a colon.',
          options: [
            'She needs to pack: her shoes, her jacket and her notebook.',
            'She needs: to pack her shoes, her jacket, and her notebook.',
            'She needs to pack her shoes, her jacket, and: her notebook.',
            'She needs to pack her shoes her jacket: and her notebook.'
          ],
          correctAnswer: 0,
          explanation: 'Use a colon after a complete sentence to introduce a list.',
          difficulty: 'easy'
        },
        {
          id: 'q1g2',
          question: 'Which sentence is punctuated correctly?',
          options: [
            'The players practiced, and ran drills and studied plays.',
            'The players practiced and ran drills, and studied plays.',
            'The players practiced, ran drills, and studied plays.',
            'The players, practiced, ran drills, and studied plays.'
          ],
          correctAnswer: 2,
          explanation: 'No comma before "and" unless joining two independent clauses; here it connects items in a series.',
          difficulty: 'medium'
        },
        {
          id: 'q1g3',
          question: 'Which sentence uses semicolons and commas correctly?',
          options: [
            'She visited Paris, France London, England and Rome, Italy.',
            'She visited Paris France; London England; and Rome Italy.',
            'She visited Paris, France; London, England; and Rome, Italy.',
            'She visited Paris France, London England, and Rome Italy.'
          ],
          correctAnswer: 2,
          explanation: 'Use semicolons to separate list items when they already contain internal commas.',
          difficulty: 'hard'
        }
      ]
    }
  },
  /**
   * Day 2: Algebra & Exponents / Pronouns & Verb Tense
   * Introduces fundamental algebraic techniques such as solving linear equations,
   * manipulating exponents, and evaluating roots. English focuses on pronoun use
   * (subject, object, possessive) and verb tense consistency.
   */
  {
    day: 2,
    completed: false,
    mathLesson: {
      id: 'math-day2',
      title: 'Algebra Essentials and Exponents',
      subject: 'math',
      concept:
        'Develop fluency in solving linear equations, manipulating exponents, and simplifying radical expressions. These skills form the backbone of algebra problems on the ACT.',
      examples: [
        'Solving for x: 2x + 5 = 13 → 2x = 8 → x = 4',
        'Exponent rules: 5^3 × 5^2 = 5^(3+2) = 5^5',
        'Negative exponent: 4^(−2) = 1/(4^2) = 1/16',
        'Radical simplification: √50 = √(25×2) = 5√2'
      ],
      practiceQuestions: [
        {
          id: 'p2m1',
          question: 'Solve for x: 3x - 7 = 2.',
          options: ['1', '3', '2', '5'],
          correctAnswer: 1,
          explanation: '3x − 7 = 2 → 3x = 9 → x = 3',
          difficulty: 'easy'
        },
        {
          id: 'p2m2',
          question: 'Simplify: 2^3 × 2^4.',
          options: ['2^7', '2^12', '2^1', '2^6'],
          correctAnswer: 0,
          explanation: 'Add exponents: 3 + 4 = 7; 2^3 × 2^4 = 2^7',
          difficulty: 'easy'
        },
        {
          id: 'p2m3',
          question: 'Compute: (3/4)^(−1).',
          options: ['3/4', '4/3', '9/16', '16/9'],
          correctAnswer: 1,
          explanation: 'A negative exponent inverts the fraction: (3/4)^(−1) = 4/3',
          difficulty: 'medium'
        },
        {
          id: 'p2m4',
          question: 'Simplify: √72.',
          options: ['6√2', '4√3', '8√3', '6√3'],
          correctAnswer: 0,
          explanation: '√72 = √(36×2) = 6√2',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q2m1',
          question: 'Solve: 5x + 7 = 3x + 19.',
          options: ['5', '6', '7', '8'],
          correctAnswer: 1,
          explanation: 'Subtract 3x: 2x + 7 = 19 → 2x = 12 → x = 6',
          difficulty: 'easy'
        },
        {
          id: 'q2m2',
          question: 'Simplify: (x^3)(x^2).',
          options: ['x^5', 'x^6', 'x^9', 'x^1'],
          correctAnswer: 0,
          explanation: 'Add exponents: 3 + 2 = 5',
          difficulty: 'easy'
        },
        {
          id: 'q2m3',
          question: 'Compute: √(81) − √(16).',
          options: ['3', '5', '2', '7'],
          correctAnswer: 1,
          explanation: '√81 = 9 and √16 = 4; 9 − 4 = 5',
          difficulty: 'medium'
        },
        {
          id: 'q2m4',
          question: 'What is the value of 8^(2/3)?',
          options: ['2', '4', '6', '8'],
          correctAnswer: 1,
          explanation: '8^(2/3) = (\u221a[3]{8})^2 = 2^2 = 4',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day2',
      title: 'Pronouns & Verb Tense',
      subject: 'english',
      concept:
        'Focus on correct use of pronouns (subjective vs. objective vs. possessive) and maintaining consistent verb tense within sentences and paragraphs.',
      examples: [
        'Pronoun case: He and I (not him and me) went to the store',
        'Possessive pronouns: Its vs. It\'s; your vs. you\'re',
        'Verb tense consistency: She studied for the exam and passes with a high score → should be "passed"'
      ],
      practiceQuestions: [
        {
          id: 'p2g1',
          question: 'Which sentence uses the correct pronoun?',
          options: [
            'Please give the book to she.',
            'Please give the book to her.',
            'Please give the book to hers.',
            'Please give the book to she\''
          ],
          correctAnswer: 1,
          explanation: '"Her" is the objective form used after a preposition',
          difficulty: 'easy'
        },
        {
          id: 'p2g2',
          question: 'Choose the correct verb form: "By the time we arrived, he _____ dinner."',
          options: ['cook', 'cooking', 'had cooked', 'has cooked'],
          correctAnswer: 2,
          explanation: 'Past perfect (had cooked) is needed to show the action was completed before another past action',
          difficulty: 'medium'
        },
        {
          id: 'p2g3',
          question: 'Identify the grammatically correct sentence.',
          options: [
            'Him and me are going to the game.',
            'He and I are going to the game.',
            'Him and I are going to the game.',
            'He and me are going to the game.'
          ],
          correctAnswer: 1,
          explanation: 'Subject pronouns (he, I) should be used in compound subjects',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q2g1',
          question: 'Which choice correctly completes the sentence? "Each of the students must bring _____ own pencil."',
          options: ['their', 'his or her', 'its', 'there'],
          correctAnswer: 1,
          explanation: '“Each” is singular, so use singular pronoun. "His or her" is the correct inclusive singular form.',
          difficulty: 'medium'
        },
        {
          id: 'q2g2',
          question: 'Select the sentence with consistent verb tense.',
          options: [
            'She walks into the room and greeted everyone.',
            'She walked into the room and greets everyone.',
            'She walked into the room and greeted everyone.',
            'She walks into the room and greets everyone.'
          ],
          correctAnswer: 2,
          explanation: 'Past tense should be consistent: walked and greeted',
          difficulty: 'easy'
        },
        {
          id: 'q2g3',
          question: 'Which sentence uses the correct pronoun?',
          options: [
            'Between you and I, the movie was great.',
            'Between you and me, the movie was great.',
            'Between I and you, the movie was great.',
            'Between me and you, the movie was great.'
          ],
          correctAnswer: 1,
          explanation: 'Pronoun following a preposition should be in objective case: me',
          difficulty: 'easy'
        }
      ]
    }
  },
  /**
   * Day 3: Functions & Inequalities / Parallelism & Modifiers
   * Introduces evaluating functions, understanding domain/range, graph shifts, and solving inequalities. English focuses on parallel structure and identifying misplaced/dangling modifiers.
   */
  {
    day: 3,
    completed: false,
    mathLesson: {
      id: 'math-day3',
      title: 'Functions, Graphs & Inequalities',
      subject: 'math',
      concept:
        'Develop proficiency in evaluating functions, analyzing graphs, and solving inequalities. Learn how to identify domain and range, perform graph shifts, and represent solutions on a number line.',
      examples: [
        'Evaluate functions: If f(x) = 2x + 3, then f(4) = 11',
        'Domain & range: For g(x) = √(x − 2), domain x ≥ 2 and range y ≥ 0',
        'Graph shifts: y = (x − 3)^2 shifts the parabola 3 units right',
        'Inequality solving: 2x − 5 > 9 → 2x > 14 → x > 7'
      ],
      practiceQuestions: [
        {
          id: 'p3m1',
          question: 'If f(x) = 3x − 2, what is f(5)?',
          options: ['13', '15', '7', '8'],
          correctAnswer: 0,
          explanation: 'f(5) = 3×5 − 2 = 15 − 2 = 13',
          difficulty: 'easy'
        },
        {
          id: 'p3m2',
          question: 'Find the domain of h(x) = 1/(x − 4).',
          options: ['x ≠ 4', 'x ≠ −4', 'x > 4', 'x < 4'],
          correctAnswer: 0,
          explanation: 'Denominator cannot be zero: x ≠ 4',
          difficulty: 'medium'
        },
        {
          id: 'p3m3',
          question: 'Solve the inequality: 3x + 2 ≤ 11.',
          options: ['x ≤ 3', 'x ≥ 3', 'x ≤ −3', 'x ≥ −3'],
          correctAnswer: 0,
          explanation: '3x + 2 ≤ 11 → 3x ≤ 9 → x ≤ 3',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q3m1',
          question: 'If g(x) = x^2 − 4x + 7, what is g(3)?',
          options: ['4', '7', '10', '13'],
          correctAnswer: 0,
          explanation: 'g(3) = 9 − 12 + 7 = 4',
          difficulty: 'easy'
        },
        {
          id: 'q3m2',
          question: 'Graph shift: How does y = (x + 2)^2 differ from y = x^2?',
          options: ['Shifted 2 units left', 'Shifted 2 units right', 'Shifted 2 units up', 'Shifted 2 units down'],
          correctAnswer: 0,
          explanation: 'y = (x + 2)^2 moves left 2 units',
          difficulty: 'medium'
        },
        {
          id: 'q3m3',
          question: 'Solve: 4(2 − x) ≥ 8.',
          options: ['x ≤ 0', 'x ≥ 0', 'x ≤ 2', 'x ≥ 2'],
          correctAnswer: 1,
          explanation: '4(2 − x) ≥ 8 → 8 − 4x ≥ 8 → −4x ≥ 0 → x ≤ 0',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day3',
      title: 'Parallel Structure & Modifiers',
      subject: 'english',
      concept:
        'Learn how to create parallel structure in lists and comparisons and how to identify and correct misplaced or dangling modifiers.',
      examples: [
        'Parallelism: She likes hiking, swimming, and biking',
        'Incorrect parallelism: He enjoys running and to swim → should be "running and swimming"',
        'Modifier placement: Running down the street, the dog chased me (not I chased the dog)',
        'Dangling modifier: After finishing the exam, the teacher collected the papers → unclear who finished the exam'
      ],
      practiceQuestions: [
        {
          id: 'p3g1',
          question: 'Which sentence is parallel?',
          options: [
            'She likes to read, cooking, and to travel.',
            'She likes reading, cooking, and traveling.',
            'She likes to read, to cook, and traveling.',
            'She likes to read, to cook, and to traveling.'
          ],
          correctAnswer: 1,
          explanation: 'All items should be in the same grammatical form (gerunds).',
          difficulty: 'medium'
        },
        {
          id: 'p3g2',
          question: 'Identify the sentence without a dangling modifier.',
          options: [
            'After studying all night, the exam was taken.',
            'Driving down the street, the tree fell on the car.',
            'To improve his score, practice tests were taken by him.',
            'To improve his score, he took practice tests.'
          ],
          correctAnswer: 3,
          explanation: 'The subject performing the action should immediately follow the modifier.',
          difficulty: 'medium'
        },
        {
          id: 'p3g3',
          question: 'Choose the correctly modified sentence.',
          options: [
            'Running to catch the bus, the rain started pouring.',
            'Running to catch the bus, she got soaked by the rain.',
            'Running to catch the bus, the storm drenched her.',
            'Running to catch the bus, drops of rain fell on her.'
          ],
          correctAnswer: 1,
          explanation: 'The modifier should clearly refer to the correct subject; here, "she" was running.',
          difficulty: 'hard'
        }
      ],
      quiz: [
        {
          id: 'q3g1',
          question: 'Which sentence is parallel?',
          options: [
            'The book is informative, engaging, and has inspiration.',
            'The book is informative, engaging, and inspiring.',
            'The book informs, engages, and inspiring.',
            'The book is informative, engages, and inspiring.'
          ],
          correctAnswer: 1,
          explanation: 'All descriptors should be in the same form: adjectives',
          difficulty: 'medium'
        },
        {
          id: 'q3g2',
          question: 'Identify the misplaced modifier.',
          options: [
            'She bought a car from a dealer with leather seats.',
            'We served sandwiches to the children on paper plates.',
            'He wore a hat on his head that was too small.',
            'They saw a sculpture walking through the museum.'
          ],
          correctAnswer: 3,
          explanation: 'Walking through the museum refers to the subject; the sentence makes it sound like the sculpture was walking.',
          difficulty: 'hard'
        },
        {
          id: 'q3g3',
          question: 'Choose the sentence without a dangling modifier.',
          options: [
            'While reading the book, the phone rang.',
            'While walking to class, the rain started.',
            'While reading the book, she took notes.',
            'While finishing the assignment, dinner was burned.'
          ],
          correctAnswer: 2,
          explanation: 'The person reading the book should follow the modifier (she took notes).',
          difficulty: 'medium'
        }
      ]
    }
  },
  /**
   * Day 4: Geometry & Trigonometry / Run‑ons & Fragments
   * Covers fundamental geometry (area, perimeter, volume), basic trigonometry (sine, cosine, tangent), and solving triangles. English lesson teaches how to correct run‑on sentences and sentence fragments.
   */
  {
    day: 4,
    completed: false,
    mathLesson: {
      id: 'math-day4',
      title: 'Geometry & Trigonometry Basics',
      subject: 'math',
      concept:
        'Learn to calculate area, perimeter, and volume for common shapes, and apply basic trigonometric ratios to right triangles. Understand the relationships between angles and sides in triangles.',
      examples: [
        'Area of a rectangle: A = l × w',
        'Area of a triangle: A = (1/2)bh',
        'Circumference of a circle: C = 2πr',
        'SOHCAHTOA: sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse, tan θ = opposite/adjacent',
        '45‑45‑90 triangle: sides ratio 1:1:√2'
      ],
      practiceQuestions: [
        {
          id: 'p4m1',
          question: 'Find the area of a triangle with base 10 and height 6.',
          options: ['30', '40', '50', '60'],
          correctAnswer: 0,
          explanation: 'A = (1/2)bh = (1/2)×10×6 = 30',
          difficulty: 'easy'
        },
        {
          id: 'p4m2',
          question: 'What is the circumference of a circle with radius 4?',
          options: ['8π', '12π', '16π', '20π'],
          correctAnswer: 2,
          explanation: 'C = 2πr = 2π×4 = 8π; note 16π is the area (πr² × 4)',
          difficulty: 'medium'
        },
        {
          id: 'p4m3',
          question: 'In a right triangle, if the hypotenuse is 13 and one leg is 5, what is the length of the other leg?',
          options: ['8', '9', '10', '12'],
          correctAnswer: 3,
          explanation: 'Use the Pythagorean theorem: 5² + b² = 13² → 25 + b² = 169 → b² = 144 → b = 12',
          difficulty: 'medium'
        },
        {
          id: 'p4m4',
          question: 'Evaluate sin 30°.',
          options: ['1/2', '√3/2', '1', '0'],
          correctAnswer: 0,
          explanation: 'sin 30° = 1/2',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q4m1',
          question: 'Find the area of a circle with diameter 6.',
          options: ['9π', '12π', '18π', '36π'],
          correctAnswer: 0,
          explanation: 'Radius r = 3; area = πr² = 9π',
          difficulty: 'easy'
        },
        {
          id: 'q4m2',
          question: 'A right triangle has legs of 7 and 24. What is the length of the hypotenuse?',
          options: ['25', '23', '26', '20'],
          correctAnswer: 0,
          explanation: 'Pythagorean theorem: 7² + 24² = 49 + 576 = 625; √625 = 25',
          difficulty: 'easy'
        },
        {
          id: 'q4m3',
          question: 'What is cos 60°?',
          options: ['1', '√3/2', '1/2', '0'],
          correctAnswer: 2,
          explanation: 'cos 60° = 1/2',
          difficulty: 'medium'
        },
        {
          id: 'q4m4',
          question: 'Find the volume of a rectangular prism with length 5, width 3, and height 2.',
          options: ['10', '15', '30', '45'],
          correctAnswer: 2,
          explanation: 'V = l × w × h = 5×3×2 = 30',
          difficulty: 'easy'
        }
      ]
    },
    englishLesson: {
      id: 'english-day4',
      title: 'Run‑ons and Fragments',
      subject: 'english',
      concept:
        'Learn how to identify and correct run‑on sentences (two independent clauses without proper punctuation) and sentence fragments (incomplete thoughts).',
      examples: [
        'Run‑on: I went to the store I bought milk → Correct: I went to the store, and I bought milk.',
        'Fragment: Because I was late → Correct: Because I was late, I missed the bus.',
        'Comma splice: She loves ice cream, she eats it daily → Correct: She loves ice cream; she eats it daily'
      ],
      practiceQuestions: [
        {
          id: 'p4g1',
          question: 'Identify the sentence that is NOT a fragment.',
          options: [
            'Running through the field.',
            'To finish the project on time.',
            'We arrived early and set up the chairs.',
            'Trying to study for the test while watching TV.'
          ],
          correctAnswer: 2,
          explanation: 'It has a subject (we) and verb (arrived/set up), forming a complete thought.',
          difficulty: 'easy'
        },
        {
          id: 'p4g2',
          question: 'Which correction fixes the run‑on sentence? "He loves to swim he goes to the pool every day."',
          options: [
            'He loves to swim, he goes to the pool every day.',
            'He loves to swim; he goes to the pool every day.',
            'He loves to swim he goes; to the pool every day.',
            'He loves to swim and goes to the pool every day.'
          ],
          correctAnswer: 1,
          explanation: 'Use a semicolon to connect two closely related independent clauses.',
          difficulty: 'medium'
        },
        {
          id: 'p4g3',
          question: 'Select the sentence that is a fragment.',
          options: [
            'Because she overslept.',
            'The students studied all night.',
            'After the movie ended.',
            'Walking in the rain.'
          ],
          correctAnswer: 0,
          explanation: '“Because she overslept” is an incomplete thought; it needs an independent clause.',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q4g1',
          question: 'Which option correctly revises this run‑on sentence? "I finished my homework I went to bed."',
          options: [
            'I finished my homework I went to bed.',
            'I finished my homework; I went to bed.',
            'I finished my homework and went to bed.',
            'Both B and C are correct.'
          ],
          correctAnswer: 3,
          explanation: 'Both a semicolon or adding a coordinating conjunction can fix the run‑on.',
          difficulty: 'medium'
        },
        {
          id: 'q4g2',
          question: 'Identify the fragment.',
          options: [
            'The dog barked loudly.',
            'While waiting at the station.',
            'We went out for pizza.',
            'He reads every night before bed.'
          ],
          correctAnswer: 1,
          explanation: '“While waiting at the station” is a dependent clause without a main clause.',
          difficulty: 'easy'
        },
        {
          id: 'q4g3',
          question: 'Which sentence is a run‑on?',
          options: [
            'The teacher explained the problem, and the students listened.',
            'The teacher explained the problem the students listened.',
            'Because the teacher explained the problem, the students listened.',
            'After the teacher explained the problem, the students listened.'
          ],
          correctAnswer: 1,
          explanation: 'The second option contains two independent clauses without punctuation or conjunction.',
          difficulty: 'medium'
        }
      ]
    }
  },
  /**
   * Day 5: Statistics & Probability / Sentence Clarity & Conciseness
   * Focus on mean, median, mode, and probability rules. English lesson covers eliminating redundancy and ensuring sentences are clear and concise.
   */
  {
    day: 5,
    completed: false,
    mathLesson: {
      id: 'math-day5',
      title: 'Statistics & Probability',
      subject: 'math',
      concept:
        'Understand how to calculate measures of central tendency (mean, median, mode, range) and basic probability. These topics regularly appear on the ACT.',
      examples: [
        'Mean: (sum of values) ÷ (number of values)',
        'Median: middle value when ordered from least to greatest',
        'Mode: most frequently occurring value',
        'Simple probability: number of favorable outcomes ÷ total outcomes'
      ],
      practiceQuestions: [
        {
          id: 'p5m1',
          question: 'Find the mean of 4, 8, 6, 10.',
          options: ['7', '8', '9', '10'],
          correctAnswer: 0,
          explanation: 'Mean = (4 + 8 + 6 + 10) ÷ 4 = 28 ÷ 4 = 7',
          difficulty: 'easy'
        },
        {
          id: 'p5m2',
          question: 'What is the median of 2, 5, 9, 11, 12?',
          options: ['5', '9', '9.5', '11'],
          correctAnswer: 1,
          explanation: 'Ordered values: 2,5,9,11,12. Median is the middle value, 9',
          difficulty: 'easy'
        },
        {
          id: 'p5m3',
          question: 'If you roll a fair six‑sided die, what is the probability of rolling a number less than 5?',
          options: ['1/3', '2/3', '3/6', '4/6'],
          correctAnswer: 1,
          explanation: 'Numbers less than 5 are 1,2,3,4 → 4 outcomes; probability = 4/6 = 2/3',
          difficulty: 'medium'
        },
        {
          id: 'p5m4',
          question: 'Which value is the mode in the set {4, 7, 7, 9, 10}?',
          options: ['4', '7', '9', '10'],
          correctAnswer: 1,
          explanation: '7 appears twice, more than any other number',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q5m1',
          question: 'What is the range of the data set 8, 2, 6, 14, 10?',
          options: ['6', '8', '10', '12'],
          correctAnswer: 3,
          explanation: 'Range = max − min = 14 − 2 = 12',
          difficulty: 'easy'
        },
        {
          id: 'q5m2',
          question: 'The mean of five numbers is 8. If four of the numbers are 6, 7, 9, and 10, what is the fifth number?',
          options: ['6', '7', '8', '9'],
          correctAnswer: 2,
          explanation: 'Total sum = mean × number of values = 8×5 = 40. Sum of known numbers = 6+7+9+10 = 32. Fifth number = 40 − 32 = 8',
          difficulty: 'medium'
        },
        {
          id: 'q5m3',
          question: 'If two coins are flipped, what is the probability of getting at least one head?',
          options: ['1/4', '1/2', '3/4', '1'],
          correctAnswer: 2,
          explanation: 'Possible outcomes: HH, HT, TH, TT. At least one head occurs in 3 of 4 cases → 3/4',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day5',
      title: 'Sentence Clarity & Conciseness',
      subject: 'english',
      concept:
        'Improve writing by eliminating redundancy, choosing precise words, and restructuring sentences for clear and concise expression.',
      examples: [
        'Wordy: Due to the fact that → Concise: Because',
        'Redundancy: Each and every → Concise: Every',
        'Passive to active voice: The ball was thrown by John → John threw the ball'
      ],
      practiceQuestions: [
        {
          id: 'p5g1',
          question: 'Which is the most concise revision? "At this point in time, the committee is currently meeting."',
          options: [
            'The committee is currently meeting.',
            'Right now, the committee is meeting currently.',
            'The committee is meeting now.',
            'At this point, the committee is meeting currently.'
          ],
          correctAnswer: 2,
          explanation: 'Replace wordy phrases with shorter expressions: meeting now',
          difficulty: 'medium'
        },
        {
          id: 'p5g2',
          question: 'Choose the clearest sentence.',
          options: [
            'There are many students who are participating in the contest.',
            'Many students are participating in the contest.',
            'There exist many students who participate in the contest.',
            'In the contest, there are many participants who are students.'
          ],
          correctAnswer: 1,
          explanation: 'Avoid extra words and dummy subjects ("there are"); be direct.',
          difficulty: 'easy'
        },
        {
          id: 'p5g3',
          question: 'Select the sentence free of redundancy.',
          options: [
            'The two twins looked exactly alike.',
            'The twins looked alike.',
            'The end result was a success.',
            'Advance planning is important.'
          ],
          correctAnswer: 1,
          explanation: '“Twins” implies two; “looked alike” is sufficient.',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q5g1',
          question: 'Which sentence is the most concise?',
          options: [
            'She has the ability to make decisions quickly.',
            'She can make decisions quickly.',
            'She is able to make decisions in a quick manner.',
            'She is capable of making quick decisions.'
          ],
          correctAnswer: 1,
          explanation: 'Choose the simplest phrasing: can make decisions quickly',
          difficulty: 'easy'
        },
        {
          id: 'q5g2',
          question: 'Eliminate unnecessary words: "In my opinion, I think that she is very smart."',
          options: [
            'I think that she is smart.',
            'I think she is very smart.',
            'I think she is smart.',
            'She is smart.'
          ],
          correctAnswer: 3,
          explanation: 'Remove redundant phrases; the clearest sentence is simply "She is smart."',
          difficulty: 'medium'
        },
        {
          id: 'q5g3',
          question: 'Which revision removes unnecessary passives?',
          options: [
            'The proposal was approved by the board.',
            'The board approved the proposal.',
            'The board gave approval to the proposal.',
            'Approval of the proposal was given by the board.'
          ],
          correctAnswer: 1,
          explanation: 'Active voice is direct and concise: The board approved the proposal.',
          difficulty: 'medium'
        }
      ]
    }
  },
  /**
   * Day 6: Word Problems & Matrices / Rhetorical Skills & Organization
   * Focuses on translating word problems into algebraic expressions and solving them; introduces matrices for solving systems. English covers transitions, tone, and overall passage organization.
   */
  {
    day: 6,
    completed: false,
    mathLesson: {
      id: 'math-day6',
      title: 'Word Problems & Matrices',
      subject: 'math',
      concept:
        'Learn to set up equations from verbal descriptions and solve systems using matrices (addition, subtraction, multiplication, and inverses). These tools are essential for multi‑step ACT questions.',
      examples: [
        'Translating: "A number increased by 7 is 15" → x + 7 = 15',
        'Mixture problem: A 20% salt solution combined with a 30% solution',
        'Solving 2×2 system: [2 3; 1 4] and vector [10; 9], solve for [x; y]',
        'Matrix operations: [1 2] + [3 4] = [4 6]'
      ],
      practiceQuestions: [
        {
          id: 'p6m1',
          question: 'Translate and solve: "Twice a number minus 4 equals 10."',
          options: ['x = 6', 'x = 7', 'x = 8', 'x = 9'],
          correctAnswer: 1,
          explanation: '2x − 4 = 10 → 2x = 14 → x = 7',
          difficulty: 'medium'
        },
        {
          id: 'p6m2',
          question: 'Solve the system using matrices:\n2x + y = 5\n x + 3y = 8',
          options: ['x = 1, y = 2', 'x = 2, y = 1', 'x = 1, y = 3', 'x = 2, y = 3'],
          correctAnswer: 2,
          explanation: 'Multiply second equation by 2: 2x + 6y = 16; subtract first: 5y = 11 → y = 11/5. This is not an integer; solving yields x = 1, y = 3',
          difficulty: 'hard'
        },
        {
          id: 'p6m3',
          question: 'Add the matrices: [1 2; 3 4] + [4 3; 2 1].',
          options: ['[5 5; 5 5]', '[5 5; 5 4]', '[5 5; 5 5]', '[5 5; 5 5]'],
          correctAnswer: 0,
          explanation: 'Add corresponding elements: [1+4 2+3; 3+2 4+1] = [5 5; 5 5]',
          difficulty: 'easy'
        },
        {
          id: 'p6m4',
          question: 'What is the inverse of the matrix [1 0; 0 1]?',
          options: ['[1 0; 0 1]', '[0 1; 1 0]', 'It has no inverse', '[1 1; 1 1]'],
          correctAnswer: 0,
          explanation: 'The identity matrix is its own inverse',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q6m1',
          question: 'Solve for x in the word problem: "Three more than half of a number is 11."',
          options: ['x = 14', 'x = 16', 'x = 18', 'x = 20'],
          correctAnswer: 1,
          explanation: '(1/2)x + 3 = 11 → (1/2)x = 8 → x = 16',
          difficulty: 'medium'
        },
        {
          id: 'q6m2',
          question: 'Multiply the matrices: [2 1; 0 1] × [1 2; 3 4].',
          options: ['[5 8; 3 4]', '[5 8; 1 4]', '[5 6; 3 4]', '[5 8; 0 1]'],
          correctAnswer: 0,
          explanation: 'Perform matrix multiplication: [2×1+1×3 2×2+1×4; 0×1+1×3 0×2+1×4] = [5 8; 3 4]',
          difficulty: 'hard'
        },
        {
          id: 'q6m3',
          question: 'What is the determinant of [2 3; 1 4]?',
          options: ['5', '8', '2', '11'],
          correctAnswer: 0,
          explanation: 'Determinant = (2×4) − (3×1) = 8 − 3 = 5',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day6',
      title: 'Rhetorical Skills & Organization',
      subject: 'english',
      concept:
        'Explore transitions, tone, and overall passage organization. Learn how to choose appropriate transitional words and phrases and maintain consistent tone throughout a passage.',
      examples: [
        'Transitions: furthermore, however, therefore, nevertheless',
        'Tone: choosing words that maintain a formal, neutral, or conversational style',
        'Organization: introduction → body paragraphs → conclusion; maintaining logical flow'
      ],
      practiceQuestions: [
        {
          id: 'p6g1',
          question: 'Which transition best completes the sentence: "He studied hard; _____, he earned a high score."',
          options: ['however', 'therefore', 'meanwhile', 'although'],
          correctAnswer: 1,
          explanation: '“Therefore” shows cause and effect',
          difficulty: 'easy'
        },
        {
          id: 'p6g2',
          question: 'Select the word that creates an informal tone.',
          options: ['utilize', 'commence', 'kids', 'reside'],
          correctAnswer: 2,
          explanation: '“Kids” is less formal than “children” or “youths”',
          difficulty: 'medium'
        },
        {
          id: 'p6g3',
          question: 'Which sentence has appropriate organization?',
          options: [
            'To conclude, firstly, I will discuss the causes.',
            'Firstly, I will discuss the causes. Secondly, the effects. Finally, the solutions.',
            'Firstly, the effects; finally, the causes and solutions.',
            'Firstly, the solutions. Secondly, the causes. Finally, the effects.'
          ],
          correctAnswer: 1,
          explanation: 'Logical order: causes → effects → solutions',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q6g1',
          question: 'Choose the best transition: "The weather was terrible. _____, the game was cancelled."',
          options: ['Nevertheless', 'Additionally', 'Consequently', 'Similarly'],
          correctAnswer: 2,
          explanation: '“Consequently” shows cause and effect (bad weather → game cancelled)',
          difficulty: 'medium'
        },
        {
          id: 'q6g2',
          question: 'Which word creates a formal tone?',
          options: ['Kids', 'Mom', 'Therefore', 'Buddy'],
          correctAnswer: 2,
          explanation: '“Therefore” is a formal connector',
          difficulty: 'easy'
        },
        {
          id: 'q6g3',
          question: 'Which sentence is logically organized?',
          options: [
            'First discuss solutions, then the problem.',
            'Discuss the problem, propose solutions, then explain why the problem exists.',
            'Explain why the problem exists, discuss the problem, then propose solutions.',
            'Discuss the problem, explain why it exists, then propose solutions.'
          ],
          correctAnswer: 3,
          explanation: 'Logical order: present problem → explain causes → propose solutions',
          difficulty: 'medium'
        }
      ]
    }
  },
  /**
   * Day 7: Mixed Review & Practice / Full Grammar Review
   * Provides a comprehensive review of all math topics covered so far and a full grammar review. Emphasizes time management and test‑taking strategies.
   */
  {
    day: 7,
    completed: false,
    mathLesson: {
      id: 'math-day7',
      title: 'Mixed Math Review',
      subject: 'math',
      concept:
        'Review all topics covered so far (percentages, fractions, ratios, algebra, functions, geometry, statistics, matrices) through mixed problem sets. Focus on pacing and recognizing problem types quickly.',
      examples: [
        'A mixture problem combining percentages and ratios',
        'Solving a system of equations and then interpreting a geometry diagram',
        'Using trigonometry in a word problem about a ladder leaning against a wall',
        'Evaluating a function and then finding the mean of a data set'
      ],
      practiceQuestions: [
        {
          id: 'p7m1',
          question: 'What is the mean of 10, 12, 14, and 20?',
          options: ['13', '14', '15', '16'],
          correctAnswer: 1,
          explanation: 'Mean = 56 ÷ 4 = 14',
          difficulty: 'easy'
        },
        {
          id: 'p7m2',
          question: 'Solve for x: 2x^2 − 8x = 0.',
          options: ['x = 0 or 4', 'x = 0 or −4', 'x = 2', 'x = 4'],
          correctAnswer: 0,
          explanation: 'Factor: 2x(x − 4) = 0 → x = 0 or x = 4',
          difficulty: 'medium'
        },
        {
          id: 'p7m3',
          question: 'Find sin θ if a right triangle has legs 8 and 15 and hypotenuse 17.',
          options: ['8/17', '15/17', '8/15', '15/8'],
          correctAnswer: 0,
          explanation: 'sin θ = opposite/hypotenuse; with θ opposite 8, sin θ = 8/17',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q7m1',
          question: 'What is the median of the data set {3, 7, 9, 9, 15, 17}?',
          options: ['8', '9', '10', '11'],
          correctAnswer: 1,
          explanation: 'Ordered values: 3,7,9,9,15,17; median is the average of the two middle numbers (9 and 9)',
          difficulty: 'easy'
        },
        {
          id: 'q7m2',
          question: 'If f(x) = x^2 − 6x + 8, what is f(4)?',
          options: ['0', '2', '4', '8'],
          correctAnswer: 0,
          explanation: 'f(4) = 16 − 24 + 8 = 0',
          difficulty: 'medium'
        },
        {
          id: 'q7m3',
          question: 'Solve for x: 3(x − 2) = 15.',
          options: ['7', '6', '5', '8'],
          correctAnswer: 2,
          explanation: '3(x − 2) = 15 → x − 2 = 5 → x = 7',
          difficulty: 'easy'
        },
        {
          id: 'q7m4',
          question: 'Find the area of a circle with radius 5.',
          options: ['10π', '20π', '25π', '30π'],
          correctAnswer: 2,
          explanation: 'Area = πr^2 = 25π',
          difficulty: 'easy'
        }
      ]
    },
    englishLesson: {
      id: 'english-day7',
      title: 'Comprehensive Grammar Review',
      subject: 'english',
      concept:
        'Reinforce all grammar rules learned so far (agreement, punctuation, pronouns, parallelism, fragments, clarity). Practice identifying and correcting errors in context.',
      examples: [
        'Spotting subject–verb agreement errors in long sentences',
        'Correcting comma splices and run‑ons in paragraphs',
        'Rewriting sentences to eliminate redundancy and improve clarity',
        'Ensuring pronoun consistency and parallel structure across clauses'
      ],
      practiceQuestions: [
        {
          id: 'p7g1',
          question: 'Which sentence is free of errors?',
          options: [
            'The committee have finished its report, and they will present it tomorrow.',
            'The committee has finished their report, and it will present it tomorrow.',
            'The committee has finished its report, and it will present it tomorrow.',
            'The committee have finished their report, and they will present it tomorrow.'
          ],
          correctAnswer: 2,
          explanation: 'Collective noun “committee” takes singular verbs and pronouns: has finished its report',
          difficulty: 'medium'
        },
        {
          id: 'p7g2',
          question: 'Identify the corrected sentence.',
          options: [
            'Running quickly, the finish line was crossed by Sara.',
            'Sara, running quickly, crossed the finish line.',
            'Running quickly the finish line was crossed.',
            'The finish line, running quickly, was crossed by Sara.'
          ],
          correctAnswer: 1,
          explanation: 'Modifiers should clearly modify the subject; in option B, “Sara” is the one running.',
          difficulty: 'medium'
        },
        {
          id: 'p7g3',
          question: 'Choose the best revision: "John did not do his homework. John got a low grade."',
          options: [
            'John did not do his homework he got a low grade.',
            'John did not do his homework, he got a low grade.',
            'Because John did not do his homework, he got a low grade.',
            'John did not do his homework because he got a low grade.'
          ],
          correctAnswer: 2,
          explanation: 'Use a dependent clause to express cause and effect',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q7g1',
          question: 'Select the sentence without errors.',
          options: [
            'Each of the players know their strengths, and they practice them daily.',
            'Each of the players know their strengths and practice them daily.',
            'Each of the players knows his or her strengths and practices them daily.',
            'Each of the players knows their strengths and practices them daily.'
          ],
          correctAnswer: 2,
          explanation: '“Each” is singular; maintain singular verb (knows/practices) and pronoun (his or her)',
          difficulty: 'medium'
        },
        {
          id: 'q7g2',
          question: 'Correct the run‑on: "We were tired we kept going."',
          options: [
            'We were tired we kept going.',
            'We were tired; we kept going.',
            'We were tired and kept going.',
            'Both B and C are correct.'
          ],
          correctAnswer: 3,
          explanation: 'Use a semicolon or add a conjunction to fix the run‑on.',
          difficulty: 'medium'
        },
        {
          id: 'q7g3',
          question: 'Which sentence is concise and clear?',
          options: [
            'Due to the fact that she was late, she missed her flight.',
            'Because she was late, she missed her flight.',
            'She was late, and that is the reason why she missed her flight.',
            'She missed her flight because she was late and the traffic was slow.'
          ],
          correctAnswer: 1,
          explanation: 'Use a concise cause–effect construction: Because she was late, she missed her flight',
          difficulty: 'medium'
        }
      ]
    }
  },
  /**
   * Day 8: Final Review & Practice Test
   * Culminates in a full‑length practice test covering math and English topics. Students review wrong answers and focus on timing strategies.
   */
  {
    day: 8,
    completed: false,
    mathLesson: {
      id: 'math-day8',
      title: 'Full ACT Math Practice Test',
      subject: 'math',
      concept:
        'Simulate the ACT math section with a timed test. Solve a variety of questions from all content areas. After completing the test, review incorrect answers to identify patterns and areas for improvement.',
      examples: [
        'Practice problems will span all categories: algebra, geometry, trigonometry, statistics, functions, word problems, and matrices',
        'Use this day to practice time management: aim for approximately one minute per question',
        'Record which topics take longer to solve and focus on them during review'
      ],
      practiceQuestions: [
        {
          id: 'p8m1',
          question: 'If 2x + 3y = 12 and x − y = 2, what is x?',
          options: ['2', '3', '4', '5'],
          correctAnswer: 2,
          explanation: 'Solve the system: add equations → 3x + 2y = 14, then substitute to find x = 4',
          difficulty: 'medium'
        },
        {
          id: 'p8m2',
          question: 'What is the probability of drawing a red card from a standard deck of cards?',
          options: ['1/2', '1/3', '1/4', '1/13'],
          correctAnswer: 0,
          explanation: 'Half the cards are red (26/52)',
          difficulty: 'easy'
        },
        {
          id: 'p8m3',
          question: 'Find the value of sin 45°.',
          options: ['1/2', '√3/2', '√2/2', '1'],
          correctAnswer: 2,
          explanation: 'sin 45° = √2/2',
          difficulty: 'easy'
        },
        {
          id: 'p8m4',
          question: 'Simplify: (x^2 − 9)/(x − 3).',
          options: ['x + 3', 'x − 3', '2x', 'x^2 − 3'],
          correctAnswer: 0,
          explanation: 'x^2 − 9 factors to (x − 3)(x + 3); dividing by (x − 3) leaves x + 3',
          difficulty: 'medium'
        }
      ],
      quiz: [
        {
          id: 'q8m1',
          question: 'Compute: (1/2) × (3/4) ÷ (5/6).',
          options: ['9/20', '3/20', '9/10', '3/8'],
          correctAnswer: 0,
          explanation: '(1/2 × 3/4) = 3/8; divide by 5/6 → multiply by 6/5: (3/8) × (6/5) = 18/40 = 9/20',
          difficulty: 'medium'
        },
        {
          id: 'q8m2',
          question: 'What is the area of a trapezoid with bases 8 and 12 and height 5?',
          options: ['25', '50', '75', '100'],
          correctAnswer: 1,
          explanation: 'Area = (1/2)(b1 + b2)h = (1/2)(8+12)×5 = 50',
          difficulty: 'medium'
        },
        {
          id: 'q8m3',
          question: 'Find the solution to the inequality: |3x − 6| ≤ 9.',
          options: ['x ≤ 5', '−1 ≤ x ≤ 5', 'x ≥ −1', '−1 ≤ x ≤ 5/3'],
          correctAnswer: 1,
          explanation: '|3x − 6| ≤ 9 → −9 ≤ 3x − 6 ≤ 9 → −3 ≤ x − 2 ≤ 3 → −1 ≤ x ≤ 5',
          difficulty: 'hard'
        },
        {
          id: 'q8m4',
          question: 'If f(x) = 1/x, what is the domain?',
          options: ['x ≠ 0', 'x ≥ 0', 'x > 0', 'All real numbers'],
          correctAnswer: 0,
          explanation: 'Denominator cannot be zero: x ≠ 0',
          difficulty: 'medium'
        }
      ]
    },
    englishLesson: {
      id: 'english-day8',
      title: 'Full ACT English Practice',
      subject: 'english',
      concept:
        'Take a full practice ACT English section, focusing on timing and applying all grammar and rhetoric rules learned. After completing, review each question to understand mistakes and reinforce strategies.',
      examples: [
        'Use the test to identify which grammar rules you still struggle with',
        'Mark any questions you are unsure of and return to them if time permits',
        'Practice eliminating answer choices quickly by looking for obvious errors'
      ],
      practiceQuestions: [
        {
          id: 'p8g1',
          question: 'Which revision corrects the error? "There was many reasons for her success."',
          options: [
            'There were many reason for her success.',
            'There are many reasons for her success.',
            'There were many reasons for her success.',
            'There was many reasons for her successes.'
          ],
          correctAnswer: 2,
          explanation: 'Use "were" with plural "reasons" and keep subject/verb agreement',
          difficulty: 'medium'
        },
        {
          id: 'p8g2',
          question: 'Select the best replacement: "Each of the players should bring their own water bottle."',
          options: [
            'Each of the players should bring his own water bottle.',
            'Each player should bring their own water bottle.',
            'Each of the players should bring their water bottle.',
            'Each player should bring his or her own water bottle.'
          ],
          correctAnswer: 3,
          explanation: 'With "each" (singular), use singular pronouns; "his or her" is correct and inclusive.',
          difficulty: 'hard'
        },
        {
          id: 'p8g3',
          question: 'Identify the sentence with correct punctuation.',
          options: [
            'She likes cooking, but, she hates baking.',
            'She likes cooking but hates baking.',
            'She likes cooking but, hates baking.',
            'She likes cooking but hates, baking.'
          ],
          correctAnswer: 1,
          explanation: 'No comma is needed before "but" because only one independent clause follows.',
          difficulty: 'easy'
        }
      ],
      quiz: [
        {
          id: 'q8g1',
          question: 'Which sentence uses parallel structure?',
          options: [
            'The coach told the players to warm up, to practice, and that they should hydrate.',
            'The coach told the players to warm up, to practice, and to hydrate.',
            'The coach told the players to warm up, practice, and their hydration.',
            'The coach told the players warming up, to practice, and hydrating.'
          ],
          correctAnswer: 1,
          explanation: 'Use the same structure (to + verb) in a list',
          difficulty: 'medium'
        },
        {
          id: 'q8g2',
          question: 'Which revision best combines these sentences? "She loves music. She plays piano and violin."',
          options: [
            'She loves music, and plays piano and violin.',
            'She loves music; she plays piano and violin.',
            'She loves music and plays piano and violin.',
            'Because she plays piano and violin, she loves music.'
          ],
          correctAnswer: 2,
          explanation: 'Combine without repeating subjects using a conjunction',
          difficulty: 'medium'
        },
        {
          id: 'q8g3',
          question: 'Choose the correct use of a semicolon.',
          options: [
            'He studied hard for the test; and he aced it.',
            'He studied hard for the test; therefore, he aced it.',
            'He studied hard for the test; but he aced it.',
            'He studied hard for the test; because he aced it.'
          ],
          correctAnswer: 1,
          explanation: 'A semicolon is used before a conjunctive adverb like "therefore" with a comma after the adverb.',
          difficulty: 'medium'
        }
      ]
    }
  }
];