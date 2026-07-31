import { describe, it, expect } from 'vitest'
import type { Transaction } from '~/types/transaction'

// The composable is auto-imported in the app; pull it in directly for the test.
import { useDashboardAnalytics } from '~/composables/useDashboardAnalytics'

const tx = (date: string, amount: number, extra: Partial<Transaction> = {}): Transaction => ({
  transactionId: date + amount,
  date,
  origin: 'Credit Card Gabriel',
  destination: 'Supermarket',
  description: 'compra',
  amount,
  recordedAt: '',
  remoteId: '',
  ...extra,
})

const { getCreditCardInvoice } = useDashboardAnalytics()

describe('credit card invoice cycle', () => {
  // Closing day 1, due day 8 — derived from seven consecutive
  // PAGAMENTO DEBITO AUTOMATICO rows landing on the 8th/9th.
  const rows = [
    tx('2026-06-30', 100),
    tx('2026-07-02', 200),
    tx('2026-07-31', 400),
    tx('2026-08-01', 800),
    tx('2026-08-02', 1600),
  ]

  it('does not roll over to next month on the last day of the month', () => {
    // The regression the user hit: on 31/07 the old "closes on the last day"
    // model showed August's invoice, which held almost nothing but projections.
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.closingDate).toBe('2026-08-01')
    expect(inv.total).toBe(200 + 400 + 800)
  })

  it('bills in the month the cycle closes, on the due day', () => {
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.dueMonth).toBe(7) // agosto
    expect(inv.dueYear).toBe(2026)
  })

  it('moves to the next cycle once the closing day has passed', () => {
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 7, 2) })
    expect(inv.closingDate).toBe('2026-09-01')
    expect(inv.total).toBe(1600)
  })

  it('counts installments due in the cycle — they are on the bill', () => {
    // Leaving them out understated the July 2026 invoice by more than half:
    // R$ 1.434,92 of recorded purchases against R$ 1.825,72 of installments.
    const withProjection = [...rows, tx('2026-07-15', 999, { projected: true })]
    const inv = getCreditCardInvoice(withProjection, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.total).toBe(200 + 400 + 800 + 999)
    expect(inv.installments).toBe(999)
  })

  it('only counts the requested card', () => {
    const both = [...rows, tx('2026-07-10', 5000, { origin: 'Credit Card Juliana' })]
    const inv = getCreditCardInvoice(both, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.total).toBe(200 + 400 + 800)
  })
})
