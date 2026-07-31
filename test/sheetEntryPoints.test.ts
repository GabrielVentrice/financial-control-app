import { describe, it, expect } from 'vitest'
import { normalizeSheetDate, monthKeyOf } from '~/shared/dates'

/**
 * Transactions reach the app through three doors: the live Sheets read, the
 * cached CSV, and the Postgres sync. All three must hand over ISO dates —
 * production was serving raw "M/D/YYYY" from the CSV cache long after the other
 * two were fixed, and every month total on every screen was wrong because of it.
 */
describe('sheet entry points agree on the date format', () => {
  const sheetRows = ['7/30/2026', '12/1/2025', '1/2/2026', '2026-06-01']

  it('normalizes every shape the sheet produces', () => {
    expect(sheetRows.map(d => normalizeSheetDate(d))).toEqual([
      '2026-07-30', '2025-12-01', '2026-01-02', '2026-06-01',
    ])
  })

  it('yields dates that sort and bucket as plain strings', () => {
    const iso = sheetRows.map(d => normalizeSheetDate(d)!).sort()
    expect(iso).toEqual(['2025-12-01', '2026-01-02', '2026-06-01', '2026-07-30'])
    expect(iso.map(monthKeyOf)).toEqual(['2025-12', '2026-01', '2026-06', '2026-07'])
  })

  it('never yields a raw sheet date', () => {
    // The regression that shipped: "7/30/2026".substring(0,7) === "7/30/20",
    // a month key that matches nothing, so every total silently read zero.
    for (const raw of sheetRows) {
      const out = normalizeSheetDate(raw)!
      expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(monthKeyOf(out)).toMatch(/^\d{4}-\d{2}$/)
    }
  })
})
