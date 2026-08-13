import type { Transaction } from '~/types/transaction'
import { currentMonthKey, monthKeyOf, monthKeyToIdx, idxToMonthKey } from './dates'
import { isExcludedDescription, isCreditCard } from './expenseRules'
import { parseInstallment } from './installments'

/**
 * Debt analytics over the raw ledger, in plain JS.
 *
 * These used to be four raw SQL queries over the Postgres mirror of the book
 * (server/utils/debtPlan.ts). With the mirror gone they run over the in-memory
 * Bkper snapshot instead — same semantics, now testable under vitest and under
 * the TZ=Pacific/Midway pass.
 *
 * IMPORTANT: feed these the RAW snapshot, never the installment-expanded
 * pipeline — projected rows would count as real account movement.
 */

/**
 * Net movement on the account strictly AFTER the anchor date.
 *
 * "After", not "on or after", on purpose: the anchor is a closing balance for
 * its own day, so replaying that day's transactions would count them twice.
 * The duplicated automatic card debit is excluded from the outflow only — the
 * SQL it replaces did the same.
 */
export function movementSince(
  transactions: Transaction[],
  account: string,
  anchorDate: string
): number {
  let inflow = 0
  let outflow = 0

  for (const t of transactions) {
    if (t.date <= anchorDate) continue
    if (t.destination === account) inflow += t.amount
    if (t.origin === account && !isExcludedDescription(t)) outflow += t.amount
  }

  return inflow - outflow
}

/** Interest actually charged on the account, by month, oldest first. */
export function interestHistory(
  transactions: Transaction[],
  account: string
): { monthKey: string; amount: number }[] {
  const byMonth = new Map<string, number>()

  for (const t of transactions) {
    if (t.origin !== account) continue
    if (!/juros/.test((t.description || '').toLowerCase())) continue
    const key = monthKeyOf(t.date)
    byMonth.set(key, (byMonth.get(key) || 0) + t.amount)
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, amount]) => ({ monthKey, amount }))
}

const median = (xs: number[]): number => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Recurring cash flow, measured over whole months that already closed.
 *
 * The MEDIAN month, not the average — averaging folded a one-off tax refund
 * into the monthly surplus once and promised a payoff date funded by a
 * windfall. The current month is excluded entirely: it is half-lived (salary
 * landed, card bill and boletos have not).
 *
 * A month enters the sample when the LEDGER has any row in it, not only when
 * the account moved — the SQL GROUP BY this replaces materialized every month
 * with transactions, contributing zeros to the median for months where the
 * account sat still. Zero-filling months with no data at all would change the
 * median, so those stay out.
 */
export function cashflowMedian(
  transactions: Transaction[],
  account: string,
  months: number,
  refKey: string = currentMonthKey()
): { income: number; outflow: number; surplus: number; months: number } {
  const endIdx = monthKeyToIdx(refKey)
  const startKey = idxToMonthKey(endIdx - months)

  const byMonth = new Map<string, { income: number; outflow: number }>()

  for (const t of transactions) {
    const key = monthKeyOf(t.date)
    if (key < startKey || key >= refKey) continue

    const bucket = byMonth.get(key) || { income: 0, outflow: 0 }
    if (t.destination === account) bucket.income += t.amount
    if (t.origin === account && !isExcludedDescription(t)) bucket.outflow += t.amount
    byMonth.set(key, bucket)
  }

  const monthly = [...byMonth.values()]

  return {
    income: median(monthly.map(m => m.income)),
    outflow: median(monthly.map(m => m.outflow)),
    surplus: median(monthly.map(m => m.income - m.outflow)),
    months: monthly.length,
  }
}

/**
 * Installment load per month going forward.
 *
 * Derived from the installment NUMBER, not from counting the months the data
 * carries — the ledger clusters whole series on one date, so month-counting
 * would report finished series as active and miss the roll-off entirely.
 * Anchors on the LOWEST-numbered row of each series: it pins when installment
 * #1 was due, and therefore when the series ends. Same rule the installments
 * page uses.
 */
export function installmentLoad(
  transactions: Transaction[],
  person: string | null | undefined,
  horizon: number,
  refKey: string = currentMonthKey()
): Record<string, number> {
  const series = new Map<
    string,
    { total: number; start: number; amount: number; anchorNum: number }
  >()

  for (const t of transactions) {
    if (!isCreditCard(t.origin)) continue
    if (person && !(t.origin || '').toLowerCase().includes(person.toLowerCase())) continue

    const info = parseInstallment(t.description || '')
    if (!info) continue

    const key = `${info.description.toLowerCase()}_${t.origin}_${info.total}`
    const prev = series.get(key)
    if (prev && prev.anchorNum <= info.current) continue

    series.set(key, {
      total: info.total,
      start: monthKeyToIdx(monthKeyOf(t.date)) - (info.current - 1),
      amount: Math.abs(t.amount),
      anchorNum: info.current,
    })
  }

  const refIdx = monthKeyToIdx(refKey)
  const byMonth: Record<string, number> = {}
  for (let i = 0; i < horizon; i++) byMonth[idxToMonthKey(refIdx + i)] = 0

  for (const s of series.values()) {
    for (let i = 0; i < horizon; i++) {
      const monthIdx = refIdx + i
      if (monthIdx >= s.start && monthIdx < s.start + s.total) {
        byMonth[idxToMonthKey(monthIdx)] += s.amount
      }
    }
  }

  return byMonth
}
