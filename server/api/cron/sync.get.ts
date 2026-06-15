import { syncTransactionsFromSheets, recordSyncError } from '../../utils/syncTransactions'

/**
 * GET /api/cron/sync
 *
 * Scheduled daily sync from Google Sheets to PostgreSQL, invoked by the Vercel
 * cron job (see vercel.json). Vercel sends the cron secret as
 * `Authorization: Bearer <CRON_SECRET>`; when CRON_SECRET is set we require it
 * so the endpoint can't be triggered by arbitrary callers.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  try {
    console.log('[Cron] Daily sync triggered')
    const result = await syncTransactionsFromSheets()

    return {
      success: true,
      message: 'Daily sync completed',
      stats: {
        total: result.total,
        upserted: result.upserted,
        batches: result.batches,
        durationMs: result.durationMs,
      },
    }
  } catch (error: any) {
    console.error('[Cron] Daily sync failed:', error)
    await recordSyncError(error.message)

    throw createError({
      statusCode: 500,
      statusMessage: 'Daily sync failed',
      data: error.message,
    })
  }
})
