import { supabase } from '@/integrations/supabase/client';
import type { LegacyQuestion } from '@/types';

/**
 * Question bank (DR_* forms in staging_items).
 *
 * Students read questions through v_staging_items_public (no answers) and get the
 * answer/explanation for a bank question only after answering, via get_bank_answers.
 * Locked exams (FA_/FB_/FC_, C1–C5, diagnostics) are never graded here; their answers
 * stay server-side in the edge functions.
 */

export const BANK_FORM_IDS = ['DR_EN', 'DR_MA', 'DR_RD', 'DR_SC'];

export type AnswerLetter = 'A' | 'B' | 'C' | 'D';
export const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D'];

export interface BankAnswer {
  answer: AnswerLetter;
  /** 0–3, index into the original (unshuffled) choices */
  correctIdx: number;
  explanation: string | null;
}

export interface BankQuestion {
  staging_id: number;
  form_id: string;
  skill_code: string | null;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  difficulty: string | null;
  passage_text: string | null;
  passage_title: string | null;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffleArray<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Fetch answers + explanations for bank questions (only DR_* items are returned). */
export async function getBankAnswers(ids: Array<number | string>): Promise<Map<string, BankAnswer>> {
  const numericIds = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
  const result = new Map<string, BankAnswer>();
  if (numericIds.length === 0) return result;

  for (let i = 0; i < numericIds.length; i += 100) {
    const { data, error } = await supabase.rpc('get_bank_answers', { p_ids: numericIds.slice(i, i + 100) });
    if (error) throw error;
    for (const row of (data ?? []) as Array<{ staging_id: number; answer: string; explanation: string | null }>) {
      const letter = (row.answer || '').trim().toUpperCase() as AnswerLetter;
      const correctIdx = LETTERS.indexOf(letter);
      if (correctIdx === -1) continue;
      result.set(String(row.staging_id), { answer: letter, correctIdx, explanation: row.explanation });
    }
  }
  return result;
}

/** Answer for a single bank question. Returns null if it is not a bank question. */
export async function getBankAnswer(id: number | string): Promise<BankAnswer | null> {
  const map = await getBankAnswers([id]);
  return map.get(String(id)) ?? null;
}

/**
 * Random selection of bank questions for a skill (lesson quiz, lesson practice).
 * Pulls only from DR_* forms so locked exam questions never appear in practice.
 */
export async function getRandomBankQuestions(skillCode: string, count: number): Promise<BankQuestion[]> {
  const { data, error } = await supabase
    .from('v_staging_items_public')
    .select('staging_id, form_id, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_text, passage_title')
    .eq('skill_code', skillCode)
    .in('form_id', BANK_FORM_IDS);

  if (error) throw error;

  const usable = (data ?? []).filter(
    (q): q is typeof q & { staging_id: number; form_id: string } =>
      q.staging_id !== null && q.form_id !== null && !!q.question && !!q.choice_a && !!q.choice_b
  );

  return shuffleArray(usable).slice(0, count).map(q => ({
    staging_id: q.staging_id,
    form_id: q.form_id,
    skill_code: q.skill_code,
    question: q.question ?? '',
    choice_a: q.choice_a ?? '',
    choice_b: q.choice_b ?? '',
    choice_c: q.choice_c ?? '',
    choice_d: q.choice_d ?? '',
    difficulty: q.difficulty,
    passage_text: q.passage_text,
    passage_title: q.passage_title,
  }));
}

/** Convert bank questions to the shape QuizComponent/DrillComponent render (answer graded later). */
export function toLegacyQuestions(questions: BankQuestion[]): LegacyQuestion[] {
  return questions.map(q => ({
    id: String(q.staging_id),
    question: q.question,
    options: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
    correctAnswer: -1, // unknown until graded via get_bank_answers
    explanation: '',
    difficulty: q.difficulty === 'easy' ? 'easy' : q.difficulty === 'hard' ? 'hard' : 'medium',
    passageText: q.passage_text ?? undefined,
    passageTitle: q.passage_title ?? undefined,
  }));
}

/** gradeAnswer implementation for QuizComponent / DrillComponent backed by the bank. */
export async function gradeBankAnswer(questionId: string): Promise<{ correctIdx: number; explanation: string | null }> {
  const result = await getBankAnswer(questionId);
  if (!result) throw new Error(`No answer key for question ${questionId}`);
  return { correctIdx: result.correctIdx, explanation: result.explanation };
}

/** Map a skill code (E1.F1, M2.A, R1.B, S2.A) to the drill subject used in routes. */
export function subjectFromSkillCode(code: string): 'English' | 'Math' | 'Reading' | 'Science' | null {
  switch (code.trim().charAt(0).toUpperCase()) {
    case 'E': return 'English';
    case 'M': return 'Math';
    case 'R': return 'Reading';
    case 'S': return 'Science';
    default: return null;
  }
}

/** Route for a 10-question drill on one skill, e.g. /drill/Science/play?mode=skill&skill=S2.A */
export function skillDrillPath(skillCode: string): string {
  const subject = subjectFromSkillCode(skillCode);
  if (!subject) return '/pacing-lab';
  const params = new URLSearchParams({ mode: 'skill', skill: skillCode.toUpperCase(), questions: '10', time: '450' });
  return `/drill/${subject}/play?${params.toString()}`;
}

const BANK_FORM_BY_PREFIX: Record<string, string> = { E: 'DR_EN', M: 'DR_MA', R: 'DR_RD', S: 'DR_SC' };

/**
 * Save one graded bank answer (attempt with time on question); wrong answers also go to the review queue.
 * Errors are reported, never thrown, so grading UI is not interrupted.
 */
export async function recordBankAttempt(params: {
  userId: string;
  questionId: string;
  skillCode: string;
  questionOrd: number;
  choiceOrder: number[];
  selectedIdx: number;
  correctIdx: number;
  timeMs: number;
  formId?: string;
}): Promise<void> {
  const formId = params.formId ?? BANK_FORM_BY_PREFIX[params.skillCode.trim().charAt(0).toUpperCase()] ?? 'DR_EN';
  const { error } = await supabase.from('attempts').insert({
    user_id: params.userId,
    question_id: Number(params.questionId),
    form_id: formId,
    question_ord: params.questionOrd,
    choice_order: params.choiceOrder,
    correct_idx: params.correctIdx,
    selected_idx: params.selectedIdx,
    time_ms: Math.max(0, Math.round(params.timeMs)),
  });
  if (error) throw error;
  if (params.selectedIdx !== params.correctIdx) {
    await supabase.from('review_queue').insert({
      user_id: params.userId,
      question_id: Number(params.questionId),
      due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      interval_days: 2,
    });
  }
}
