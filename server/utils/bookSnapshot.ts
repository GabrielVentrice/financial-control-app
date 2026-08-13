import type { Transaction } from '~/types/transaction'
import { normalizeSheetDate } from '../../shared/dates'
import { fetchTransactionsFromBkper } from './bkper'
import { enrichTransactionsWithPerson } from './personIdentifier'
import { createTtlCache } from './memoCache'

/**
 * The in-memory snapshot of the Bkper book that every read path consumes.
 *
 * Person enrichment happens here, before caching, so it runs once per fetch
 * (~4k rows) instead of once per request — and a rule change in
 * personIdentifier.ts ships via deploy, which starts fresh instances anyway.
 */

export interface BookSnapshot {
  transactions: Transaction[]
  fetchedAt: number
}

async function fetchSnapshot(): Promise<Transaction[]> {
  const raw = await fetchTransactionsFromBkper()

  const valid = raw.filter(t => t.transactionId && normalizeSheetDate(t.date))
  const enriched = enrichTransactionsWithPerson(valid)

  // The Postgres read path ordered by date desc in SQL; the transactions page
  // relies on that order, so the snapshot has to provide it now.
  return enriched.sort((a, b) => b.date.localeCompare(a.date))
}

const bookCache = createTtlCache<Transaction[]>({
  name: 'bkper-book',
  ttlMs: () => (useRuntimeConfig().cache?.ttlMinutes || 60) * 60_000,
  fetcher: fetchSnapshot,
})

export async function getBookSnapshot(
  opts: { forceRefresh?: boolean } = {}
): Promise<BookSnapshot> {
  const transactions = await bookCache.get(opts)
  return { transactions, fetchedAt: bookCache.meta().fetchedAt ?? Date.now() }
}

export function getBookSnapshotMeta(): { fetchedAt: number | null } {
  return { fetchedAt: bookCache.meta().fetchedAt }
}

export function invalidateBookSnapshot(): void {
  bookCache.invalidate()
}
