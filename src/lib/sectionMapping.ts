/**
 * SINGLE SOURCE OF TRUTH for section/subject naming conventions across the app.
 * 
 * Standard codes (used in sessions, form suffixes, validation):
 *   EN, MATH, RD, SCI
 * 
 * Full names (used in skills table, staging_items after standardization):
 *   English, Math, Reading, Science
 * 
 * Form ID suffixes (FA_EN, FA_MA, etc.):
 *   EN, MA, RD, SC
 */

// Standard section codes used in sessions table and validation
export const SECTION_CODES = ['EN', 'MATH', 'RD', 'SCI'] as const;
export type SectionCode = typeof SECTION_CODES[number];

// Full section names used in skills table and staging_items (standardized)
export const SECTION_FULL_NAMES = ['English', 'Math', 'Reading', 'Science'] as const;
export type SectionFullName = typeof SECTION_FULL_NAMES[number];

// Form ID suffix to section code mapping (FA_EN → EN, FA_MA → MATH)
export const FORM_SUFFIX_TO_CODE: Record<string, SectionCode> = {
  'EN': 'EN',
  'MA': 'MATH',
  'RD': 'RD',
  'SC': 'SCI',
  'SCI': 'SCI', // alternate suffix
};

// Section code to full name mapping
export const CODE_TO_FULL: Record<SectionCode, SectionFullName> = {
  'EN': 'English',
  'MATH': 'Math',
  'RD': 'Reading',
  'SCI': 'Science',
};

// Full name to section code mapping
export const FULL_TO_CODE: Record<SectionFullName, SectionCode> = {
  'English': 'EN',
  'Math': 'MATH',
  'Reading': 'RD',
  'Science': 'SCI',
};

// All possible variants that might appear in data, mapped to standard full name
const SECTION_VARIANTS_TO_FULL: Record<string, SectionFullName> = {
  // English variants
  'EN': 'English',
  'ENGLISH': 'English',
  'english': 'English',
  'English': 'English',
  
  // Math variants
  'MA': 'Math',
  'MATH': 'Math',
  'math': 'Math',
  'Math': 'Math',
  
  // Reading variants
  'RD': 'Reading',
  'READING': 'Reading',
  'reading': 'Reading',
  'Reading': 'Reading',
  
  // Science variants
  'SC': 'Science',
  'SCI': 'Science',
  'SCIENCE': 'Science',
  'science': 'Science',
  'Science': 'Science',
};

// All possible variants that might appear in data, mapped to standard code
const SECTION_VARIANTS_TO_CODE: Record<string, SectionCode> = {
  // English variants
  'EN': 'EN',
  'ENGLISH': 'EN',
  'english': 'EN',
  'English': 'EN',
  
  // Math variants
  'MA': 'MATH',
  'MATH': 'MATH',
  'math': 'MATH',
  'Math': 'MATH',
  
  // Reading variants
  'RD': 'RD',
  'READING': 'RD',
  'reading': 'RD',
  'Reading': 'RD',
  
  // Science variants
  'SC': 'SCI',
  'SCI': 'SCI',
  'SCIENCE': 'SCI',
  'science': 'SCI',
  'Science': 'SCI',
};

/**
 * Normalize any section value to standard full name (English, Math, Reading, Science)
 * Use this when querying staging_items or skills tables
 */
export function normalizeToFullName(section: string): SectionFullName {
  const normalized = SECTION_VARIANTS_TO_FULL[section];
  if (normalized) return normalized;
  
  // Try case-insensitive lookup
  const upper = section.toUpperCase();
  for (const [variant, full] of Object.entries(SECTION_VARIANTS_TO_FULL)) {
    if (variant.toUpperCase() === upper) return full;
  }
  
  // Fallback: return as-is (cast, may cause issues if truly unknown)
  console.warn(`Unknown section value: ${section}, returning as-is`);
  return section as SectionFullName;
}

/**
 * Normalize any section value to standard code (EN, MATH, RD, SCI)
 * Use this when creating sessions or for validation
 */
export function normalizeToCode(section: string): SectionCode {
  const normalized = SECTION_VARIANTS_TO_CODE[section];
  if (normalized) return normalized;
  
  // Try case-insensitive lookup
  const upper = section.toUpperCase();
  for (const [variant, code] of Object.entries(SECTION_VARIANTS_TO_CODE)) {
    if (variant.toUpperCase() === upper) return code;
  }
  
  // Fallback: return as-is (cast, may cause issues if truly unknown)
  console.warn(`Unknown section value: ${section}, returning as-is`);
  return section as SectionCode;
}

/**
 * Get section code from form ID (e.g., FA_EN → EN, DR_MA → MATH)
 */
export function getCodeFromFormId(formId: string): SectionCode | null {
  const parts = formId.split('_');
  if (parts.length < 2) return null;
  
  const suffix = parts[parts.length - 1];
  return FORM_SUFFIX_TO_CODE[suffix] || null;
}

/**
 * Get full section name from form ID (e.g., FA_EN → English, DR_SC → Science)
 */
export function getFullNameFromFormId(formId: string): SectionFullName | null {
  const code = getCodeFromFormId(formId);
  if (!code) return null;
  return CODE_TO_FULL[code];
}

/**
 * Get all possible database variants for a section (for .in() queries during transition)
 * Returns array of all values that might exist in the database for this section
 */
export function getAllSectionVariants(section: string): string[] {
  const code = normalizeToCode(section);
  
  switch (code) {
    case 'EN':
      return ['EN', 'English', 'ENGLISH', 'english'];
    case 'MATH':
      return ['MA', 'Math', 'MATH', 'math'];
    case 'RD':
      return ['RD', 'Reading', 'READING', 'reading'];
    case 'SCI':
      return ['SC', 'SCI', 'Science', 'SCIENCE', 'science'];
    default:
      return [section];
  }
}

/**
 * Skill ID prefix for each subject
 */
export const SKILL_PREFIX: Record<SectionFullName, string> = {
  'English': 'E',
  'Math': 'M',
  'Reading': 'R',
  'Science': 'S',
};

/**
 * Get skill prefix from section (any format)
 */
export function getSkillPrefix(section: string): string {
  const fullName = normalizeToFullName(section);
  return SKILL_PREFIX[fullName] || '';
}
