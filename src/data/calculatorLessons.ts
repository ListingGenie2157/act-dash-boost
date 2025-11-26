export type CalculatorModel = 'TI-84' | 'TI-Nspire' | 'Casio';

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
    title: 'Matrix Magic: Solving Systems in Seconds',
    model: ['TI-84', 'TI-Nspire'],
    description: 'Use rref() to solve systems of linear equations instantly instead of substitution/elimination',
    timeSaved: '~2 minutes per problem',
    difficulty: 'intermediate',
    videoId: 'qcD71nxJfKY',
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
    title: 'Poly Root Finder: Skip the Factoring',
    model: ['TI-84', 'TI-Nspire', 'Casio'],
    description: 'Find roots of quadratics and higher-degree polynomials without factoring or quadratic formula',
    timeSaved: '~90 seconds per problem',
    difficulty: 'beginner',
    videoId: 'KfDLw90Mi6E',
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
    title: 'Graph & Intersect: Visual Equation Solving',
    model: ['TI-84', 'TI-Nspire'],
    description: 'Use graphing to find intersection points instead of solving algebraically',
    timeSaved: '~2 minutes per problem',
    difficulty: 'beginner',
    videoId: 'S6GA8PJdxz0',
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
    title: 'Frac ↔ Dec: Instant Conversions',
    model: ['TI-84', 'TI-Nspire', 'Casio'],
    description: 'Convert decimals to fractions and vice versa with one button',
    timeSaved: '~30 seconds per conversion',
    difficulty: 'beginner',
    videoId: 'OKJsDN1ysvc',
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
    title: 'Mean/Median Lists: Stats in Seconds',
    model: ['TI-84', 'TI-Nspire', 'Casio'],
    description: 'Calculate mean, median, standard deviation using list editor instead of manual computation',
    timeSaved: '~1 minute per problem',
    difficulty: 'beginner',
    videoId: 'CK6OFFsy_zk',
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
    title: 'Store the Quadratic Formula Program',
    model: ['TI-84'],
    description: 'Enter a, b, c coefficients and get both roots instantly',
    timeSaved: '~45 seconds per problem',
    difficulty: 'advanced',
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
    title: 'Table Mode: Test Multiple Inputs Fast',
    model: ['TI-84', 'TI-Nspire'],
    description: 'Evaluate functions at multiple x-values simultaneously',
    timeSaved: '~1 minute when testing multiple values',
    difficulty: 'beginner',
    videoId: 'Bvc47bQJ6o4',
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
    model: ['TI-84', 'TI-Nspire', 'Casio'],
    description: 'Avoid catastrophic errors by setting correct angle mode',
    timeSaved: 'Prevents wrong answers',
    difficulty: 'beginner',
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
  }
];

export const calculatorModels = {
  'TI-84': {
    name: 'TI-84 Plus CE',
    image: '🔢',
    description: 'Most common calculator for ACT',
    pros: ['Widely used', 'Tons of online resources', 'Affordable'],
    price: '~$100'
  },
  'TI-Nspire': {
    name: 'TI-Nspire CX II',
    image: '🧮',
    description: 'Most powerful allowed calculator',
    pros: ['Computer algebra system', 'Advanced graphing', 'Solve equations symbolically'],
    price: '~$150'
  },
  'Casio': {
    name: 'Casio fx-991EX / 115ES',
    image: '⚡',
    description: 'Budget-friendly powerhouse',
    pros: ['Natural display', 'Matrix operations', 'Under $30'],
    price: '~$25'
  }
};
