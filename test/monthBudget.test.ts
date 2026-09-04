import { describe, it, expect } from 'vitest'
import type { Transaction } from '~/types/transaction'
import {
  paceOf,
  splitMonth,
  incomeOf,
  buildBudgetLines,
  monthTotals,
  paceSignal,
  type BudgetTarget,
} from '~/shared/monthBudget'

const tx = (partial: Partial<Transaction>): Transaction => ({
  transactionId: 't1',
  date: '2026-09-15',
  origin: 'Credit Card Gabriel',
  destination: 'Food',
  description: '',
  amount: 100,
  recordedAt: '',
  remoteId: '',
  ...partial,
})

const targets = (...pairs: [string, number][]): BudgetTarget[] =>
  pairs.map(([category, monthlyAmount], i) => ({ category, monthlyAmount, sortOrder: i }))

describe('realized vs committed', () => {
  /**
   * The rule the whole screen rests on. A projected installment is a forecast:
   * counting it as spent reports a month that has not happened, and dropping it
   * promises headroom that is already spoken for.
   */
  it('never counts a projected installment as spent', () => {
    const rows = [
      tx({ transactionId: 'a', amount: 200 }),
      tx({ transactionId: 'b', amount: 420, destination: 'Installments/Financing', projected: true }),
    ]

    const { realized, committed } = splitMonth(rows, '2026-09')
    expect(realized.map(t => t.transactionId)).toEqual(['a'])
    expect(committed.map(t => t.transactionId)).toEqual(['b'])
  })

  it('keeps the two halves apart all the way to the category line', () => {
    const rows = [
      tx({ destination: 'Food', amount: 300 }),
      tx({ destination: 'Food', amount: 150, projected: true }),
    ]

    const [food] = buildBudgetLines(rows, '2026-09', targets(['Food', 1000]))
    expect(food.spent).toBe(300)
    expect(food.committed).toBe(150)
    expect(food.used).toBe(450)
    expect(food.remaining).toBe(550)
    // The count is things that happened, not things forecast.
    expect(food.count).toBe(1)
  })

  it('leaves projected rows out of income', () => {
    const rows = [
      tx({ origin: 'Salary Gabriel', destination: 'Bank Account Gabriel', amount: 11000 }),
      tx({ origin: 'Salary Gabriel', destination: 'Bank Account Gabriel', amount: 11000, projected: true }),
    ]
    expect(incomeOf(rows, '2026-09')).toBe(11000)
  })
})

describe('budget lines', () => {
  it('keeps a target with no spending, so the list does not change shape daily', () => {
    const lines = buildBudgetLines([], '2026-09', targets(['Supermarket', 800], ['Food', 400]))
    expect(lines.map(l => l.category)).toEqual(['Supermarket', 'Food'])
    expect(lines.every(l => l.spent === 0 && l.hasTarget)).toBe(true)
  })

  it('lets an overspent category go negative instead of clamping at zero', () => {
    const rows = [tx({ destination: 'Food', amount: 700 })]
    const [food] = buildBudgetLines(rows, '2026-09', targets(['Food', 400]))
    expect(food.remaining).toBe(-300)
    expect(Math.round(food.usedPct)).toBe(175)
  })

  it('sorts by how close each category is to breaking, not by amount', () => {
    const rows = [
      tx({ transactionId: 'a', destination: 'Rent', amount: 3800 }), // 95% of 4000
      tx({ transactionId: 'b', destination: 'Food', amount: 380 }), //  95% of  400
      tx({ transactionId: 'c', destination: 'Lazer', amount: 290 }), // 96,7% of 300
    ]
    const lines = buildBudgetLines(rows, '2026-09', targets(['Rent', 4000], ['Food', 400], ['Lazer', 300]))
    expect(lines[0].category).toBe('Lazer')
  })

  it('lists untargeted spending after the budget, biggest first', () => {
    const rows = [
      tx({ destination: 'Gifts & Donations', amount: 240 }),
      tx({ destination: 'Pets', amount: 70 }),
      tx({ destination: 'Food', amount: 100 }),
    ]
    const lines = buildBudgetLines(rows, '2026-09', targets(['Food', 400]))
    expect(lines.map(l => l.category)).toEqual(['Food', 'Gifts & Donations', 'Pets'])
  })
})

describe('pace', () => {
  it('treats a closed month as fully elapsed', () => {
    const pace = paceOf('2026-08', new Date(2026, 8, 15))
    expect(pace.ratio).toBe(1)
    expect(pace.daysLeft).toBe(0)
    expect(pace.isCurrent).toBe(false)
  })

  it('measures the running month against the day of the month', () => {
    const pace = paceOf('2026-09', new Date(2026, 8, 12))
    expect(pace.daysInMonth).toBe(30)
    expect(pace.daysElapsed).toBe(12)
    expect(pace.daysLeft).toBe(18)
    expect(pace.ratio).toBeCloseTo(0.4)
  })

  it('treats a future month as untouched', () => {
    expect(paceOf('2026-12', new Date(2026, 8, 12)).ratio).toBe(0)
  })

  /**
   * Committed installments land on the card's own dates, not at a steady drip.
   * Counting them against the calendar would flag "over pace" on the 10th of
   * every month no matter how the month was actually going.
   */
  it('judges pace on realized spending only', () => {
    const rows = [
      tx({ destination: 'Food', amount: 100 }),
      tx({ destination: 'Food', amount: 900, projected: true }),
    ]
    const lines = buildBudgetLines(rows, '2026-09', targets(['Food', 1000]))
    const signal = paceSignal(lines, paceOf('2026-09', new Date(2026, 8, 15)))

    expect(signal.spent).toBe(100)
    expect(signal.expected).toBe(500)
    expect(signal.onPace).toBe(true)
  })
})

describe('month totals', () => {
  it('reports what the month still affords, and per remaining day', () => {
    const rows = [
      tx({ origin: 'Salary Gabriel', destination: 'Bank Account Gabriel', amount: 11000 }),
      tx({ destination: 'Food', amount: 1000 }),
      tx({ destination: 'Installments/Financing', amount: 2000, projected: true }),
    ]
    const pace = paceOf('2026-09', new Date(2026, 8, 20)) // 10 days left
    const totals = monthTotals(buildBudgetLines(rows, '2026-09', targets(['Food', 1200])), incomeOf(rows, '2026-09'), pace)

    expect(totals.income).toBe(11000)
    expect(totals.spent).toBe(1000)
    expect(totals.committed).toBe(2000)
    expect(totals.available).toBe(8000)
    expect(totals.dailyAllowance).toBe(800)
    expect(totals.budgeted).toBe(1200)
    expect(totals.budgetRemaining).toBe(200)
  })
})

describe('timezone', () => {
  /**
   * The suite runs a second time under TZ=Pacific/Midway. A day-01 row is where
   * this breaks: `new Date("2026-09-01")` is UTC midnight, which west of
   * Greenwich is still August, and salary plus rent silently land in the wrong
   * month. Bucketing is a string slice for exactly this reason.
   */
  it('buckets a day-01 row into its own month in any timezone', () => {
    const rows = [
      tx({ date: '2026-09-01', origin: 'Salary Gabriel', destination: 'Bank Account Gabriel', amount: 11000 }),
      tx({ date: '2026-08-31', destination: 'Food', amount: 500 }),
    ]

    expect(incomeOf(rows, '2026-09')).toBe(11000)
    expect(incomeOf(rows, '2026-08')).toBe(0)
    expect(splitMonth(rows, '2026-08').realized).toHaveLength(1)
    expect(splitMonth(rows, '2026-09').realized).toHaveLength(0)
  })
})
