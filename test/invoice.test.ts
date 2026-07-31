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
  // Closes on the last day of the month ("melhor dia de compra = 01", and the
  // best purchase day is the day after closing), due on the 8th of the next
  // month (seven consecutive PAGAMENTO DEBITO AUTOMATICO rows land on the 8th).
  const rows = [
    tx('2026-06-30', 100),
    tx('2026-07-02', 200),
    tx('2026-07-31', 400),
    tx('2026-08-01', 800),
    tx('2026-08-02', 1600),
  ]

  it('stays on the closing month while the closing day is still running', () => {
    // The bug: on 31/07 — the closing day itself — the old code jumped to the
    // invoice closing in August, which held nothing but projected installments.
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.closingDate).toBe('2026-07-31')
    expect(inv.total).toBe(200 + 400) // 02/07 e 31/07, não 30/06 nem 01/08
  })

  it('includes a purchase made on the closing day itself', () => {
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 6, 15) })
    expect(inv.items.map(t => t.date)).toContain('2026-07-31')
  })

  it('bills on the due day of the month after closing', () => {
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.dueMonth).toBe(7) // fecha 31/07, vence 08/08
    expect(inv.dueYear).toBe(2026)
  })

  it('rolls to the next cycle once the month turns', () => {
    // 01/08 is the "melhor dia de compra": it lands on the invoice closing 31/08.
    const inv = getCreditCardInvoice(rows, { referenceDate: new Date(2026, 7, 1) })
    expect(inv.closingDate).toBe('2026-08-31')
    expect(inv.total).toBe(800 + 1600)
  })

  it('handles months of different lengths', () => {
    const feb = getCreditCardInvoice([tx('2026-02-28', 50)], { referenceDate: new Date(2026, 1, 10) })
    expect(feb.closingDate).toBe('2026-02-28')
    expect(feb.total).toBe(50)
  })

  it('counts installments due in the cycle — they are on the bill', () => {
    // Leaving them out understated the July 2026 invoice by more than half:
    // R$ 1.434,92 of recorded purchases against R$ 1.825,72 of installments.
    const withProjection = [...rows, tx('2026-07-15', 999, { projected: true })]
    const inv = getCreditCardInvoice(withProjection, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.total).toBe(200 + 400 + 999)
    expect(inv.installments).toBe(999)
  })

  it('only counts the requested card', () => {
    const both = [...rows, tx('2026-07-10', 5000, { origin: 'Credit Card Juliana' })]
    const inv = getCreditCardInvoice(both, { referenceDate: new Date(2026, 6, 31) })
    expect(inv.total).toBe(200 + 400)
  })
})
