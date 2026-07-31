import { describe, it, expect } from 'vitest'
import type { Transaction } from '~/types/transaction'
import {
  isIncome,
  isExpense,
  isTransfer,
  isRealExpense,
  isSpendingCategory,
  categoryNameOf,
} from '~/shared/expenseRules'

const tx = (partial: Partial<Transaction>): Transaction => ({
  transactionId: 't1',
  date: '2026-06-15',
  origin: '',
  destination: '',
  description: '',
  amount: 100,
  recordedAt: '',
  remoteId: '',
  ...partial,
})

describe('income vs expense vs transfer', () => {
  it('treats money landing in a bank account as income', () => {
    const salary = tx({ origin: 'Salary Gabriel', destination: 'Bank Account Gabriel', amount: 15000 })
    expect(isIncome(salary)).toBe(true)
    expect(isRealExpense(salary)).toBe(false)
  })

  it('treats a card purchase as real spending', () => {
    const purchase = tx({ origin: 'Credit Card Gabriel', destination: 'Supermarket' })
    expect(isRealExpense(purchase)).toBe(true)
  })

  it('does not count a credit-card payment as spending', () => {
    // Paying the card moves money between your own accounts; the purchases it
    // settles were already counted when they happened.
    const payment = tx({ origin: 'Bank Account Gabriel', destination: 'Credit Card Gabriel', amount: 8000 })
    expect(isTransfer(payment)).toBe(true)
    expect(isRealExpense(payment)).toBe(false)
  })

  it('counts financed purchases whose origin is a category, not an account', () => {
    // The sheet puts "Installments/Financing" in the origin column for ~20 rows.
    // The old rule required origin to contain "bank account"/"credit card", so
    // these never counted as spending anywhere in the app.
    const financed = tx({ origin: 'Installments/Financing', destination: 'Home & Maintenance' })
    expect(isExpense(financed)).toBe(true)
    expect(isRealExpense(financed)).toBe(true)
  })

  it('excludes Adjustment on either side of the ledger', () => {
    expect(isRealExpense(tx({ origin: 'Bank Account Gabriel', destination: 'Adjustment' }))).toBe(false)
    expect(isRealExpense(tx({ origin: 'Adjustment', destination: 'Supermarket' }))).toBe(false)
  })

  it('excludes the automatic-debit bookkeeping row', () => {
    const row = tx({
      origin: 'Bank Account Gabriel',
      destination: 'Utilities',
      description: 'pagamento debito automatico',
    })
    expect(isRealExpense(row)).toBe(false)
  })

  it('ignores rows with no origin at all', () => {
    expect(isExpense(tx({ origin: '', destination: 'Credit Card Juliana' }))).toBe(false)
  })
})

describe('spending categories', () => {
  it('rejects accounts and cards as categories', () => {
    expect(isSpendingCategory('Bank Account Juliana')).toBe(false)
    expect(isSpendingCategory('Credit Card Gabriel')).toBe(false)
    expect(isSpendingCategory('Credit Account Gabriel')).toBe(false)
    expect(isSpendingCategory('Adjustment')).toBe(false)
  })

  it('rejects account names it has never seen before', () => {
    // The old categories page matched an exact list, so any new account name
    // leaked through as if it were a spending category.
    expect(isSpendingCategory('Bank Account Fulano')).toBe(false)
    expect(isSpendingCategory('Credit Card Novo')).toBe(false)
  })

  it('accepts real categories', () => {
    expect(isSpendingCategory('Supermarket')).toBe(true)
    expect(isSpendingCategory('Rent')).toBe(true)
  })

  it('has one spelling of the empty category', () => {
    expect(categoryNameOf(tx({ destination: '' }))).toBe('Sem categoria')
    expect(categoryNameOf(tx({ destination: '   ' }))).toBe('Sem categoria')
  })
})

describe('screen agreement', () => {
  // The dashboard total and the categories total are the same number computed
  // twice. They drifted apart because each screen had its own exclusion list.
  const month: Transaction[] = [
    tx({ transactionId: '1', origin: 'Credit Card Gabriel', destination: 'Supermarket', amount: 300 }),
    tx({ transactionId: '2', origin: 'Bank Account Gabriel', destination: 'Rent', amount: 4000 }),
    tx({ transactionId: '3', origin: 'Bank Account Gabriel', destination: 'Credit Card Gabriel', amount: 8000 }),
    tx({ transactionId: '4', origin: 'Salary Gabriel', destination: 'Bank Account Gabriel', amount: 15000 }),
    tx({
      transactionId: '5',
      origin: 'Bank Account Gabriel',
      destination: 'Utilities',
      description: 'pagamento debito automatico',
      amount: 250,
    }),
    tx({ transactionId: '6', origin: 'Installments/Financing', destination: 'Clothing', amount: 150 }),
  ]

  it('agrees on the month total across dashboard and categories logic', () => {
    const dashboardTotal = month
      .filter(isRealExpense)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const categoriesTotal = month
      .filter(t => isSpendingCategory(t.destination) && isRealExpense(t))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    expect(dashboardTotal).toBe(4450) // 300 + 4000 + 150
    expect(categoriesTotal).toBe(dashboardTotal)
  })
})
