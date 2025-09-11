/**
 * Application configuration constants
 * Centralized location for all configuration values
 */

// Drill Configuration
export const DRILL_CONFIG = {
  MATH_QUESTIONS_COUNT: 5,
  ENGLISH_QUESTIONS_COUNT: 5,
  DEFAULT_TIME_LIMITS: {
    MATH: 60,
    ENGLISH: 90
  }
} as const;

// Test Configuration
export const TEST_CONFIG = {
  TEST_DATE: 'September 6',
  PREP_DAYS: 5,
  START_DAY: 9,
  END_DAY: 13
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  PROGRESS: 'act-prep-progress',
  USER_PREFERENCES: 'act-prep-preferences',
  SESSION: 'act-prep-session'
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 500
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_OFFLINE_MODE: true
} as const;