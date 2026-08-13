import { describe, it, expect } from 'vitest'
import {
  movementSince,
  interestHistory,
  cashflowMedian,
  installmentLoad,
} from '../shared/debtAnalytics'
import type { Transaction } from '../types/transaction'

const ACCOUNT = 'Bank Account Gabriel'

let seq = 0
function tx(partial: Partial<Transaction>): Transaction {
  seq += 1
  return {
    transactionId: `t${seq}`,
    date: '2026-01-15',
    origin: '',
    destination: '',
    description: '',
    amount: 0,
    recordedAt: '',
    remoteId: '',
    ...partial,
  }
}

describe('movementSince', () => {
  it('is strict about the anchor date: rows ON the anchor day do not count', () => {
    const txs = [
      tx({ date: '2026-08-01', destination: ACCOUNT, amount: 1000 }),
      tx({ date: '2026-08-02', destination: ACCOUNT, amount: 500 }),
    ]
    expect(movementSince(txs, ACCOUNT, '2026-08-01')).toBe(500)
  })

  it('nets inflow against outflow on the account', () => {
    const txs = [
      tx({ date: '2026-08-02', destination: ACCOUNT, amount: 3000 }),
      tx({ date: '2026-08-03', origin: ACCOUNT, destination: 'Food', amount: 800 }),
    ]
    expect(movementSince(txs, ACCOUNT, '2026-08-01')).toBe(2200)
  })

  it('excludes the duplicated automatic card debit from the outflow only', () => {
    const txs = [
      tx({ date: '2026-08-02', origin: ACCOUNT, description: 'Pagamento Debito Automatico', amount: 900 }),
      tx({ date: '2026-08-02', origin: ACCOUNT, description: 'mercado', amount: 100 }),
    ]
    expect(movementSince(txs, ACCOUNT, '2026-08-01')).toBe(-100)
  })

  it('matches the account exactly, not by substring', () => {
    const txs = [
      tx({ date: '2026-08-02', destination: 'Bank Account Gabriel Reserva', amount: 700 }),
    ]
    expect(movementSince(txs, ACCOUNT, '2026-08-01')).toBe(0)
  })
})

describe('interestHistory', () => {
  it('buckets juros rows by month, oldest first, case-insensitively', () => {
    const txs = [
      tx({ date: '2026-02-10', origin: ACCOUNT, description: 'JUROS LIMITE DA CONTA', amount: 120 }),
      tx({ date: '2026-01-10', origin: ACCOUNT, description: 'juros limite', amount: 100 }),
      tx({ date: '2026-01-20', origin: ACCOUNT, description: 'Juros extra', amount: 30 }),
      tx({ date: '2026-01-05', origin: ACCOUNT, description: 'mercado', amount: 999 }),
      tx({ date: '2026-01-05', origin: 'Other Account', description: 'juros', amount: 999 }),
    ]
    expect(interestHistory(txs, ACCOUNT)).toEqual([
      { monthKey: '2026-01', amount: 130 },
      { monthKey: '2026-02', amount: 120 },
    ])
  })
})

