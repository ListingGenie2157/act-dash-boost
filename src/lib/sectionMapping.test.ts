import { describe, it, expect } from 'vitest';
import {
  normalizeToCode,
  normalizeToFullName,
  getCodeFromFormId,
  getFullNameFromFormId,
  getAllSectionVariants,
  getSkillPrefix,
  SECTION_CODES,
  SECTION_FULL_NAMES,
} from './sectionMapping';

describe('normalizeToCode', () => {
  it('maps standard codes to themselves', () => {
    expect(normalizeToCode('EN')).toBe('EN');
    expect(normalizeToCode('MATH')).toBe('MATH');
    expect(normalizeToCode('RD')).toBe('RD');
    expect(normalizeToCode('SCI')).toBe('SCI');
  });

  it('maps full names to codes', () => {
    expect(normalizeToCode('English')).toBe('EN');
    expect(normalizeToCode('Math')).toBe('MATH');
    expect(normalizeToCode('Reading')).toBe('RD');
    expect(normalizeToCode('Science')).toBe('SCI');
  });

  it('maps lowercase variants', () => {
    expect(normalizeToCode('english')).toBe('EN');
    expect(normalizeToCode('math')).toBe('MATH');
    expect(normalizeToCode('reading')).toBe('RD');
    expect(normalizeToCode('science')).toBe('SCI');
  });

  it('maps form suffixes to codes', () => {
    expect(normalizeToCode('MA')).toBe('MATH');
    expect(normalizeToCode('SC')).toBe('SCI');
  });

  it('maps uppercase variants', () => {
    expect(normalizeToCode('ENGLISH')).toBe('EN');
    expect(normalizeToCode('SCIENCE')).toBe('SCI');
  });
});

describe('normalizeToFullName', () => {
  it('maps codes to full names', () => {
    expect(normalizeToFullName('EN')).toBe('English');
    expect(normalizeToFullName('MATH')).toBe('Math');
    expect(normalizeToFullName('RD')).toBe('Reading');
    expect(normalizeToFullName('SCI')).toBe('Science');
  });

  it('maps full names to themselves', () => {
    expect(normalizeToFullName('English')).toBe('English');
    expect(normalizeToFullName('Math')).toBe('Math');
  });

  it('maps form suffixes', () => {
    expect(normalizeToFullName('MA')).toBe('Math');
    expect(normalizeToFullName('SC')).toBe('Science');
  });
});

describe('getCodeFromFormId', () => {
  it('extracts section code from form IDs', () => {
    expect(getCodeFromFormId('FA_EN')).toBe('EN');
    expect(getCodeFromFormId('FA_MA')).toBe('MATH');
    expect(getCodeFromFormId('FA_RD')).toBe('RD');
    expect(getCodeFromFormId('FA_SC')).toBe('SCI');
  });

  it('works with DR_ prefix', () => {
    expect(getCodeFromFormId('DR_EN')).toBe('EN');
    expect(getCodeFromFormId('DR_MA')).toBe('MATH');
  });

  it('returns null for invalid form IDs', () => {
    expect(getCodeFromFormId('INVALID')).toBeNull();
    expect(getCodeFromFormId('')).toBeNull();
  });
});

describe('getFullNameFromFormId', () => {
  it('returns full name from form ID', () => {
    expect(getFullNameFromFormId('FA_EN')).toBe('English');
    expect(getFullNameFromFormId('FA_MA')).toBe('Math');
    expect(getFullNameFromFormId('DR_SC')).toBe('Science');
  });

  it('returns null for invalid form IDs', () => {
    expect(getFullNameFromFormId('INVALID')).toBeNull();
  });
});

describe('getAllSectionVariants', () => {
  it('returns all english variants', () => {
    const variants = getAllSectionVariants('EN');
    expect(variants).toContain('EN');
    expect(variants).toContain('English');
  });

  it('returns all math variants', () => {
    const variants = getAllSectionVariants('Math');
    expect(variants).toContain('MA');
    expect(variants).toContain('Math');
    expect(variants).toContain('MATH');
  });

  it('returns all science variants', () => {
    const variants = getAllSectionVariants('SCI');
    expect(variants).toContain('SC');
    expect(variants).toContain('SCI');
    expect(variants).toContain('Science');
  });
});

describe('getSkillPrefix', () => {
  it('returns correct prefixes', () => {
    expect(getSkillPrefix('English')).toBe('E');
    expect(getSkillPrefix('Math')).toBe('M');
    expect(getSkillPrefix('Reading')).toBe('R');
    expect(getSkillPrefix('Science')).toBe('S');
  });

  it('works with codes', () => {
    expect(getSkillPrefix('EN')).toBe('E');
    expect(getSkillPrefix('MATH')).toBe('M');
  });
});

describe('Constants', () => {
  it('SECTION_CODES has 4 entries', () => {
    expect(SECTION_CODES).toHaveLength(4);
  });

  it('SECTION_FULL_NAMES has 4 entries', () => {
    expect(SECTION_FULL_NAMES).toHaveLength(4);
  });
});
