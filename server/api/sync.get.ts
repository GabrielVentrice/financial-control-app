import { getBookSnapshot } from '../utils/bookSnapshot'

/**
 * GET /api/sync
 *
 * Reports how fresh the in-memory Bkper snapshot is. The UI turns this into
 * the "dados de há X" label — with no database mirror anymore, freshness means
 * "when this instance last read the book", bounded by the cache TTL.
 *
 * Awaiting the snapshot (instead of just peeking at its metadata) makes a cold
 * instance answer with real numbers: the fetch is shared with whatever
 * transaction request is populating the cache in parallel.
 */
export default defineEventHandler(async () => {
  const { transactions, fetchedAt } = await getBookSnapshot()

  return {
    configured: true,
    lastSyncAt: new Date(fetchedAt).toISOString(),
    status: 'success' as const,
    transactionCount: transactions.length,
  }
})
