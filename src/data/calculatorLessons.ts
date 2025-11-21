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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
