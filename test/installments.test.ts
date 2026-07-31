import { describe, it, expect } from 'vitest'
import type { Transaction } from '~/types/transaction'
import {
  parseInstallment,
  isInstallmentTransaction,
  processInstallments,
} from '~/shared/installments'
import { monthKeyOf } from '~/shared/dates'

const tx = (partial: Partial<Transaction>): Transaction => ({
  transactionId: 't1',
  date: '2026-01-10',
  origin: 'Credit Card Gabriel',
  destination: 'Supermarket',
  description: '',
  amount: 100,
  recordedAt: '',
  remoteId: '',
  ...partial,
})

describe('parseInstallment', () => {
  it('parses a real series', () => {
    expect(parseInstallment('Netflix 03/12')).toEqual({
      description: 'Netflix',
      current: 3,
      total: 12,
    })
  })

  it('rejects things that only look like a series', () => {
    expect(parseInstallment('Compra 13/01')).toBeNull()   // a date
    expect(parseInstallment('ORTOBOM 00/21')).toBeNull()  // anchor row
    expect(parseInstallment('Algo 05/03')).toBeNull()     // current > total
    expect(parseInstallment('Sem marcador')).toBeNull()
  })
})

describe('isInstallmentTransaction', () => {
  it('recognizes a card purchase with a marker regardless of category', () => {
    expect(isInstallmentTransaction(tx({ description: 'Netflix 01/12' }))).toBe(true)
  })

  it('recognizes the legacy financing category', () => {
    const t = tx({ origin: 'Installments/Financing', destination: 'Installments/Financing', description: 'Sofá 02/10' })
    expect(isInstallmentTransaction(t)).toBe(true)
  })

  it('ignores a plain debit purchase', () => {
    expect(isInstallmentTransaction(tx({ origin: 'Bank Account Gabriel', description: 'Padaria 01/12' }))).toBe(false)
  })
})

describe('processInstallments', () => {
  it('expands a series from its first installment, one row per month', () => {
    const result = processInstallments([
      tx({ transactionId: 'a', date: '2026-01-10', description: 'Netflix 01/06', amount: 50 }),
    ])

    expect(result).toHaveLength(6)
    expect(result.map(t => monthKeyOf(t.date))).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    ])
    expect(result.every(t => t.amount === 50)).toBe(true)
  })

  it('does not double count when later rows are already in the sheet', () => {
    // The sheet often carries every installment row, sometimes all on the same
    // date. Regenerating from 01/XX and discarding the originals is what keeps
    // the total honest.
    const result = processInstallments([
      tx({ transactionId: 'a', date: '2026-01-10', description: 'Netflix 01/03', amount: 50 }),
      tx({ transactionId: 'b', date: '2026-01-10', description: 'Netflix 02/03', amount: 50 }),
      tx({ transactionId: 'c', date: '2026-01-10', description: 'Netflix 03/03', amount: 50 }),
    ])

    expect(result).toHaveLength(3)
    expect(result.reduce((sum, t) => sum + t.amount, 0)).toBe(150)
  })

  it('is idempotent — running it twice changes nothing', () => {
    // The server expands before returning, and pages used to expand again on
    // the client. Whatever the call order, the totals must not move.
    const input = [tx({ transactionId: 'a', date: '2026-01-10', description: 'Netflix 01/06', amount: 50 })]

    const once = processInstallments(input)
    const twice = processInstallments(once)

    expect(twice).toHaveLength(once.length)
    expect(twice.map(t => t.date)).toEqual(once.map(t => t.date))
    expect(twice.reduce((s, t) => s + t.amount, 0)).toBe(once.reduce((s, t) => s + t.amount, 0))
  })

  it('keeps a series whose first installment predates the data window', () => {
    const input = [tx({ transactionId: 'a', date: '2026-01-10', description: 'Sofá 05/10', amount: 200 })]
    expect(processInstallments(input)).toHaveLength(1)
  })

  it('passes non-installment rows through untouched', () => {
    const plain = tx({ transactionId: 'z', description: 'Café' })
    expect(processInstallments([plain])).toEqual([plain])
  })
})
