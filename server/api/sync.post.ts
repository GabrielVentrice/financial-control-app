import { syncTransactionsFromSheets, recordSyncError } from '../utils/syncTransactions'

/**
 * POST /api/sync
 *
 * Manually synchronizes transactions from Google Sheets to PostgreSQL.
 * The scheduled daily sync runs via GET /api/cron/sync (Vercel cron).
 */
export default defineEventHandler(async () => {
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
