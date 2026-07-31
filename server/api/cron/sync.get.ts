import { syncTransactionsFromSheets, recordSyncError } from '../../utils/syncTransactions'
import { isDatabaseConfigured } from '../../database'

/**
 * GET /api/cron/sync
 *
 * Scheduled daily sync from Google Sheets to PostgreSQL, invoked by the Vercel
 * cron job (see vercel.json). Vercel sends the secret as
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * The check fails CLOSED. It used to be wrapped in `if (secret)`, which meant a
 * missing — or, as happened in production, empty — CRON_SECRET disabled
 * authentication altogether and left a full Sheets read plus a 4000-row upsert
 * exposed to anyone who knew the path. An endpoint this expensive has to deny by
 * default; a deployment without the secret should break loudly, not open up.
 *
 * Localhost is exempt so `npm run dev` doesn't need the variable.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  const isLocal = process.env.NODE_ENV === 'development'

  if (!isLocal) {
    if (!secret) {
      console.error('[Cron] CRON_SECRET is not set — refusing to run unauthenticated')
      throw createError({
        statusCode: 503,
        statusMessage: 'Cron secret not configured',
        data: 'CRON_SECRET não está definida neste ambiente, então o endpoint não pode ser autenticado.',
      })
    }

    if (getHeader(event, 'authorization') !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  if (!isDatabaseConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database not configured',
      data: 'DATABASE_URL não está definida neste ambiente, então não há Postgres para sincronizar.',
    })
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
