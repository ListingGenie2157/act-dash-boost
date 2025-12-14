/**
 * Zod validation schemas for edge function inputs
 * Ensures data integrity and provides user-friendly error messages
 */

import { z } from 'zod';

/**
 * Valid form IDs for diagnostic tests and simulations
 */
const VALID_FORM_IDS = [
  'ONB', 'D2EN', 'D2MA', 'D2RD', 'D2SCI', // Diagnostic forms
  'EN_A', 'EN_B', 'EN_C', // English forms
  'MATH_A', 'MATH_B', 'MATH_C', // Math forms
  'RD_A', 'RD_B', 'RD_C', // Reading forms
  'SCI_A', 'SCI_B', 'SCI_C', // Science forms
] as const;

/**
 * Valid sections for simulations
 */
const VALID_SECTIONS = ['english', 'math', 'reading', 'science'] as const;

/**
 * Valid drill subjects
 */
const VALID_DRILL_SUBJECTS = [
  'Reading', 'RD',
  'Math', 'MA',
  'English', 'EN',
  'Science', 'SC'
] as const;

/**
 * Schema for diagnostic test formId parameter
 */
export const diagnosticFormIdSchema = z.object({
  formId: z.string()
    .min(1, 'Form ID is required')
    .refine(
      (val): val is typeof VALID_FORM_IDS[number] => VALID_FORM_IDS.includes(val as typeof VALID_FORM_IDS[number]),
      {
        message: `Invalid form ID. Must be one of: ${VALID_FORM_IDS.join(', ')}`
      }
    )
});

export type DiagnosticFormIdInput = z.infer<typeof diagnosticFormIdSchema>;

/**
 * Schema for drill runner parameters
 */
export const drillRunnerSchema = z.object({
  subject: z.string()
    .min(1, 'Subject is required')
    .refine(
      (val): val is typeof VALID_DRILL_SUBJECTS[number] => VALID_DRILL_SUBJECTS.includes(val as typeof VALID_DRILL_SUBJECTS[number]),
      {
        message: `Invalid subject. Must be one of: ${VALID_DRILL_SUBJECTS.join(', ')}`
      }
    ),
  n: z.number()
    .int('Number of questions must be an integer')
    .min(1, 'Must request at least 1 question')
    .max(100, 'Cannot request more than 100 questions')
    .optional()
    .default(10)
});

export type DrillRunnerInput = z.infer<typeof drillRunnerSchema>;

/**
 * Schema for session-start edge function
 */
export const sessionStartSchema = z.object({
  form_id: z.string()
    .min(1, 'Form ID is required')
    .refine(
      (val): val is typeof VALID_FORM_IDS[number] => VALID_FORM_IDS.includes(val as typeof VALID_FORM_IDS[number]),
      {
        message: `Invalid form ID. Must be one of: ${VALID_FORM_IDS.join(', ')}`
      }
    ),
  section: z.enum(VALID_SECTIONS, {
    errorMap: () => ({ message: `Section must be one of: ${VALID_SECTIONS.join(', ')}` })
  }),
  coached: z.boolean({
    required_error: 'Coached mode must be specified',
    invalid_type_error: 'Coached mode must be a boolean'
  })
});

export type SessionStartInput = z.infer<typeof sessionStartSchema>;

/**
 * Schema for submit-response edge function
 */
export const submitResponseSchema = z.object({
  session_id: z.string()
    .uuid('Session ID must be a valid UUID'),
  question_id: z.string()
    .min(1, 'Question ID is required'),
  selected: z.enum(['A', 'B', 'C', 'D', 'E'], {
    errorMap: () => ({ message: 'Answer must be A, B, C, D, or E' })
  }),
  time_ms: z.number()
    .int('Time must be an integer')
    .min(0, 'Time cannot be negative')
    .max(3600000, 'Time cannot exceed 1 hour (3,600,000 ms)')
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

/**
 * Schema for session-finish edge function
 */
export const sessionFinishSchema = z.object({
  session_id: z.string()
    .uuid('Session ID must be a valid UUID')
});

export type SessionFinishInput = z.infer<typeof sessionFinishSchema>;

/**
 * Helper function to validate and return parsed data or throw user-friendly error
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join(', ');
      throw new Error(
        context 
          ? `${context}: ${errorMessages}` 
          : errorMessages
      );
    }
    throw error;
  }
}

/**
 * Helper function to safely validate input and return result with errors
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errorMessages = result.error.errors.map(e => e.message).join(', ');
  return { success: false, error: errorMessages };
}
