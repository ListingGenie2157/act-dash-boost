/**
 * CSV → staging_items rows for the admin import page.
 * Only columns that exist in staging_items are sent; importing never deletes existing questions.
 */

/** Columns of public.staging_items an import may set (staging_id and lesson_code are not imported). */
const TABLE_COLUMNS = [
  'form_id', 'section', 'ord', 'passage_id', 'passage_title', 'passage_text', 'skill_code', 'difficulty',
  'question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer', 'explanation',
  'image_url', 'image_caption', 'image_position', 'underlined_text', 'reference_number',
  'position_in_passage', 'calculator_allowed',
] as const;

/** Header aliases accepted from older templates */
const ALIASES: Record<string, string> = { title: 'passage_title' };

const REQUIRED = ['form_id', 'section', 'skill_code', 'difficulty', 'question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer'];

const SECTIONS: Record<string, string> = {
  EN: 'English', ENGLISH: 'English',
  MA: 'Math', MATH: 'Math',
  RD: 'Reading', READING: 'Reading',
  SC: 'Science', SCI: 'Science', SCIENCE: 'Science',
};
const DIFFICULTIES: Record<string, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
const IMAGE_POSITIONS = ['above_question', 'inline', 'between'];

export interface StagingInsert {
  form_id: string;
  section: string;
  ord: number;
  passage_id: string | null;
  passage_title: string | null;
  passage_text: string | null;
  skill_code: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation: string | null;
  image_url: string | null;
  image_caption: string | null;
  image_position: string;
  underlined_text: string | null;
  reference_number: number | null;
  position_in_passage: number | null;
  calculator_allowed: boolean | null;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

/** RFC 4180 CSV: quoted fields may hold commas, line breaks and doubled quotes. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // drop byte-order mark
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim() !== ''));
}

const intOrNull = (v: string) => (v.trim() === '' || Number.isNaN(parseInt(v, 10)) ? null : parseInt(v, 10));
const textOrNull = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : null);

export function buildImportRows(csvText: string): {
  rows: StagingInsert[];
  errors: ImportError[];
  ignoredColumns: string[];
} {
  // Template comment lines start with '#'
  const [header = [], ...body] = parseCsv(csvText).filter(r => !(r[0] ?? '').trim().startsWith('#'));
  const keys = header.map(h => {
    const k = h.trim().toLowerCase();
    return ALIASES[k] ?? k;
  });
  const known = new Set<string>(TABLE_COLUMNS);
  const ignored = new Set<string>();
  const rows: StagingInsert[] = [];
  const errors: ImportError[] = [];

  body.forEach((values, i) => {
    const rowNum = i + 2; // spreadsheet row (header is row 1)
    const rec: Record<string, string> = {};
    keys.forEach((k, j) => {
      const v = (values[j] ?? '').trim();
      if (known.has(k)) rec[k] = v;
      else if (k) ignored.add(k); // column the table doesn't have: reported, never sent
    });
    const rowErrors: ImportError[] = [];
    const fail = (field: string, message: string) => rowErrors.push({ row: rowNum, field, message });

    for (const f of REQUIRED) if (!rec[f]) fail(f, `${f} is required`);

    const choiceE = (values[keys.indexOf('choice_e')] ?? '').trim();
    if (keys.includes('choice_e') && choiceE !== '') {
      fail('choice_e', 'The question table holds 4 choices (A–D); 5-choice questions cannot be imported');
    }
    const section = SECTIONS[(rec.section ?? '').toUpperCase()];
    if (rec.section && !section) fail('section', 'section must be English, Math, Reading or Science (or EN, MATH, RD, SCI)');
    const difficulty = DIFFICULTIES[(rec.difficulty ?? '').toUpperCase()];
    if (rec.difficulty && !difficulty) fail('difficulty', 'difficulty must be Easy, Medium or Hard');
    const answer = (rec.answer ?? '').toUpperCase();
    if (rec.answer && !['A', 'B', 'C', 'D'].includes(answer)) fail('answer', 'answer must be A, B, C or D');
    const imagePosition = rec.image_position || 'above_question';
    if (!IMAGE_POSITIONS.includes(imagePosition)) fail('image_position', 'image_position must be above_question, inline or between');

    if (rowErrors.length) { errors.push(...rowErrors); return; }

    rows.push({
      form_id: rec.form_id,
      section,
      ord: intOrNull(rec.ord ?? '') ?? i + 1,
      passage_id: textOrNull(rec.passage_id),
      passage_title: textOrNull(rec.passage_title),
      passage_text: textOrNull(rec.passage_text),
      skill_code: rec.skill_code,
      difficulty,
      question: rec.question,
      choice_a: rec.choice_a,
      choice_b: rec.choice_b,
      choice_c: rec.choice_c,
      choice_d: rec.choice_d,
      answer,
      explanation: textOrNull(rec.explanation),
      image_url: textOrNull(rec.image_url),
      image_caption: textOrNull(rec.image_caption),
      image_position: imagePosition,
      underlined_text: textOrNull(rec.underlined_text),
      reference_number: intOrNull(rec.reference_number ?? ''),
      position_in_passage: intOrNull(rec.position_in_passage ?? ''),
      calculator_allowed: rec.calculator_allowed ? rec.calculator_allowed.toUpperCase() === 'TRUE' : null,
    });
  });

  return { rows, errors, ignoredColumns: [...ignored] };
}

const normalize = (q: string) => q.trim().replace(/\s+/g, ' ').toLowerCase();

/** Drop rows whose question already exists in the same form, so re-importing a file adds nothing twice. */
export function onlyNewRows(
  rows: StagingInsert[],
  existing: Array<{ form_id: string; question: string | null }>,
): { fresh: StagingInsert[]; skipped: number } {
  const seen = new Set(existing.map(e => `${e.form_id}|${normalize(e.question ?? '')}`));
  const fresh: StagingInsert[] = [];
  let skipped = 0;
  for (const r of rows) {
    const key = `${r.form_id}|${normalize(r.question)}`;
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);
    fresh.push(r);
  }
  return { fresh, skipped };
}
