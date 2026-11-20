/**
 * Calendar dates as 'yyyy-mm-dd' in the student's own time zone.
 * `toISOString().split('T')[0]` gives the UTC date, which in the US turns over
 * to tomorrow during the evening.
 */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Add whole days to a 'yyyy-mm-dd' date string. */
export function addDaysToDateString(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDateString(new Date(y, m - 1, d + days));
}
