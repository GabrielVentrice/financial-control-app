import { describe, it, expect } from 'vitest'
import {
  projectPayoff,
  capacityForMonth,
  paymentToClearIn,
  costOfDoingNothing,
} from '~/shared/debt'

/** Gabriel's real shape: installments roll off hard at the end of the year. */
const INSTALLMENTS: Record<string, number> = {
  '2026-08': 1781.3,
  '2026-09': 1570.73,
  '2026-10': 1439.01,
  '2026-11': 767.83,
  '2026-12': 225.8,
  '2027-01': 225.8,
  '2027-02': 225.8,
  '2027-03': 225.8,
  '2027-04': 56.4,
  '2027-05': 0,
}

const base = {
  balance: 6773.43,
  monthlyRate: 0.031,
  startMonth: '2026-08',
  baseSurplus: 0,
  installmentsByMonth: INSTALLMENTS,
  monthlyCut: 0,
}

describe('capacity', () => {
  it('is just the surplus in the starting month', () => {
    // Nothing has rolled off yet, so there is no freed money to add.
    expect(capacityForMonth('2026-08', { ...base })).toBeCloseTo(0, 2)
  })

  it('grows by exactly the installments that have ended', () => {
    // 1781.30 today − 225.80 in December = 1555.50 freed, and that is the
    // engine of the whole plan.
    expect(capacityForMonth('2026-12', { ...base })).toBeCloseTo(1555.5, 2)
  })

  it('never goes negative', () => {
    // A month that cannot pay pays nothing; it must not invent new debt on top
    // of the interest already being charged.
    const broke = { ...base, baseSurplus: -3000 }
    expect(capacityForMonth('2026-08', broke)).toBe(0)
  })

  it('adds a committed cut on top of the roll-off', () => {
    expect(capacityForMonth('2026-12', { ...base, monthlyCut: 500 })).toBeCloseTo(2055.5, 2)
  })
})

describe('payoff projection', () => {
  it('reports that a zero-surplus plan never pays off', () => {
    // Break-even plus no roll-off yet: the balance only grows. This is the
    // honest answer, and the reason the screen exists.
    const flat = projectPayoff({ ...base, installmentsByMonth: { '2026-08': 0 }, horizon: 24 })
    expect(flat.neverPaysOff).toBe(true)
    expect(flat.payoffMonth).toBeNull()
  })

  it('pays the debt off once the installments roll off', () => {
    const result = projectPayoff(base)
    expect(result.neverPaysOff).toBe(false)
    expect(result.payoffMonth).not.toBeNull()
    // The freed 1555/month clears ~7k of debt in a handful of months.
    expect(result.monthsToPayoff).toBeGreaterThan(3)
    expect(result.monthsToPayoff).toBeLessThan(12)
  })

  it('charges interest on the opening balance, before the payment lands', () => {
    const [first] = projectPayoff(base).months
    expect(first.opening).toBeCloseTo(6773.43, 2)
    expect(first.interest).toBeCloseTo(6773.43 * 0.031, 2)
  })

  it('never pays more than what is owed', () => {
    // A big cut must not overshoot into a negative balance and report a phantom
    // surplus in the final month.
    const result = projectPayoff({ ...base, monthlyCut: 50_000 })
    const last = result.months[result.months.length - 1]
    expect(last.closing).toBe(0)
    expect(last.payment).toBeCloseTo(last.opening + last.interest, 2)
    expect(result.monthsToPayoff).toBe(1)
  })

  it('closes each month into the next month opening', () => {
    const { months } = projectPayoff({ ...base, monthlyCut: 400 })
    for (let i = 1; i < months.length; i++) {
      expect(months[i].opening).toBeCloseTo(months[i - 1].closing, 6)
    }
  })

  it('a cheaper rate costs less interest over the same debt', () => {
    const expensive = projectPayoff({ ...base, monthlyCut: 600 })
    const cheap = projectPayoff({ ...base, monthlyCut: 600, monthlyRate: 0.015 })
    expect(cheap.totalInterest).toBeLessThan(expensive.totalInterest)
  })
})

describe('target payment', () => {
  it('clears the balance in exactly the months asked for', () => {
    const payment = paymentToClearIn(6773.43, 0.031, 6)
    let balance = 6773.43
    for (let i = 0; i < 6; i++) balance = balance * 1.031 - payment
    expect(balance).toBeCloseTo(0, 6)
  })

  it('falls back to plain division when there is no interest', () => {
    expect(paymentToClearIn(1200, 0, 12)).toBeCloseTo(100, 6)
  })
})

describe('cost of doing nothing', () => {
  it('compounds rather than multiplying', () => {
    // 12 × the monthly charge understates it — the interest itself earns
    // interest, which is exactly what makes an idle balance expensive.
    const compounded = costOfDoingNothing(6773.43, 0.031, 12)
    expect(compounded).toBeGreaterThan(6773.43 * 0.031 * 12)
  })
})
