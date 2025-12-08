export const ACT_SECTIONS = {
  ENGLISH: 'EN',
  MATH: 'MATH',
  READING: 'RD',
  SCIENCE: 'SCI',
} as const;

export type ACTSection = (typeof ACT_SECTIONS)[keyof typeof ACT_SECTIONS];

export const TASK_TYPES = {
  LEARN: 'LEARN',
  DRILL: 'DRILL',
  REVIEW: 'REVIEW',
  SIM: 'SIM',
  MIXED: 'MIXED',
} as const;

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];

export const TASK_STATUS = {
  PENDING: 'PENDING',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
