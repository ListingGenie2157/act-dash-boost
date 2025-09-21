import { z } from 'zod';

// Date validation schemas
export const dateSchema = z.date().refine(
  (date) => date >= new Date(),
  "Date must be in the future"
);

export const testDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Date must be in YYYY-MM-DD format"
);

// Task validation schemas
export const taskIdSchema = z.string().uuid("Invalid task ID");

export const taskAccuracySchema = z.number()
  .min(0, "Accuracy must be at least 0")
  .max(1, "Accuracy must be at most 1");

export const taskTimeSchema = z.number()
  .positive("Time must be positive")
  .int("Time must be an integer");

// Question answer validation
export const answerSchema = z.enum(['A', 'B', 'C', 'D']);

// Score validation
export const scoreSchema = z.number()
  .min(0, "Score must be at least 0")
  .max(100, "Score must be at most 100");

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}

// Validate and sanitize error messages
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.substring(0, 200); // Limit length
  }
  return 'An unexpected error occurred';
}