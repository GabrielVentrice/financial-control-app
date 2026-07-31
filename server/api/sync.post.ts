import { syncTransactionsFromSheets, recordSyncError } from '../utils/syncTransactions'
import { isDatabaseConfigured } from '../database'

/**
 * POST /api/sync
 *
 * Manually synchronizes transactions from Google Sheets to PostgreSQL.
 * The scheduled daily sync runs via GET /api/cron/sync (Vercel cron).
 */
export default defineEventHandler(async () => {
  // Fail loudly and specifically. Without this the missing variable surfaced as
  // a bare 500 from a module that threw on import.
  if (!isDatabaseConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database not configured',
      data: 'DATABASE_URL não está definida neste ambiente, então não há Postgres para sincronizar.',
    })
  }

  try {
    console.log('[Sync] Manual sync triggered')
    const result = await syncTransactionsFromSheets()

    return {
      success: true,
      message: 'Sync completed successfully',
      stats: {
        total: result.total,
        upserted: result.upserted,
        batches: result.batches,
        durationMs: result.durationMs,
      },
    }
  } catch (error: any) {
    console.error('[Sync] Sync failed:', error)
    await recordSyncError(error.message)

    throw createError({
      statusCode: 500,
      statusMessage: 'Sync failed',
      data: error.message,
    })
  }
})
