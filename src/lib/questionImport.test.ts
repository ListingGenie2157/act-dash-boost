import { describe, it, expect } from 'vitest';
import { parseCsv, buildImportRows, onlyNewRows } from './questionImport';

const HEADER = 'form_id,section,ord,skill_code,difficulty,question,choice_a,choice_b,choice_c,choice_d,answer';

describe('parseCsv', () => {
  it('keeps line breaks, commas and doubled quotes inside quoted fields', () => {
    const rows = parseCsv('a,b\n"line one\nline two","say ""hi"", ok"\n');
    expect(rows).toEqual([['a', 'b'], ['line one\nline two', 'say "hi", ok']]);
  });
  it('handles Windows line endings and a leading byte-order mark', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('buildImportRows', () => {
  it('sends only columns the question table has, and reports the rest', () => {
    const csv = `${HEADER},choice_e,passage_format,marked_text\nD3EN,English,1,E1.A,Easy,Q?,a,b,c,d,A,,prose,x\n`;
    const { rows, errors, ignoredColumns } = buildImportRows(csv);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0])).not.toContain('choice_e');
    expect(Object.keys(rows[0])).not.toContain('passage_format');
    expect(Object.keys(rows[0])).not.toContain('marked_text');
    expect(ignoredColumns.sort()).toEqual(['choice_e', 'marked_text', 'passage_format']);
  });

  it('skips # comment lines from the downloaded template', () => {
    const csv = `# ACT Question Import CSV Template
# Sections: EN, MATH

${HEADER}
X,EN,1,E1.A,Easy,Q1,a,b,c,d,A
`;
    const { rows, errors } = buildImportRows(csv);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });

  it('stores sections the way the app reads them', () => {
    const csv = `${HEADER}\nX,EN,1,E1.A,Easy,Q1,a,b,c,d,A\nX,MATH,2,M1.A,hard,Q2,a,b,c,d,B\nX,SCI,3,S1.A,Medium,Q3,a,b,c,d,C\nX,Reading,4,R1.A,Easy,Q4,a,b,c,d,D\n`;
    const { rows, errors } = buildImportRows(csv);
    expect(errors).toEqual([]);
    expect(rows.map(r => r.section)).toEqual(['English', 'Math', 'Science', 'Reading']);
    expect(rows[1].difficulty).toBe('Hard');
  });

  it('rejects a 5-choice question instead of silently dropping choice E', () => {
    const csv = `${HEADER},choice_e\nX,Math,1,M1.A,Easy,Q,a,b,c,d,E,e\n`;
    const { rows, errors } = buildImportRows(csv);
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatchObject({ row: 2, field: 'choice_e' });
  });

  it('reports missing required fields with the spreadsheet row number', () => {
    const csv = `${HEADER}\nX,English,1,,Easy,Q,a,b,c,d,A\n`;
    const { rows, errors } = buildImportRows(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toEqual([{ row: 2, field: 'skill_code', message: 'skill_code is required' }]);
  });
});

describe('onlyNewRows', () => {
  it('skips questions already in that form (same question text), never deleting anything', () => {
    const { rows } = buildImportRows(`${HEADER}\nX,English,1,E1.A,Easy,Old  question,a,b,c,d,A\nX,English,2,E1.A,Easy,New question,a,b,c,d,A\n`);
    const { fresh, skipped } = onlyNewRows(rows, [{ form_id: 'X', question: 'old question' }]);
    expect(fresh.map(r => r.question)).toEqual(['New question']);
    expect(skipped).toBe(1);
  });
});
