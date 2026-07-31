import { describe, it, expect } from 'vitest'
import {
  monthKeyOf,
  addMonthsToKey,
  monthKeyToIdx,
  idxToMonthKey,
  daysInMonthKey,
  monthIndexOfKey,
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
