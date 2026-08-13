import { describe, it, expect } from 'vitest'
import { mapBkperTransactions } from '~/server/utils/bkper'

/**
 * Bkper is the ledger the app reads. These fixtures are trimmed copies of real
 * responses from the book, including the shapes that used to be invisible while
 * the app read the Google Sheet mirror instead.
 */
const accountNames = new Map([
  ['2703927126', 'Credit Card Gabriel'],
  ['2723187003', 'Home & Maintenance'],
  ['2705797190', 'Bank Account Gabriel'],
  ['2714817235', 'Food'],
])

const purchase = {
  id: 'b723220e-65a5-4026-b7f4-894ffa1e60f6',
  date: '2026-08-10',
  description: 'MERCADOLIVRE*MERCA02/10',
  amount: '77.5',
  creditAccount: { id: '2703927126' },
  debitAccount: { id: '2723187003' },
  remoteIds: ['pluggy_ab7c3904-feaa-4829-8f5e-de5c04a44cf9'],
  createdAt: '1781889173280',
}

describe('mapping the Bkper ledger onto transactions', () => {
  it('reads double entry as origin/destination', () => {
    // Money leaves the credit account and lands in the debit account, which is
    // exactly the Origin/Destination pair every screen already filters on.
    const [tx] = mapBkperTransactions([purchase], accountNames)
    expect(tx.origin).toBe('Credit Card Gabriel')
    expect(tx.destination).toBe('Home & Maintenance')
    expect(tx.amount).toBe(77.5)
    expect(tx.transactionId).toBe(purchase.id)
    expect(tx.remoteId).toBe('pluggy_ab7c3904-feaa-4829-8f5e-de5c04a44cf9')
  })

  it('keeps the date as the ledger wrote it', () => {
    // The whole app buckets months by slicing "YYYY-MM" off this string. Parsing
    // it into a Date on the way in is what used to move day-01 transactions into
    // the previous month under UTC-3.
    const [tx] = mapBkperTransactions([purchase], accountNames)
    expect(tx.date).toBe('2026-08-10')
  })

  it('turns createdAt millis into an ISO timestamp', () => {
    const [tx] = mapBkperTransactions([purchase], accountNames)
    expect(tx.recordedAt).toBe(new Date(1781889173280).toISOString())
  })

  it('keeps rows that are missing one side of the entry', () => {
    // Roughly half the book is uncategorized drafts that carry only the account
    // the money left; dropping them would erase real spending.
    const uncategorized = {
      id: 'b17e8954',
      date: '2026-08-09',
      description: 'Pagamento de Pix QR Code RENOVAPAY',
      amount: '22.64',
      creditAccount: { id: '2705797190' },
    }
    const [tx] = mapBkperTransactions([uncategorized], accountNames)
    expect(tx.origin).toBe('Bank Account Gabriel')
    expect(tx.destination).toBe('')
  })

  it('drops trashed entries and rows with no id or date', () => {
    const rows = [
      purchase,
      { ...purchase, id: 'trashed', trashed: true },
      { ...purchase, id: undefined },
      { ...purchase, id: 'undated', date: undefined },
    ]
    expect(mapBkperTransactions(rows, accountNames).map(t => t.transactionId)).toEqual([purchase.id])
  })

  it('falls back to an empty account name when the id is unknown', () => {
    // Archived accounts are absent from the accounts listing; an unresolved id
    // must not leak into the UI as a category.
    const [tx] = mapBkperTransactions(
      [{ ...purchase, debitAccount: { id: '999999' } }],
      accountNames
    )
    expect(tx.destination).toBe('')
  })

  it('prefers a name the payload already carries', () => {
    const [tx] = mapBkperTransactions(
      [{ ...purchase, debitAccount: { id: '999999', name: 'Food' } }],
      accountNames
    )
    expect(tx.destination).toBe('Food')
  })
})
