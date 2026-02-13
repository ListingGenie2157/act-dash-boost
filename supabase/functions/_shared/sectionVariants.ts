/**
 * Get all possible database variants for a section code.
 * Shared across session-start and session-fetch.
 */
export function getAllSectionVariants(sectionCode: string): string[] {
  const upper = sectionCode.toUpperCase();

  switch (upper) {
    case 'EN':
    case 'ENGLISH':
      return ['EN', 'English', 'ENGLISH', 'english'];
    case 'MATH':
    case 'MA':
      return ['MA', 'Math', 'MATH', 'math'];
    case 'RD':
    case 'READING':
      return ['RD', 'Reading', 'READING', 'reading'];
    case 'SCI':
    case 'SC':
    case 'SCIENCE':
      return ['SC', 'SCI', 'Science', 'SCIENCE', 'science'];
    default:
      return [sectionCode];
  }
}
