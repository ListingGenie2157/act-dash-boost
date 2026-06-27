import { describe, it, expect } from 'vitest';
import {
  sessionStartSchema,
  submitResponseSchema,
  sessionFinishSchema,
  drillRunnerSchema,
  diagnosticFormIdSchema,
  validateInput,
  safeValidateInput,
} from './edgeFunctionSchemas';

describe('sessionStartSchema', () => {
  it('accepts valid input', () => {
    const result = sessionStartSchema.safeParse({
      form_id: 'FA_EN',
      section: 'EN',
      coached: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid form_id', () => {
    const result = sessionStartSchema.safeParse({
      form_id: 'INVALID_FORM',
      section: 'EN',
      coached: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid section', () => {
    const result = sessionStartSchema.safeParse({
      form_id: 'FA_EN',
      section: 'INVALID',
      coached: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing coached field', () => {
    const result = sessionStartSchema.safeParse({
      form_id: 'FA_EN',
      section: 'EN',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid sections', () => {
    for (const section of ['EN', 'MATH', 'RD', 'SCI']) {
      const result = sessionStartSchema.safeParse({
        form_id: 'FA_EN',
        section,
        coached: true,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid form_id prefixes', () => {
    for (const formId of ['FA_EN', 'FB_MA', 'FC_RD', 'DR_SC']) {
      const result = sessionStartSchema.safeParse({
        form_id: formId,
        section: 'EN',
        coached: false,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('submitResponseSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts valid input', () => {
    const result = submitResponseSchema.safeParse({
      session_id: validUuid,
      question_id: 'q123',
      selected: 'A',
      time_ms: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid session_id (not UUID)', () => {
    const result = submitResponseSchema.safeParse({
      session_id: 'not-a-uuid',
      question_id: 'q123',
      selected: 'A',
      time_ms: 5000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid selected answer', () => {
    const result = submitResponseSchema.safeParse({
      session_id: validUuid,
      question_id: 'q123',
      selected: 'F',
      time_ms: 5000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative time_ms', () => {
    const result = submitResponseSchema.safeParse({
      session_id: validUuid,
      question_id: 'q123',
      selected: 'A',
      time_ms: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects time_ms over 1 hour', () => {
    const result = submitResponseSchema.safeParse({
      session_id: validUuid,
      question_id: 'q123',
      selected: 'A',
      time_ms: 3600001,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid answer choices', () => {
    for (const selected of ['A', 'B', 'C', 'D', 'E']) {
      const result = submitResponseSchema.safeParse({
        session_id: validUuid,
        question_id: 'q123',
        selected,
        time_ms: 5000,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('sessionFinishSchema', () => {
  it('accepts valid UUID', () => {
    const result = sessionFinishSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const result = sessionFinishSchema.safeParse({
      session_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = sessionFinishSchema.safeParse({
      session_id: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('drillRunnerSchema', () => {
  it('accepts valid input', () => {
    const result = drillRunnerSchema.safeParse({
      subject: 'Math',
      n: 10,
    });
    expect(result.success).toBe(true);
  });

  it('defaults n to 10', () => {
    const result = drillRunnerSchema.safeParse({ subject: 'Reading' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.n).toBe(10);
    }
  });

  it('rejects invalid subject', () => {
    const result = drillRunnerSchema.safeParse({ subject: 'History' });
    expect(result.success).toBe(false);
  });

  it('rejects n > 100', () => {
    const result = drillRunnerSchema.safeParse({ subject: 'Math', n: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects n < 1', () => {
    const result = drillRunnerSchema.safeParse({ subject: 'Math', n: 0 });
    expect(result.success).toBe(false);
  });
});

describe('diagnosticFormIdSchema', () => {
  it('accepts valid form IDs', () => {
    for (const formId of ['FA_EN', 'D2EN', 'D2SC', 'DR_MA']) {
      const result = diagnosticFormIdSchema.safeParse({ formId });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid form ID', () => {
    const result = diagnosticFormIdSchema.safeParse({ formId: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

describe('validateInput', () => {
  it('returns parsed data on success', () => {
    const data = validateInput(sessionFinishSchema, {
      session_id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(data.session_id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('throws on invalid input', () => {
    expect(() =>
      validateInput(sessionFinishSchema, { session_id: 'bad' })
    ).toThrow();
  });

  it('includes context in error message', () => {
    expect(() =>
      validateInput(sessionFinishSchema, { session_id: 'bad' }, 'Test context')
    ).toThrow('Test context');
  });
});

describe('safeValidateInput', () => {
  it('returns success for valid input', () => {
    const result = safeValidateInput(sessionFinishSchema, {
      session_id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('returns error for invalid input', () => {
    const result = safeValidateInput(sessionFinishSchema, { session_id: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});
