/**
 * Month bucketing, timezone-safe.
 *
 * Transaction dates are plain "YYYY-MM-DD" calendar days with no time and no
 * zone. Feeding them to `new Date()` parses them as UTC midnight, which in
 * UTC-3 rolls back to the previous day — so every day-01 row (rent, salary)
 * landed in the previous month. The fix is to never build a Date just to know
 * which month a row belongs to: slice the string instead.
 *
 * Framework-agnostic on purpose — used by server utils and client composables.
 */

/** "2026-06-01" → "2026-06". The only correct way to bucket a transaction. */
export function monthKeyOf(isoDate: string): string {
  return (isoDate || '').substring(0, 7)
}

/** Current calendar month in the viewer's own timezone. */
export function currentMonthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Absolute month index, so month math is plain integer math. */
export function monthKeyToIdx(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return y * 12 + (m - 1)
}

export function idxToMonthKey(idx: number): string {
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`
}

export function addMonthsToKey(key: string, delta: number): string {
  return idxToMonthKey(monthKeyToIdx(key) + delta)
}

/** 0-11 month index of a key, for month-name lookups. */
export function monthIndexOfKey(key: string): number {
  return Number(key.split('-')[1]) - 1
}

/** Days in the month a key refers to. */
export function daysInMonthKey(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/**
 * Parses "YYYY-MM-DD" as a LOCAL calendar day. Use only when you genuinely need
 * a Date (sorting, day-level comparisons) — for month bucketing use monthKeyOf.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = (dateStr || '').split('-').map(Number)
  if (!y || !m || !d) return new Date(dateStr)
  return new Date(y, m - 1, d)
}
