/**
 * Thorough diagnostic question picker.
 *
 * Each D2 form holds a pool of questions covering its section's diagnostic skills.
 * A sitting gets QUESTIONS_PER_SKILL per skill, new questions first, with questions that
 * share a passage (same passage_id, or the same passage text) drawn together and shown
 * back to back.
 */

export const QUESTIONS_PER_SKILL = 2;

export interface PickableQuestion {
  question_id: string;
  skill_code: string | null;
  ord: number;
  passage_id?: string | null;
  passage_text?: string | null;
}

const NO_GROUP = new Set(['', 'nan', 'null', 'none']);

/** Questions with the same key are read against the same passage. */
function passageKey(q: PickableQuestion): string {
  const id = (q.passage_id ?? '').trim();
  if (!NO_GROUP.has(id.toLowerCase())) return `id:${id}`;
  const text = (q.passage_text ?? '').trim();
  return text ? `text:${text}` : `q:${q.question_id}`;
}

/**
 * @param seen question ids the student has already answered in an earlier sitting
 * @param random returns [0, 1); injectable for tests
 */
export function pickDiagnosticQuestions<T extends PickableQuestion>(
  pool: T[],
  seen: Set<string>,
  random: () => number = Math.random,
): T[] {
  const need = new Map<string, number>();
  for (const q of pool) if (q.skill_code) need.set(q.skill_code, QUESTIONS_PER_SKILL);

  // Random order, then new questions ahead of answered ones
  const order = pool
    .map(q => ({ q, r: random() }))
    .sort((a, b) => Number(seen.has(a.q.question_id)) - Number(seen.has(b.q.question_id)) || a.r - b.r)
    .map(x => x.q);

  const mates = new Map<string, T[]>();
  for (const q of order) {
    const k = passageKey(q);
    mates.set(k, [...(mates.get(k) ?? []), q]);
  }

  const taken = new Set<string>();
  const picked: T[] = [];
  const take = (q: T) => {
    if (taken.has(q.question_id) || !q.skill_code || (need.get(q.skill_code) ?? 0) <= 0) return false;
    taken.add(q.question_id);
    need.set(q.skill_code, (need.get(q.skill_code) ?? 0) - 1);
    picked.push(q);
    return true;
  };

  for (const q of order) {
    // Once a passage is opened, use it for every skill it can still cover
    if (take(q)) for (const mate of mates.get(passageKey(q)) ?? []) take(mate);
  }

  // Show passage-mates back to back, passages in form order
  const firstOrd = new Map<string, number>();
  for (const q of picked) {
    const k = passageKey(q);
    firstOrd.set(k, Math.min(firstOrd.get(k) ?? Infinity, q.ord));
  }
  return picked.sort((a, b) =>
    (firstOrd.get(passageKey(a))! - firstOrd.get(passageKey(b))!) ||
    passageKey(a).localeCompare(passageKey(b)) ||
    a.ord - b.ord);
}

/**
 * The questions of an unfinished sitting, or null when a new set should be picked.
 * A sitting's attempt rows are inserted in one batch, so they share created_at.
 *
 * @param lastFinishedAt when this section's diagnostic was last completed (null = never)
 * @param skillOf skill of a question id; a batch with more than QUESTIONS_PER_SKILL for a
 *   skill comes from the old whole-form diagnostic and is not resumed
 */
export function currentSitting(
  rows: Array<{ question_id: number | string; created_at: string | null }>,
  lastFinishedAt: string | null,
  skillOf: (questionId: string) => string | null,
): string[] | null {
  const after = rows.filter(r => r.created_at && (!lastFinishedAt || Date.parse(r.created_at) > Date.parse(lastFinishedAt)));
  if (!after.length) return null;
  const newest = Math.max(...after.map(r => Date.parse(r.created_at!)));
  const batch = [...new Set(after.filter(r => Date.parse(r.created_at!) === newest).map(r => String(r.question_id)))];
  const perSkill = new Map<string, number>();
  for (const id of batch) {
    const skill = skillOf(id) ?? `?${id}`;
    perSkill.set(skill, (perSkill.get(skill) ?? 0) + 1);
  }
  return [...perSkill.values()].every(n => n <= QUESTIONS_PER_SKILL) ? batch : null;
}
