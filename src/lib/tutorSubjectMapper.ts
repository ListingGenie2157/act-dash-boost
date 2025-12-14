import type { TutorSubject } from '@/types/tutor';

/**
 * Maps internal subject codes to TutorSubject types
 */
export function mapToTutorSubject(subject: string): TutorSubject {
  const normalized = subject.toLowerCase().trim();
  
  // Handle various subject code formats
  if (normalized === 'english' || normalized.startsWith('e')) {
    return 'ENGLISH';
  }
  if (normalized === 'math' || normalized.startsWith('m')) {
    return 'MATH';
  }
  if (normalized === 'science' || normalized.startsWith('s')) {
    return 'SCIENCE';
  }
  if (normalized === 'reading' || normalized.startsWith('r')) {
    return 'READING';
  }
  
  // Default fallback
  return 'ENGLISH';
}

/**
 * Gets a user-friendly subject name
 */
export function getSubjectDisplayName(subject: TutorSubject): string {
  switch (subject) {
    case 'ENGLISH':
      return 'English';
    case 'MATH':
    case 'ACT_MATH':
      return 'Math';
    case 'SCIENCE':
      return 'Science';
    case 'READING':
      return 'Reading';
    case 'AP_CHEM':
      return 'AP Chemistry';
    default:
      return subject;
  }
}
