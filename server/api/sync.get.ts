import { desc } from 'drizzle-orm'

/**
 * GET /api/sync
 *
 * Returns the last sync attempt so the UI can show how fresh the data is.
 * Postgres lags the sheet between syncs, so "atualizado há X" is the only
 * signal the user has that the numbers on screen are stale.
 */
export default defineEventHandler(async () => {
  if (!process.env.DATABASE_URL) {
    return { configured: false, lastSyncAt: null, status: null, transactionCount: 0 }
  }

  const { db, syncMetadata } = await import('../database')

  const [last] = await db
    .select()
    .from(syncMetadata)
    .orderBy(desc(syncMetadata.lastSyncAt))
    .limit(1)

  if (!last) {
    return { configured: true, lastSyncAt: null, status: null, transactionCount: 0 }
  }

  return {
    configured: true,
    lastSyncAt: last.lastSyncAt.toISOString(),
    status: last.status,
    transactionCount: last.transactionCount,
    errorMessage: last.errorMessage,
  }
})
