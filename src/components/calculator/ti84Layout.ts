// TI-84 Plus CE Button Layout and Configuration

export interface CalculatorButton {
  id: string;
  label: string;
  secondaryLabel?: string;
  alphaLabel?: string;
  color: 'primary' | 'secondary' | 'dark' | 'light' | 'arrow';
  width?: 'normal' | 'wide';
}

export const TI84_LAYOUT: CalculatorButton[][] = [
  // Row 1: Top function keys
  [
    { id: 'y=', label: 'Y=', color: 'dark' },
    { id: 'window', label: 'WINDOW', color: 'dark' },
    { id: 'zoom', label: 'ZOOM', color: 'dark' },
    { id: 'trace', label: 'TRACE', color: 'dark' },
    { id: 'graph', label: 'GRAPH', color: 'dark' },
  ],
  // Row 2: Second row
  [
    { id: '2nd', label: '2nd', color: 'primary' },
    { id: 'mode', label: 'MODE', secondaryLabel: 'QUIT', color: 'dark' },
    { id: 'del', label: 'DEL', secondaryLabel: 'INS', color: 'dark' },
    { id: 'stat', label: 'STAT', color: 'dark' },
  ],
  // Row 3: Alpha row
  [
    { id: 'alpha', label: 'ALPHA', color: 'secondary' },
    { id: 'x-t-theta-n', label: 'X,T,θ,n', alphaLabel: 'A', color: 'dark' },
    { id: 'math', label: 'MATH', secondaryLabel: 'APPS', alphaLabel: 'B', color: 'dark' },
    { id: 'prgm', label: 'PRGM', alphaLabel: 'C', color: 'dark' },
    { id: 'apps', label: 'APPS', secondaryLabel: 'MATRIX', alphaLabel: 'D', color: 'dark' },
  ],
  // Row 4: Navigation arrows
  [
    { id: 'up', label: '▲', color: 'arrow' },
  ],
  [
    { id: 'left', label: '◄', color: 'arrow' },
    { id: 'enter', label: 'ENTER', color: 'dark', width: 'wide' },
    { id: 'right', label: '►', color: 'arrow' },
  ],
  [
    { id: 'down', label: '▼', color: 'arrow' },
  ],
  // Row 5: Math functions
  [
    { id: 'x^2', label: 'x²', secondaryLabel: '√', alphaLabel: 'D', color: 'light' },
    { id: 'comma', label: ',', secondaryLabel: 'EE', alphaLabel: 'E', color: 'light' },
    { id: 'lparen', label: '(', secondaryLabel: '{', alphaLabel: 'F', color: 'light' },
    { id: 'rparen', label: ')', secondaryLabel: '}', alphaLabel: 'G', color: 'light' },
    { id: 'divide', label: '÷', color: 'light' },
  ],
  // Row 6: Trig functions
  [
    { id: 'sin', label: 'SIN', secondaryLabel: 'SIN⁻¹', alphaLabel: 'H', color: 'light' },
    { id: 'cos', label: 'COS', secondaryLabel: 'COS⁻¹', alphaLabel: 'I', color: 'light' },
    { id: 'tan', label: 'TAN', secondaryLabel: 'TAN⁻¹', alphaLabel: 'J', color: 'light' },
    { id: 'power', label: '^', secondaryLabel: 'π', alphaLabel: 'K', color: 'light' },
    { id: 'multiply', label: '×', color: 'light' },
  ],
  // Row 7: Log functions
  [
    { id: 'log', label: 'LOG', secondaryLabel: '10ˣ', alphaLabel: 'L', color: 'light' },
    { id: 'ln', label: 'LN', secondaryLabel: 'eˣ', alphaLabel: 'M', color: 'light' },
    { id: 'sto', label: 'STO▶', secondaryLabel: 'RCL', alphaLabel: 'N', color: 'light' },
    { id: 'vars', label: 'VARS', alphaLabel: 'O', color: 'light' },
    { id: 'subtract', label: '−', color: 'light' },
  ],
  // Row 8: Number pad top
  [
    { id: '7', label: '7', secondaryLabel: 'u', alphaLabel: 'P', color: 'light' },
    { id: '8', label: '8', secondaryLabel: 'v', alphaLabel: 'Q', color: 'light' },
    { id: '9', label: '9', secondaryLabel: 'w', alphaLabel: 'R', color: 'light' },
    { id: 'clear', label: 'CLEAR', color: 'dark' },
    { id: 'add', label: '+', color: 'light' },
  ],
  // Row 9: Number pad middle
  [
    { id: '4', label: '4', alphaLabel: 'S', color: 'light' },
    { id: '5', label: '5', alphaLabel: 'T', color: 'light' },
    { id: '6', label: '6', alphaLabel: 'U', color: 'light' },
    { id: 'on', label: 'ON', color: 'dark' },
  ],
  // Row 10: Number pad bottom
  [
    { id: '1', label: '1', alphaLabel: 'V', color: 'light' },
    { id: '2', label: '2', alphaLabel: 'W', color: 'light' },
    { id: '3', label: '3', alphaLabel: 'X', color: 'light' },
  ],
  // Row 11: Bottom row
  [
    { id: '0', label: '0', alphaLabel: 'Y', color: 'light' },
    { id: 'decimal', label: '.', alphaLabel: 'Z', color: 'light' },
    { id: 'negative', label: '(−)', color: 'light' },
  ],
];

export const BUTTON_COLORS = {
  primary: {
    bg: 'hsl(270 70% 55%)', // --primary
    hover: 'hsl(270 70% 45%)',
    text: 'hsl(0 0% 100%)', // --primary-foreground
  },
  secondary: {
    bg: 'hsl(46 95% 60%)', // --accent (yellow)
    hover: 'hsl(46 95% 50%)',
    text: 'hsl(0 0% 15%)', // --accent-foreground
  },
  dark: {
    bg: 'hsl(215 25% 25%)',
    hover: 'hsl(215 25% 20%)',
    text: 'hsl(0 0% 100%)',
  },
  light: {
    bg: 'hsl(0 0% 95%)',
    hover: 'hsl(0 0% 88%)',
    text: 'hsl(215 25% 15%)', // --foreground
  },
  arrow: {
    bg: 'hsl(215 25% 35%)',
    hover: 'hsl(215 25% 30%)',
    text: 'hsl(0 0% 100%)',
  },
};
