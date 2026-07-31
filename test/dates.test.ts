import { describe, it, expect } from 'vitest'
import {
  monthKeyOf,
  addMonthsToKey,
  monthKeyToIdx,
  idxToMonthKey,
  daysInMonthKey,
  monthIndexOfKey,
  normalizeSheetDate,
} from '~/shared/dates'

describe('month bucketing', () => {
  it('keeps a day-01 transaction in its own month', () => {
    // This is the whole point: `new Date('2026-06-01').getMonth()` is May in
    // UTC-3, which used to push rent and salary into the previous month.
    expect(monthKeyOf('2026-06-01')).toBe('2026-06')
    expect(monthKeyOf('2026-01-01')).toBe('2026-01')
    expect(monthKeyOf('2026-12-31')).toBe('2026-12')
  })

  it('does not depend on the process timezone', () => {
    // `npm test` runs the suite twice, the second time under TZ=Pacific/Midway
    // (UTC-11), where the old `new Date(iso).getMonth()` bucketing is provably
    // wrong. Mutating process.env.TZ inside the test would not work — V8 has
    // already cached the zone — so the coverage has to come from the runner.
    const shiftsUnderNegativeOffset = new Date('2026-06-01').getMonth() !== 5
    if (shiftsUnderNegativeOffset) {
      // We are in a timezone that reproduces the original bug: prove the string
      // bucketing is unaffected by it.
      expect(monthKeyOf('2026-06-01')).toBe('2026-06')
    }
    expect(monthKeyOf('2026-06-01')).toBe('2026-06')
  })
})

describe('month arithmetic', () => {
  it('crosses year boundaries in both directions', () => {
    expect(addMonthsToKey('2026-01', -1)).toBe('2025-12')
    expect(addMonthsToKey('2026-12', 1)).toBe('2027-01')
    expect(addMonthsToKey('2026-06', -12)).toBe('2025-06')
  })

  it('round-trips through the absolute index', () => {
    for (const key of ['2024-01', '2025-07', '2026-12', '2027-04']) {
      expect(idxToMonthKey(monthKeyToIdx(key))).toBe(key)
    }
  })

  it('knows month lengths, including leap February', () => {
    expect(daysInMonthKey('2026-02')).toBe(28)
    expect(daysInMonthKey('2028-02')).toBe(29)
    expect(daysInMonthKey('2026-04')).toBe(30)
    expect(daysInMonthKey('2026-12')).toBe(31)
  })

  it('maps a key to a 0-indexed month', () => {
    expect(monthIndexOfKey('2026-01')).toBe(0)
    expect(monthIndexOfKey('2026-12')).toBe(11)
  })
})

describe('normalizeSheetDate', () => {
  it('converts the sheet M/D/YYYY into ISO', () => {
    // The sheet writes 6 de março as "3/6/2026". Reading it as-is made every
    // month bucket ("3/6/202") garbage on the direct-from-Sheets fallback path.
    expect(normalizeSheetDate('3/6/2026')).toBe('2026-03-06')
    expect(normalizeSheetDate('12/25/2025')).toBe('2025-12-25')
  })

  it('pads single-digit month and day', () => {
    expect(normalizeSheetDate('1/2/2026')).toBe('2026-01-02')
  })

  it('passes ISO through, dropping any time component', () => {
    expect(normalizeSheetDate('2026-06-01')).toBe('2026-06-01')
    expect(normalizeSheetDate('2026-06-01T03:00:00.000Z')).toBe('2026-06-01')
  })

  it('returns null instead of inventing a date', () => {
    // The old sync silently substituted "today" for an unparseable date, which
    // is worse than dropping the row: it lands real money in the wrong month.
    expect(normalizeSheetDate('')).toBeNull()
    expect(normalizeSheetDate('n/a')).toBeNull()
    expect(normalizeSheetDate('31/12/2026')).toBeNull() // D/M/YYYY is not the sheet format
  })

  it('produces a value monthKeyOf can bucket', () => {
    expect(monthKeyOf(normalizeSheetDate('7/1/2026')!)).toBe('2026-07')
  })
})
