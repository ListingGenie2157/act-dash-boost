// Simple monotonic mapping from percent to scaled score
// Note: This is an estimate until proper IRT scaling tables are implemented

export function percentToScaledScore(percent: number, section: string): number {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.max(0, Math.min(100, percent));
  
  // ACT scaled scores range from 1-36
  // Using a simple linear mapping for now
  // Real ACT scoring uses complex IRT models and varies by test form
  
  let scaledScore: number;
  
  if (clampedPercent === 0) {
    scaledScore = 1;
  } else if (clampedPercent === 100) {
    scaledScore = 36;
  } else {
    // Linear interpolation between 1 and 36
    // Adjust the curve slightly to match real ACT distributions
    const adjustedPercent = Math.pow(clampedPercent / 100, 0.8) * 100;
    scaledScore = Math.round(1 + (adjustedPercent / 100) * 35);
  }
  
  return Math.max(1, Math.min(36, scaledScore));
}

export function getScaledScoreLabel(score: number): string {
  return `${score} (estimate)`;
}

export function calculateCompositeScore(scores: { english?: number; math?: number; reading?: number; science?: number }): number {
  const validScores = Object.values(scores).filter(score => score !== undefined) as number[];
  
  if (validScores.length === 0) return 1;
  
  const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  return Math.round(average);
}