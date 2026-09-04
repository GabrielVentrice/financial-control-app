import type { Transaction } from '~/types/transaction'
import { isRealExpense, isIncome, categoryNameOf, expenseAmount } from './expenseRules'
import { monthKeyOf, daysInMonthKey, currentMonthKey } from './dates'

/**
 * The month, measured against what it was supposed to cost.
 *
 * Everything here is pure and framework-agnostic so it can be tested without a
 * database or a browser — the same reason shared/debt.ts exists. The server
 * util (server/utils/monthSnapshot.ts) only fetches and orchestrates.
 *
 * The one rule that governs this whole file: a month contains two different
 * kinds of row, and confusing them is the bug that makes a budget screen lie.
 *
 *   REALIZADO — money that already left. Counts as spent.
 *   COMPROMETIDO — installment rows #2..N that the projection generated for
 *     this month (`projected: true`). They have not happened, but they *will*,
 *     so they eat the budget without being spending yet.
 *
 * A screen that adds them together reports a month that never happened; one
 * that ignores the projected half promises headroom that is already spoken for.
 * Both halves are kept, separately, all the way to the UI.
 */

/** A target the user set for a category. */
export interface BudgetTarget {
  category: string
  monthlyAmount: number
  sortOrder: number
}

/** One category's month: what it cost, what it still will, what was allowed. */
export interface BudgetLine {
  category: string
  /** Already left the account or the card. */
  spent: number
  /** Projected installments still due this month. */
  committed: number
  /** spent + committed. */
  used: number
  /** The target, or 0 when the category has none. */
  target: number
  hasTarget: boolean
  /** target − used, floored at nothing (can go negative: that is the point). */
  remaining: number
  /** used / target, as a percentage. 0 when there is no target. */
  usedPct: number
  /** Realized rows only — a count of things that actually happened. */
  count: number
}

export interface MonthPace {
  monthKey: string
  daysInMonth: number
  /** 1..daysInMonth for the running month; daysInMonth for a closed one. */
  daysElapsed: number
  daysLeft: number
  /** Fraction of the month gone, 0..1. The fair line for "am I on pace?". */
  ratio: number
  /** True when monthKey is the month we are living. */
  isCurrent: boolean
}

export interface MonthTotals {
  income: number
  spent: number
  committed: number
  /** income − spent − committed. What the month still affords. */
  available: number
  /** Σ target of categories that have one. */
  budgeted: number
  /** Σ (target − used) over categories with a target, negatives included. */
  budgetRemaining: number
  /** available ÷ days left, or 0 on a closed month. */
  dailyAllowance: number
}

/**
 * How far into the month we are.
 *
 * A closed month is 100% elapsed — comparing it against a partial ratio would
 * flag every past month as over-pace forever. A future month is 0%.
 */
export function paceOf(monthKey: string, today: Date = new Date()): MonthPace {
  const daysInMonth = daysInMonthKey(monthKey)
  const nowKey = currentMonthKey(today)

  let daysElapsed: number
  if (monthKey === nowKey) daysElapsed = today.getDate()
  else if (monthKey < nowKey) daysElapsed = daysInMonth
  else daysElapsed = 0

  return {
    monthKey,
    daysInMonth,
    daysElapsed,
    daysLeft: Math.max(0, daysInMonth - daysElapsed),
    ratio: daysInMonth > 0 ? daysElapsed / daysInMonth : 0,
    isCurrent: monthKey === nowKey,
  }
}

/** Rows of one month, split by whether they already happened. */
export function splitMonth(transactions: Transaction[], monthKey: string) {
  const realized: Transaction[] = []
  const committed: Transaction[] = []

  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue
    if (!isRealExpense(t)) continue
    if (t.projected) committed.push(t)
    else realized.push(t)
  }

  return { realized, committed }
}

/** Money that landed in an account this month. Projected rows never are income. */
export function incomeOf(transactions: Transaction[], monthKey: string): number {
  let total = 0
  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue
    if (t.projected) continue
    if (isIncome(t)) total += expenseAmount(t)
  }
  return total
}

/**
 * One line per category, ordered by how close each is to breaking its target.
 *
 * Categories with a target come first even when they cost nothing this month —
 * a budget line at zero is information ("you have not touched groceries yet"),
 * and dropping it would make the list change shape from day to day. Categories
 * spent without a target follow, biggest first: they are the ones asking to be
 * given a number.
 */
export function buildBudgetLines(
  transactions: Transaction[],
  monthKey: string,
  targets: BudgetTarget[]
): BudgetLine[] {
  const { realized, committed } = splitMonth(transactions, monthKey)

  const lines = new Map<string, BudgetLine>()
  const blank = (category: string): BudgetLine => ({
    category,
    spent: 0,
    committed: 0,
    used: 0,
    target: 0,
    hasTarget: false,
    remaining: 0,
    usedPct: 0,
    count: 0,
  })

  const targetOrder = new Map<string, number>()
  for (const t of targets) {
    const line = blank(t.category)
    line.target = t.monthlyAmount
    line.hasTarget = t.monthlyAmount > 0
    lines.set(t.category, line)
    targetOrder.set(t.category, t.sortOrder)
  }

  for (const t of realized) {
    const name = categoryNameOf(t)
    const line = lines.get(name) ?? blank(name)
    line.spent += expenseAmount(t)
    line.count += 1
    lines.set(name, line)
  }

  for (const t of committed) {
    const name = categoryNameOf(t)
    const line = lines.get(name) ?? blank(name)
    line.committed += expenseAmount(t)
    lines.set(name, line)
  }

  const out = [...lines.values()]
  for (const line of out) {
    line.used = line.spent + line.committed
    line.remaining = line.hasTarget ? line.target - line.used : 0
    line.usedPct = line.hasTarget ? (line.used / line.target) * 100 : 0
  }

  return out.sort((a, b) => {
    if (a.hasTarget !== b.hasTarget) return a.hasTarget ? -1 : 1
    if (a.hasTarget && b.hasTarget) {
      if (b.usedPct !== a.usedPct) return b.usedPct - a.usedPct
      return (targetOrder.get(a.category) ?? 0) - (targetOrder.get(b.category) ?? 0)
    }
    return b.used - a.used
  })
}

export function monthTotals(
  lines: BudgetLine[],
  income: number,
  pace: MonthPace
): MonthTotals {
  let spent = 0
  let committed = 0
  let budgeted = 0
  let budgetRemaining = 0

  for (const line of lines) {
    spent += line.spent
    committed += line.committed
    if (line.hasTarget) {
      budgeted += line.target
      budgetRemaining += line.remaining
    }
  }

  const available = income - spent - committed

  return {
    income,
    spent,
    committed,
    available,
    budgeted,
    budgetRemaining,
    dailyAllowance: pace.daysLeft > 0 ? available / pace.daysLeft : 0,
  }
}

/**
 * Spending pace against the calendar.
 *
 * `expected` is what the budget allows by this day if it were spent evenly.
 * Committed installments are excluded from the comparison on purpose: they land
 * on the card's own dates, not at a steady drip, so counting them would report
 * "over pace" on the 10th of every month regardless of behaviour.
 */
export function paceSignal(lines: BudgetLine[], pace: MonthPace) {
  let spent = 0
  let budgeted = 0
  for (const line of lines) {
    if (!line.hasTarget) continue
    spent += line.spent
    budgeted += line.target
  }

  const expected = budgeted * pace.ratio
  return {
    spent,
    budgeted,
    expected,
    /** Positive means ahead of the calendar — spending faster than the month. */
    excess: spent - expected,
    onPace: spent <= expected,
  }
}
