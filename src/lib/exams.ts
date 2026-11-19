/**
 * Locked exams (questions live in staging_items under these form-id prefixes).
 * Locked exams: 3 full simulations + 5 coach-mode exams (form ids <prefix>_<section>) */
export const EXAM_PACKAGES = [
  { prefix: 'FA', label: 'Full ACT – Form A', coached: false },
  { prefix: 'FB', label: 'Full ACT – Form B', coached: false },
  { prefix: 'FC', label: 'Full ACT – Form C', coached: false },
  { prefix: 'C1', label: 'Coach Exam 1', coached: true },
  { prefix: 'C2', label: 'Coach Exam 2', coached: true },
  { prefix: 'C3', label: 'Coach Exam 3', coached: true },
  { prefix: 'C4', label: 'Coach Exam 4', coached: true },
  { prefix: 'C5', label: 'Coach Exam 5', coached: true },
];

export const isCoachExamForm = (formId: string) => /^C[1-5]_/.test(formId);