describe('cashflowMedian', () => {
  it('uses the median, not the mean, so a windfall month does not inflate the surplus', () => {
    const txs = [
      tx({ date: '2026-02-05', destination: ACCOUNT, amount: 5000 }),
      tx({ date: '2026-03-05', destination: ACCOUNT, amount: 5000 }),
      tx({ date: '2026-04-05', destination: ACCOUNT, amount: 5000 }),
      tx({ date: '2026-05-05', destination: ACCOUNT, amount: 5000 }),
      tx({ date: '2026-06-05', destination: ACCOUNT, amount: 5000 }),
      // Windfall: a one-off refund on top of the salary.
      tx({ date: '2026-07-05', destination: ACCOUNT, amount: 25000 }),
    ]
    const result = cashflowMedian(txs, ACCOUNT, 6, '2026-08')
    expect(result.income).toBe(5000)
    expect(result.months).toBe(6)
  })

  it('excludes the current month entirely', () => {
    const txs = [
      tx({ date: '2026-07-05', destination: ACCOUNT, amount: 4000 }),
      tx({ date: '2026-08-05', destination: ACCOUNT, amount: 9999 }),
    ]
    const result = cashflowMedian(txs, ACCOUNT, 6, '2026-08')
    expect(result.income).toBe(4000)
    expect(result.months).toBe(1)
  })

  it('a month with ledger rows but no account movement enters the sample as zero', () => {
    const txs = [
      tx({ date: '2026-06-05', destination: ACCOUNT, amount: 4000 }),
      tx({ date: '2026-07-05', origin: 'Credit Card Gabriel', destination: 'Food', amount: 50 }),
    ]
    const result = cashflowMedian(txs, ACCOUNT, 6, '2026-08')
    expect(result.months).toBe(2)
    expect(result.income).toBe(2000)
  })

  it('months with no rows at all stay out of the sample (no zero-fill)', () => {
    const txs = [
      tx({ date: '2026-06-05', destination: ACCOUNT, amount: 4000 }),
      tx({ date: '2026-07-05', destination: ACCOUNT, amount: 6000 }),
    ]
    const result = cashflowMedian(txs, ACCOUNT, 6, '2026-08')
    expect(result.months).toBe(2)
    expect(result.income).toBe(5000)
  })

  it('excludes the duplicated card debit from the outflow', () => {
    const txs = [
      tx({ date: '2026-07-05', destination: ACCOUNT, amount: 5000 }),
      tx({ date: '2026-07-10', origin: ACCOUNT, description: 'pagamento debito automatico', amount: 2000 }),
      tx({ date: '2026-07-12', origin: ACCOUNT, description: 'aluguel', amount: 1500 }),
    ]
    const result = cashflowMedian(txs, ACCOUNT, 6, '2026-08')
    expect(result.outflow).toBe(1500)
    expect(result.surplus).toBe(3500)
  })
})

describe('installmentLoad', () => {
  const CARD = 'Credit Card Gabriel'

  it('derives the load window from the installment number, not from the row month', () => {
    // Row 03/06 sits in June, so #1 was due in April and the series runs Apr..Sep.
    const txs = [
      tx({ date: '2026-06-10', origin: CARD, description: 'Notebook 03/06', amount: 400 }),
    ]
    const load = installmentLoad(txs, null, 4, '2026-08')
    expect(load['2026-08']).toBe(400)
    expect(load['2026-09']).toBe(400)
    expect(load['2026-10']).toBe(0)
    expect(load['2026-11']).toBe(0)
  })

  it('anchors on the lowest-numbered row of the series', () => {
    // The 02/06 row pins the series to Feb..Jul: over by August.
    const txs = [
      tx({ date: '2026-03-10', origin: CARD, description: 'Sofa 02/06', amount: 300 }),
      tx({ date: '2026-07-10', origin: CARD, description: 'Sofa 06/06', amount: 300 }),
    ]
    const load = installmentLoad(txs, null, 2, '2026-08')
    expect(load['2026-08']).toBe(0)
  })

  it('same anchoring as the installments page for a series with 01/XX present', () => {
    const txs = [
      tx({ date: '2026-07-16', origin: CARD, description: 'Geladeira 01/12', amount: 250 }),
    ]
    const load = installmentLoad(txs, null, 12, '2026-08')
    // Series runs Jul/2026..Jun/2027 — 11 remaining months bill inside the horizon.
    expect(load['2026-08']).toBe(250)
    expect(load['2027-06']).toBe(250)
    expect(load['2027-07']).toBe(0)
  })

  it('only counts credit-card origins and filters by person substring', () => {
    const txs = [
      tx({ date: '2026-08-01', origin: 'Credit Card Juliana', description: 'Curso 01/10', amount: 100 }),
      tx({ date: '2026-08-01', origin: CARD, description: 'Fone 01/10', amount: 80 }),
      tx({ date: '2026-08-01', origin: 'Bank Account Gabriel', description: 'Boleto 01/10', amount: 999 }),
    ]
    const load = installmentLoad(txs, 'Gabriel', 1, '2026-08')
    expect(load['2026-08']).toBe(80)
  })

  it('sums concurrent series in the same month', () => {
    const txs = [
      tx({ date: '2026-08-01', origin: CARD, description: 'A 01/03', amount: 100 }),
      tx({ date: '2026-08-01', origin: CARD, description: 'B 01/05', amount: 50 }),
    ]
    const load = installmentLoad(txs, null, 1, '2026-08')
    expect(load['2026-08']).toBe(150)
  })
})
