interface PassageFields {
  passage_id?: string | null;
  passage_title?: string | null;
  passage_text?: string | null;
}

/** Group ids that mean "no passage" (left over from spreadsheet imports) */
const NO_GROUP = new Set(['', 'nan', 'null', 'none']);

/**
 * Passages are stored once, on one question of their group (`passage_id`).
 * Give every question in the group that passage so each one shows it.
 */
export function sharePassages<T extends PassageFields>(questions: T[]): T[] {
  const byGroup = new Map<string, { title: string | null; text: string }>();
  for (const q of questions) {
    const id = (q.passage_id ?? '').trim();
    if (NO_GROUP.has(id.toLowerCase()) || !q.passage_text || byGroup.has(id)) continue;
    byGroup.set(id, { title: q.passage_title ?? null, text: q.passage_text });
  }
  return questions.map(q => {
    const shared = byGroup.get((q.passage_id ?? '').trim());
    if (!shared) return q;
    return {
      ...q,
      passage_text: q.passage_text || shared.text,
      passage_title: q.passage_title || shared.title,
    };
  });
}
