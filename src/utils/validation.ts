import { VALIDATION } from '@/constants/config';

/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email.trim());
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and errors
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
  }

  if (password.length > VALIDATION.MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be less than ${VALIDATION.MAX_PASSWORD_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate answer selection
 * @param answer - Selected answer index
 * @param optionsLength - Total number of options
 * @returns True if valid answer
 */
export const isValidAnswer = (answer: number, optionsLength: number): boolean => {
  return answer >= 0 && answer < optionsLength;
};

/**
 * Validate quiz completion
 * @param answers - Array of answer indices
 * @param questionsLength - Total number of questions
 * @returns True if all questions answered
 */
export const isQuizComplete = (answers: number[], questionsLength: number): boolean => {
  return answers.length === questionsLength && answers.every(answer => answer !== -1);
};

/**
 * Validate day number
 * @param day - Day number to validate
 * @returns True if valid day in range
 */
export const isValidDay = (day: number): boolean => {
  return day >= 9 && day <= 13; // 5-day intensive plan
};

/**
 * Sanitize user input to prevent XSS
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate score percentage
 * @param score - Score value
 * @returns True if valid percentage (0-100)
 */
export const isValidScore = (score: number): boolean => {
  return score >= 0 && score <= 100;
};

/**
 * Validate time limit
 * @param seconds - Time in seconds
 * @returns True if valid time limit
 */
export const isValidTimeLimit = (seconds: number): boolean => {
  return seconds > 0 && seconds <= 3600; // Max 1 hour
};