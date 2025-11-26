interface CompanionTip {
  message: string;
  section?: string;
}

type TipCategory = {
  [key: string]: string[];
};

// General tips that apply to all sections
const GENERAL_TIPS: TipCategory = {
  TIME_WARNING_60S: [
    "You've spent a minute on this one. Consider marking it and moving on if you're stuck.",
    "Time check - if you're not sure, skip it and come back with fresh eyes.",
    "Don't get anchored. You can always come back to this one.",
  ],
  TIME_WARNING_90S: [
    "90 seconds on one question. Time to move on and keep your pace.",
    "This one's taking a while. Circle it and keep moving forward.",
  ],
  PACE_WARNING: [
    "You're using time faster than questions. Pick up the pace a bit.",
    "Pace check: aim to spend equal time per question to avoid rushing at the end.",
  ],
  GUESS_BLANKS: [
    "Less than 5 minutes left! Fill in any blanks - there's no penalty for guessing.",
    "Quick! Bubble in any remaining blanks. An educated guess beats an empty answer.",
  ],
  FINAL_PUSH: [
    "Under 2 minutes! Make sure every question has an answer.",
    "Final stretch - fill in all remaining answers now!",
  ],
  MIDPOINT_ENCOURAGEMENT: [
    "You're halfway there! Keep up the great work.",
    "Nice progress - you're at the midpoint. Stay focused.",
  ],
};

// Section-specific strategic tips
const ENGLISH_TIPS: TipCategory = {
  SECTION_START: [
    "English tip: When in doubt, shorter is usually better. OMIT wins a lot!",
    "Remember: read the FULL sentence, not just the underlined part.",
    "Trust your ear - if it sounds wrong, it probably is.",
  ],
  OMIT_STRATEGY: [
    "See an OMIT option? Consider it seriously - the ACT loves conciseness.",
    "Less is more in ACT English. OMIT removes redundancy.",
  ],
  COMMA_SPLICE: [
    "Watch for comma splices! Two complete sentences need more than just a comma.",
    "If both parts could stand alone, you need a period, semicolon, or conjunction.",
  ],
};

const MATH_TIPS: TipCategory = {
  SECTION_START: [
    "Math tip: Plug in the answer choices when you're stuck - work backwards!",
    "Remember to use your calculator strategically - it's a tool, not a crutch.",
    "Draw a diagram if you can visualize it - especially for geometry questions.",
  ],
  PLUG_IN_ANSWERS: [
    "Stuck? Try plugging in the answer choices - start with C (the middle value).",
    "When formulas fail, test the answers. The right one will work.",
  ],
  CALCULATOR_CHECK: [
    "Double-check that calculator entry - typos cost points.",
    "Is the calculator allowed for this one? Sometimes mental math is faster.",
  ],
};

const READING_TIPS: TipCategory = {
  SECTION_START: [
    "Reading tip: Skim the questions first so you know what to look for.",
    "The answer is almost always directly stated. Hunt for text evidence.",
    "Eliminate obviously wrong answers first - narrow it down.",
  ],
  FIND_EVIDENCE: [
    "Can you point to where the passage says this? Find the exact evidence.",
    "Don't rely on memory - go back and locate the support in the text.",
  ],
  ELIMINATE_STRATEGY: [
    "Cross out answers you know are wrong. Process of elimination is powerful.",
    "Two answers close? Look for the one with more textual support.",
  ],
};

const SCIENCE_TIPS: TipCategory = {
  SECTION_START: [
    "Science tip: Focus on the graphs and data - don't get lost in the text.",
    "Look at axis labels and units carefully - they often hold the key.",
    "Compare and contrast - many questions ask you to spot patterns.",
  ],
  READ_GRAPHS: [
    "Check those axis labels! X and Y axes tell you what you're looking at.",
    "Follow the trend line - is it increasing, decreasing, or staying constant?",
  ],
  DATA_COMPARISON: [
    "They're asking you to compare data points. Use the graphs, not your memory.",
    "Look for patterns - what stays the same? What changes?",
  ],
};

const SECTION_TIP_MAP: Record<string, TipCategory> = {
  EN: ENGLISH_TIPS,
  MATH: MATH_TIPS,
  RD: READING_TIPS,
  SCI: SCIENCE_TIPS,
};

export function getCompanionTip(
  tipKey: string,
  section: string,
  _context?: Record<string, any>
): CompanionTip | null {
  // Check section-specific tips first
  const sectionTips = SECTION_TIP_MAP[section];
  if (sectionTips && sectionTips[tipKey]) {
    const messages = sectionTips[tipKey];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return { message, section };
  }

  // Fall back to general tips
  if (GENERAL_TIPS[tipKey]) {
    const messages = GENERAL_TIPS[tipKey];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return { message };
  }

  return null;
}

// Export tip keys for easy reference
export const TIP_KEYS = {
  // General
  TIME_WARNING_60S: 'TIME_WARNING_60S',
  TIME_WARNING_90S: 'TIME_WARNING_90S',
  PACE_WARNING: 'PACE_WARNING',
  GUESS_BLANKS: 'GUESS_BLANKS',
  FINAL_PUSH: 'FINAL_PUSH',
  SECTION_START: 'SECTION_START',
  MIDPOINT_ENCOURAGEMENT: 'MIDPOINT_ENCOURAGEMENT',
  
  // English
  OMIT_STRATEGY: 'OMIT_STRATEGY',
  COMMA_SPLICE: 'COMMA_SPLICE',
  
  // Math
  PLUG_IN_ANSWERS: 'PLUG_IN_ANSWERS',
  CALCULATOR_CHECK: 'CALCULATOR_CHECK',
  
  // Reading
  FIND_EVIDENCE: 'FIND_EVIDENCE',
  ELIMINATE_STRATEGY: 'ELIMINATE_STRATEGY',
  
  // Science
  READ_GRAPHS: 'READ_GRAPHS',
  DATA_COMPARISON: 'DATA_COMPARISON',
} as const;
