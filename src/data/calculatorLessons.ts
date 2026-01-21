export type CalculatorModel = 'TI-84' | 'Desmos';

export interface InteractiveStep {
  instruction: string;
  buttonId: string;
  screenDisplay: string;
  hint?: string;
}

export interface ChallengeMode {
  manualProblem: string;
  calculatorProblem: string;
  expectedManualTime: number;
  expectedCalcTime: number;
}

export interface CalculatorLesson {
  id: string;
  title: string;
  model: CalculatorModel[];
  description: string;
  timeSaved: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoId?: string;
  steps: string[];
  whenToUse: string;
  practiceProblems?: {
    problem: string;
    hint: string;
  }[];
  interactiveSteps?: InteractiveStep[];
  challengeMode?: ChallengeMode;
}

export const calculatorLessons: CalculatorLesson[] = [
  {
    id: 'matrices-systems',
    title: 'Skip the Algebra: Solve Systems Without Substitution',
    model: ['TI-84'],
    description: 'Got 2 equations with 2 variables? Don\'t solve them. Let rref() do it in 10 seconds.',
    timeSaved: '~2 minutes per problem',
    difficulty: 'intermediate',
    videoId: 'zhypLK9nK80',
    whenToUse: 'Any problem asking you to solve 2 or 3 equations with 2 or 3 variables',
    steps: [
      'Press [2nd] then [x⁻¹] to access MATRIX menu',
      'Arrow right to EDIT, select [1]',
      'Enter dimensions (e.g., 2×3 for 2 equations, 2 variables)',
      'Enter the augmented matrix coefficients',
      'Press [2nd] [MODE] to quit',
      'Press [2nd] [x⁻¹], arrow to MATH, select rref(',
      'Press [2nd] [x⁻¹], select [1], close parentheses',
      'Press [ENTER] - solutions appear in the last column'
    ],
    practiceProblems: [
      {
        problem: 'Solve: 2x + 3y = 12, x - y = 4',
        hint: 'Matrix should be [[2,3,12], [1,-1,4]]'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press 2nd to access secondary functions',
        buttonId: '2nd',
        screenDisplay: '2nd active'
      },
      {
        instruction: 'Press x⁻¹ (which is APPS) to access MATRIX menu',
        buttonId: 'apps',
        screenDisplay: 'MATRIX [A] [B] [C]'
      },
      {
        instruction: 'Press right arrow to go to EDIT',
        buttonId: 'right',
        screenDisplay: 'EDIT [1]'
      },
      {
        instruction: 'Press ENTER to select matrix [A]',
        buttonId: 'enter',
        screenDisplay: 'MATRIX[A] 2x3'
      },
      {
        instruction: 'Enter 2 for rows',
        buttonId: '2',
        screenDisplay: '2',
        hint: 'Type the number of equations you have'
      },
      {
        instruction: 'Press ENTER, then enter 3 for columns',
        buttonId: '3',
        screenDisplay: '3',
        hint: '2 variables + 1 answer column = 3 columns'
      },
      {
        instruction: 'Press ENTER and enter the matrix values, then 2nd + MODE to quit',
        buttonId: 'mode',
        screenDisplay: 'Matrix entered',
        hint: 'Enter all coefficients and constants'
      },
      {
        instruction: 'Press 2nd, then APPS for MATRIX',
        buttonId: 'apps',
        screenDisplay: 'MATRIX menu'
      },
      {
        instruction: 'Press right arrow twice to go to MATH',
        buttonId: 'right',
        screenDisplay: 'MATH rref('
      },
      {
        instruction: 'Press up arrow, then ENTER to select rref(',
        buttonId: 'enter',
        screenDisplay: 'rref('
      },
      {
        instruction: 'Press 2nd, then APPS, then ENTER to select [A]',
        buttonId: 'enter',
        screenDisplay: 'rref([A])'
      },
      {
        instruction: 'Close parentheses and press ENTER to see the solution',
        buttonId: 'enter',
        screenDisplay: '[[1 0 6][0 1 0]]',
        hint: 'Solution: x=6, y=0'
      }
    ],
    challengeMode: {
      manualProblem: 'Solve by elimination: 2x + 3y = 12, x - y = 4',
      calculatorProblem: 'Solve the same system using rref()',
      expectedManualTime: 180,
      expectedCalcTime: 45
    }
  },
  {
    id: 'polynomial-solver',
    title: 'Skip the Factoring: Find Roots Instantly',
    model: ['TI-84'],
    description: 'Why spend 2 minutes factoring when your calculator finds roots in seconds?',
    timeSaved: '~90 seconds per problem',
    difficulty: 'beginner',
    videoId: 'D9uwg8IQbfE',
    whenToUse: 'Finding x-intercepts, solving polynomial equations, factor questions',
    steps: [
      'Press [MATH], scroll down to Solver',
      'Select 0: Solver',
      'Enter your equation = 0 (e.g., X²-5X+6)',
      'Press [ENTER], provide a guess for X',
      'Press [ALPHA] [ENTER] to solve',
      'Repeat with different guess to find other roots'
    ],
    practiceProblems: [
      {
        problem: 'Find the roots of x² - 7x + 12 = 0',
        hint: 'Enter as X²-7X+12, try X=0 as first guess, then X=10 for second root'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press MATH to open the math menu',
        buttonId: 'MATH',
        screenDisplay: 'MATH NUM CPX',
        hint: 'MATH button is in the top row, left side'
      },
      {
        instruction: 'Press 0 to select Solver',
        buttonId: '0',
        screenDisplay: 'EQUATION SOLVER',
        hint: 'Type 0 on the number pad'
      },
      {
        instruction: 'Enter the equation: X² - 7X + 12',
        buttonId: 'X',
        screenDisplay: 'eqn:0=X²-7X+12',
        hint: 'Use X^2 for X², then -7X+12'
      },
      {
        instruction: 'Press ENTER, then enter initial guess (try 0)',
        buttonId: 'ENTER',
        screenDisplay: 'X=3',
        hint: 'After ENTER, type 0 for X guess, then press ALPHA+ENTER to solve'
      }
    ],
    challengeMode: {
      manualProblem: 'Factor and solve x² - 7x + 12 = 0 by hand',
      calculatorProblem: 'Solve x² - 7x + 12 = 0 using the Solver',
      expectedManualTime: 90,
      expectedCalcTime: 20
    }
  },
  {
    id: 'graph-intersect',
    title: 'Graph Both Sides: Skip Solving Equations',
    model: ['TI-84'],
    description: 'Graph the left side. Graph the right side. Read the intersection. Done.',
    timeSaved: '~2 minutes per problem',
    difficulty: 'beginner',
    videoId: '5SHu7YbVCRk',
    whenToUse: 'Finding where two functions are equal, optimization problems, break-even points',
    steps: [
      'Press [Y=]',
      'Enter both equations in Y1 and Y2',
      'Press [GRAPH]',
      'Press [2nd] [TRACE] for CALC menu',
      'Select 5: intersect',
      'Move cursor near intersection, press [ENTER] 3 times',
      'Read the X and Y coordinates'
    ],
    practiceProblems: [
      {
        problem: 'Solve: y = 2x + 1, y = -x + 7',
        hint: 'Enter first equation in Y1, second in Y2'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press Y= to enter equations',
        buttonId: 'y=',
        screenDisplay: 'Y1='
      },
      {
        instruction: 'Enter the first equation Y1=2X+1',
        buttonId: 'x-t-theta-n',
        screenDisplay: 'Y1=2X+1',
        hint: 'Use the X,T,θ,n button for X'
      },
      {
        instruction: 'Press down arrow to go to Y2',
        buttonId: 'down',
        screenDisplay: 'Y2='
      },
      {
        instruction: 'Enter the second equation Y2=-X+7',
        buttonId: 'x-t-theta-n',
        screenDisplay: 'Y2=-X+7',
        hint: 'Use (-) for negative'
      },
      {
        instruction: 'Press GRAPH to view both functions',
        buttonId: 'graph',
        screenDisplay: '[Graph showing intersection]'
      },
      {
        instruction: 'Press 2nd for secondary functions',
        buttonId: '2nd',
        screenDisplay: '2nd active'
      },
      {
        instruction: 'Press TRACE for CALC menu',
        buttonId: 'trace',
        screenDisplay: 'CALCULATE menu'
      },
      {
        instruction: 'Press 5 for intersect',
        buttonId: '5',
        screenDisplay: '5:intersect'
      },
      {
        instruction: 'Press ENTER for "First curve?"',
        buttonId: 'enter',
        screenDisplay: 'First curve?'
      },
      {
        instruction: 'Press ENTER again for "Second curve?"',
        buttonId: 'enter',
        screenDisplay: 'Second curve?'
      },
      {
        instruction: 'Press ENTER once more for "Guess?"',
        buttonId: 'enter',
        screenDisplay: 'Intersection: X=2, Y=5',
        hint: 'The solution is (2, 5)'
      }
    ],
    challengeMode: {
      manualProblem: 'Solve algebraically: y = 2x + 1, y = -x + 7',
      calculatorProblem: 'Find intersection using graph & intersect',
      expectedManualTime: 120,
      expectedCalcTime: 30
    }
  },
  {
    id: 'frac-conversion',
    title: 'Match the Answers: Decimal ↔ Fraction in 1 Click',
    model: ['TI-84'],
    description: 'Your answer is 0.625 but the choices are fractions? One button fixes that.',
    timeSaved: '~30 seconds per conversion',
    difficulty: 'beginner',
    videoId: 'CGngzXwFN3Q',
    whenToUse: 'Answer choices are fractions but your calculation gives decimal (or reverse)',
    steps: [
      'Enter your decimal or calculation',
      'Press [MATH]',
      'Select 1: ►Frac',
      'Press [ENTER]',
      'For reverse: enter fraction with division, press [ENTER]'
    ],
    practiceProblems: [
      {
        problem: 'Convert 0.625 to a fraction',
        hint: 'Enter 0.625, then press MATH → 1:►Frac → ENTER'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Enter the decimal 0.625 using the number pad',
        buttonId: '0',
        screenDisplay: '0.625',
        hint: 'Press 0, then ., then 6, 2, 5'
      },
      {
        instruction: 'Press MATH to access mathematical functions',
        buttonId: 'MATH',
        screenDisplay: 'MATH menu',
        hint: 'The MATH button is in the top row'
      },
      {
        instruction: 'The cursor should be on "1:►Frac". Press ENTER',
        buttonId: 'ENTER',
        screenDisplay: '5/8',
        hint: 'Just press ENTER - ►Frac is already highlighted'
      }
    ],
    challengeMode: {
      manualProblem: 'Convert 0.625 to a fraction by hand (find GCD and simplify)',
      calculatorProblem: 'Convert 0.625 to a fraction using ►Frac',
      expectedManualTime: 45,
      expectedCalcTime: 10
    }
  },
  {
    id: 'stats-lists',
    title: 'Skip the Arithmetic: Stats Without Adding',
    model: ['TI-84'],
    description: 'Enter the numbers, press a button, read the mean. No adding. No dividing.',
    timeSaved: '~1 minute per problem',
    difficulty: 'beginner',
    videoId: 'fkEhAb3QFu8',
    whenToUse: 'Mean, median, mode, standard deviation, or any stats calculation',
    steps: [
      'Press [STAT], select 1: Edit',
      'Enter your numbers in L1 (one per row)',
      'Press [2nd] [MODE] to quit',
      'Press [STAT], arrow to CALC',
      'Select 1: 1-Var Stats',
      'Press [2nd] [1] for L1, press [ENTER]',
      'Read x̄ (mean), Med (median), σx (standard deviation)'
    ],
    practiceProblems: [
      {
        problem: 'Find mean & median of: 85, 90, 78, 92, 88',
        hint: 'Enter all values in L1, then use 1-Var Stats'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press STAT to access statistics menu',
        buttonId: 'stat',
        screenDisplay: 'EDIT CALC TESTS'
      },
      {
        instruction: 'Press ENTER to select 1:Edit',
        buttonId: 'enter',
        screenDisplay: 'L1    L2    L3'
      },
      {
        instruction: 'Enter first data value: 85',
        buttonId: '8',
        screenDisplay: 'L1(1)=85',
        hint: 'Type 8, then 5, then ENTER'
      },
      {
        instruction: 'Press ENTER and continue entering: 90, 78, 92, 88',
        buttonId: 'enter',
        screenDisplay: 'L1 filled',
        hint: 'Enter each value followed by ENTER'
      },
      {
        instruction: 'Press 2nd, then MODE to quit',
        buttonId: 'mode',
        screenDisplay: 'Exited to home'
      },
      {
        instruction: 'Press STAT again',
        buttonId: 'stat',
        screenDisplay: 'EDIT CALC TESTS'
      },
      {
        instruction: 'Press right arrow to go to CALC',
        buttonId: 'right',
        screenDisplay: 'CALC menu'
      },
      {
        instruction: 'Press ENTER for 1-Var Stats',
        buttonId: 'enter',
        screenDisplay: '1-Var Stats'
      },
      {
        instruction: 'Press 2nd, then 1 for L1',
        buttonId: '1',
        screenDisplay: 'L1',
        hint: '2nd then 1 gives you L1'
      },
      {
        instruction: 'Press ENTER to calculate statistics',
        buttonId: 'enter',
        screenDisplay: 'x̄=86.6 Med=88',
        hint: 'Mean is 86.6, Median is 88'
      }
    ],
    challengeMode: {
      manualProblem: 'Calculate mean & median of: 85, 90, 78, 92, 88',
      calculatorProblem: 'Find mean & median using 1-Var Stats',
      expectedManualTime: 90,
      expectedCalcTime: 25
    }
  },
  {
    id: 'quadratic-formula',
    title: 'Never Memorize the Quadratic Formula Again',
    model: ['TI-84'],
    description: 'A, B, C, done. Both roots appear. Why memorize when you can program?',
    timeSaved: '~45 seconds per problem',
    difficulty: 'advanced',
    videoId: 'oJa_PHe013s',
    whenToUse: 'Any quadratic that doesn\'t factor nicely',
    steps: [
      'Download or manually enter the program (see video)',
      'Run program: [PRGM], select QUADFORM',
      'Enter A coefficient, press [ENTER]',
      'Enter B coefficient, press [ENTER]',
      'Enter C coefficient, press [ENTER]',
      'Both roots appear instantly'
    ],
    practiceProblems: [
      {
        problem: 'Solve: x² - 5x + 6 = 0',
        hint: 'A=1, B=-5, C=6'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press PRGM to access programs',
        buttonId: 'prgm',
        screenDisplay: 'PRGM EXEC EDIT'
      },
      {
        instruction: 'Select QUADFORM program and press ENTER',
        buttonId: 'enter',
        screenDisplay: 'prgmQUADFORM',
        hint: 'Arrow down to find it if not visible'
      },
      {
        instruction: 'Press ENTER to run the program',
        buttonId: 'enter',
        screenDisplay: 'A=?'
      },
      {
        instruction: 'Enter A coefficient: 1',
        buttonId: '1',
        screenDisplay: 'A=1'
      },
      {
        instruction: 'Press ENTER',
        buttonId: 'enter',
        screenDisplay: 'B=?'
      },
      {
        instruction: 'Enter B coefficient: -5',
        buttonId: 'negative',
        screenDisplay: 'B=-5',
        hint: 'Use (-) button, then 5'
      },
      {
        instruction: 'Press ENTER',
        buttonId: 'enter',
        screenDisplay: 'C=?'
      },
      {
        instruction: 'Enter C coefficient: 6',
        buttonId: '6',
        screenDisplay: 'C=6'
      },
      {
        instruction: 'Press ENTER to see both roots',
        buttonId: 'enter',
        screenDisplay: 'X1=3  X2=2',
        hint: 'The solutions are x=3 and x=2'
      }
    ],
    challengeMode: {
      manualProblem: 'Solve x² - 5x + 6 = 0 using the quadratic formula',
      calculatorProblem: 'Solve using the QUADFORM program',
      expectedManualTime: 75,
      expectedCalcTime: 15
    }
  },
  {
    id: 'table-mode',
    title: 'Guess & Check on Steroids',
    model: ['TI-84'],
    description: 'Not sure which answer is right? Table all 4 choices in seconds.',
    timeSaved: '~1 minute when testing multiple values',
    difficulty: 'beginner',
    whenToUse: 'Testing which x-value satisfies an equation, finding patterns',
    steps: [
      'Press [Y=] and enter your function',
      'Press [2nd] [WINDOW] for TBLSET',
      'Set TblStart and ΔTbl (increment)',
      'Press [2nd] [GRAPH] to view table',
      'Scroll through X and Y values'
    ],
    practiceProblems: [
      {
        problem: 'Evaluate f(x) = x² for x = 0, 1, 2, 3, 4, 5',
        hint: 'Enter Y1=X², set up table with TblStart=0, ΔTbl=1'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press Y= to enter your function',
        buttonId: 'y=',
        screenDisplay: 'Y1='
      },
      {
        instruction: 'Enter X (press X,T,θ,n button)',
        buttonId: 'x-t-theta-n',
        screenDisplay: 'Y1=X'
      },
      {
        instruction: 'Press x² button to square it',
        buttonId: 'x^2',
        screenDisplay: 'Y1=X²'
      },
      {
        instruction: 'Press 2nd for secondary function',
        buttonId: '2nd',
        screenDisplay: '2nd active'
      },
      {
        instruction: 'Press WINDOW for TBLSET',
        buttonId: 'window',
        screenDisplay: 'TABLE SETUP'
      },
      {
        instruction: 'Enter 0 for TblStart',
        buttonId: '0',
        screenDisplay: 'TblStart=0',
        hint: 'This is where the table begins'
      },
      {
        instruction: 'Press ENTER to go to ΔTbl',
        buttonId: 'enter',
        screenDisplay: 'ΔTbl='
      },
      {
        instruction: 'Enter 1 for increment',
        buttonId: '1',
        screenDisplay: 'ΔTbl=1',
        hint: 'Increment by 1 each row'
      },
      {
        instruction: 'Press 2nd again',
        buttonId: '2nd',
        screenDisplay: '2nd active'
      },
      {
        instruction: 'Press GRAPH to view TABLE',
        buttonId: 'graph',
        screenDisplay: 'X | Y1\n0 | 0\n1 | 1\n2 | 4\n3 | 9',
        hint: 'All values calculated instantly!'
      }
    ],
    challengeMode: {
      manualProblem: 'Calculate f(x) = x² for x = 0, 1, 2, 3, 4, 5 by hand',
      calculatorProblem: 'Use TABLE to find all values at once',
      expectedManualTime: 60,
      expectedCalcTime: 15
    }
  },
  {
    id: 'degree-mode',
    title: 'Degree vs. Radian Mode (CRITICAL)',
    model: ['TI-84'],
    description: 'Avoid catastrophic errors by setting correct angle mode',
    timeSaved: 'Prevents wrong answers',
    difficulty: 'beginner',
    videoId: 'CGngzXwFN3Q',
    whenToUse: 'EVERY trig problem - check before starting',
    steps: [
      'Press [MODE]',
      'Look at line 3: Radian vs. Degree',
      'Arrow to correct mode and press [ENTER]',
      'Rule: If angles are in degrees (30°, 45°, etc.), use DEGREE',
      'If angles are in π (π/2, π/4, etc.), use RADIAN'
    ],
    practiceProblems: [
      {
        problem: 'Calculate sin(30°) - verify your calculator is in DEGREE mode first!',
        hint: 'Answer should be 0.5. If you get -0.988, you\'re in RADIAN mode!'
      }
    ],
    interactiveSteps: [
      {
        instruction: 'Press MODE to access settings',
        buttonId: 'mode',
        screenDisplay: 'NORMAL SCI ENG'
      },
      {
        instruction: 'Press down arrow twice to reach angle setting',
        buttonId: 'down',
        screenDisplay: 'RADIAN DEGREE',
        hint: 'This is line 3 in the MODE menu'
      },
      {
        instruction: 'Press right arrow to select DEGREE',
        buttonId: 'right',
        screenDisplay: 'DEGREE selected',
        hint: 'The word DEGREE should be highlighted'
      },
      {
        instruction: 'Press ENTER to confirm',
        buttonId: 'enter',
        screenDisplay: 'Mode set'
      },
      {
        instruction: 'Press 2nd, then MODE to quit to home screen',
        buttonId: 'mode',
        screenDisplay: 'Home screen'
      },
      {
        instruction: 'Now try sin(30). Press SIN',
        buttonId: 'sin',
        screenDisplay: 'sin('
      },
      {
        instruction: 'Enter 30',
        buttonId: '3',
        screenDisplay: 'sin(30',
        hint: 'Type 3, then 0'
      },
      {
        instruction: 'Close parentheses and press ENTER',
        buttonId: 'enter',
        screenDisplay: '0.5',
        hint: 'Correct! sin(30°) = 0.5'
      }
    ],
    challengeMode: {
      manualProblem: 'Calculate sin(30°) using the unit circle or trig ratios',
      calculatorProblem: 'Set DEGREE mode and calculate sin(30)',
      expectedManualTime: 30,
      expectedCalcTime: 8
    }
  },
  // Desmos-specific lessons for Digital ACT
  {
    id: 'desmos-graphing-basics',
    title: 'Type It, See It, Click the Answer',
    model: ['Desmos'],
    description: 'Type your equation, watch the graph appear, click to read the answer. No math required.',
    timeSaved: '~90 seconds per problem',
    difficulty: 'beginner',
    whenToUse: 'Any problem involving graphing, finding intersections, or visualizing functions',
    steps: [
      'Click in the expression box on the left panel',
      'Type your equation (e.g., y = 2x + 3)',
      'Add a second equation in the next expression box',
      'The graph updates automatically as you type',
      'Click on intersection points to see exact coordinates',
      'Use the wrench icon to adjust window settings if needed'
    ],
    practiceProblems: [
      {
        problem: 'Find where y = 2x + 1 and y = -x + 7 intersect',
        hint: 'Enter both equations, then click the intersection point'
      },
      {
        problem: 'Graph y = x² - 4 and find the x-intercepts',
        hint: 'Click on the points where the parabola crosses the x-axis'
      }
    ]
  },
  {
    id: 'desmos-systems-equations',
    title: 'Graph Systems Instead of Solving',
    model: ['Desmos'],
    description: 'Two equations? Graph both, click the intersection. Skip substitution entirely.',
    timeSaved: '~2 minutes per problem',
    difficulty: 'beginner',
    whenToUse: 'Systems of 2 linear equations, break-even problems, finding where functions meet',
    steps: [
      'Enter the first equation in expression line 1',
      'Enter the second equation in expression line 2',
      'Look for the intersection point on the graph',
      'Click directly on the intersection point',
      'Desmos displays the exact (x, y) coordinates',
      'For non-integer answers, Desmos gives decimals you can convert'
    ],
    practiceProblems: [
      {
        problem: 'Solve: 3x + 2y = 12 and x - y = 1',
        hint: 'Rewrite in y= form or enter as-is—Desmos handles both!'
      }
    ],
    challengeMode: {
      manualProblem: 'Solve by substitution: 3x + 2y = 12, x - y = 1',
      calculatorProblem: 'Graph both equations in Desmos and click the intersection',
      expectedManualTime: 150,
      expectedCalcTime: 30
    }
  },
  {
    id: 'desmos-quadratic-roots',
    title: 'Find Roots Without Factoring',
    model: ['Desmos'],
    description: 'Graph the quadratic, click where it crosses the x-axis. Those are your answers.',
    timeSaved: '~1 minute per problem',
    difficulty: 'beginner',
    whenToUse: 'Finding roots/zeros, solving quadratic equations, factoring checks',
    steps: [
      'Type your quadratic in the expression box (e.g., y = x² - 5x + 6)',
      'The parabola appears automatically',
      'Click on each point where the curve crosses the x-axis',
      'Desmos shows the exact x-value at each intercept',
      'These x-values are your solutions to the equation = 0'
    ],
    practiceProblems: [
      {
        problem: 'Find the roots of x² - 7x + 12 = 0',
        hint: 'Graph y = x² - 7x + 12 and click the x-intercepts'
      },
      {
        problem: 'Solve 2x² + 3x - 5 = 0',
        hint: 'Graph it and read where y = 0'
      }
    ],
    challengeMode: {
      manualProblem: 'Factor and solve x² - 7x + 12 = 0',
      calculatorProblem: 'Graph in Desmos and click the x-intercepts',
      expectedManualTime: 90,
      expectedCalcTime: 20
    }
  },
  {
    id: 'desmos-regression',
    title: 'Let Desmos Find the Pattern',
    model: ['Desmos'],
    description: 'Dump in the data points. Desmos figures out the equation. You just read it.',
    timeSaved: '~2 minutes per problem',
    difficulty: 'intermediate',
    whenToUse: 'Data analysis, trend predictions, finding equations from tables',
    steps: [
      'Create a table by typing "table" or clicking the + and selecting table',
      'Enter your x-values in the first column, y-values in the second',
      'In a new expression line, type: y₁ ~ mx₁ + b (for linear)',
      'Desmos shows the best-fit equation with m and b values',
      'For quadratic fit, use: y₁ ~ ax₁² + bx₁ + c',
      'Use the equation for predictions'
    ],
    practiceProblems: [
      {
        problem: 'Find the line of best fit for: (1,3), (2,5), (3,8), (4,10)',
        hint: 'Enter in table, then type y₁ ~ mx₁ + b'
      }
    ],
    challengeMode: {
      manualProblem: 'Calculate the line of best fit for (1,3), (2,5), (3,8), (4,10) by hand',
      calculatorProblem: 'Use Desmos regression to find the best-fit line',
      expectedManualTime: 300,
      expectedCalcTime: 45
    }
  },
  {
    id: 'desmos-sliders',
    title: 'Slide to the Answer',
    model: ['Desmos'],
    description: 'Drag the slider until the graph matches. No algebra needed.',
    timeSaved: '~1 minute per problem',
    difficulty: 'intermediate',
    whenToUse: 'Understanding transformations, testing values, "what if" scenarios',
    steps: [
      'Type an equation with a letter parameter (e.g., y = ax² + b)',
      'Desmos auto-creates sliders for a and b',
      'Drag sliders to see the graph change in real-time',
      'Use this to match a given graph or understand transformations',
      'Click the play button to animate the slider'
    ],
    practiceProblems: [
      {
        problem: 'What value of a makes y = a(x-2)² pass through (4, 8)?',
        hint: 'Add a slider, adjust until the parabola hits (4, 8)'
      }
    ]
  },
  {
    id: 'desmos-inequalities',
    title: 'See the Solution Region Instantly',
    model: ['Desmos'],
    description: 'Type the inequality, see the shaded region. Is the point inside? That\'s your answer.',
    timeSaved: '~45 seconds per problem',
    difficulty: 'beginner',
    whenToUse: 'Graphing inequalities, finding feasible regions, constraint problems',
    steps: [
      'Type your inequality (e.g., y > 2x + 1)',
      'Desmos automatically shades the solution region',
      'Add more inequalities to find overlapping regions',
      'Check if a point is in the solution by seeing if it\'s in the shaded area',
      'Use ≤ and ≥ by typing <= or >='
    ],
    practiceProblems: [
      {
        problem: 'Graph y < x + 3 and y > -2x + 1. Where do they overlap?',
        hint: 'Enter both inequalities—the overlap is the solution region'
      }
    ]
  },
  {
    id: 'desmos-statistics',
    title: 'Stats in One Line of Code',
    model: ['Desmos'],
    description: 'mean(L) gives you the mean. median(L) gives you the median. No arithmetic.',
    timeSaved: '~1 minute per problem',
    difficulty: 'beginner',
    whenToUse: 'Mean, median, standard deviation, quartiles from data sets',
    steps: [
      'Create a list: L = [85, 90, 78, 92, 88]',
      'For mean: type mean(L)',
      'For median: type median(L)',
      'For standard deviation: type stdev(L)',
      'For min/max: type min(L) or max(L)',
      'Results appear instantly'
    ],
    practiceProblems: [
      {
        problem: 'Find the mean and median of: 72, 85, 91, 78, 88, 95',
        hint: 'Create list L = [72, 85, 91, 78, 88, 95], then use mean(L) and median(L)'
      }
    ],
    challengeMode: {
      manualProblem: 'Calculate mean and median of: 72, 85, 91, 78, 88, 95',
      calculatorProblem: 'Use Desmos list functions',
      expectedManualTime: 120,
      expectedCalcTime: 20
    }
  }
];

export const calculatorModels: Record<CalculatorModel, {
  name: string;
  image: string;
  description: string;
  subtitle: string;
  pros: string[];
  price: string;
}> = {
  'TI-84': {
    name: 'TI-84 Plus CE',
    image: '🔢',
    description: 'The standard calculator for paper ACT tests',
    subtitle: 'For Paper ACT',
    pros: ['Widely used', 'Tons of online resources', 'Full simulator included'],
    price: '~$100'
  },
  'Desmos': {
    name: 'Desmos',
    image: '💻',
    description: 'Built-in graphing calculator for digital ACT',
    subtitle: 'For Digital ACT',
    pros: ['Free & built-in', 'Powerful graphing', 'No device needed'],
    price: 'Free'
  }
};
