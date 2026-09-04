import { getBookSnapshot } from '../utils/bookSnapshot'

/**
 * POST /api/sync
 *
 * The "Atualizar" button: force a fresh read of the Bkper book, bypassing the
 * TTL. The route name survives from the Postgres-mirror era so the composables
 * and every screen keep working unchanged — semantically it is now a cache
 * refresh, not a database sync. There is nothing else to invalidate: budget
 * targets live in Postgres and are read fresh on every request.
 */
export default defineEventHandler(async () => {
  const started = Date.now()

  try {
    const { transactions } = await getBookSnapshot({ forceRefresh: true })

    return {
      success: true,
      message: 'Snapshot atualizado a partir do Bkper',
      stats: {
        total: transactions.length,
        durationMs: Date.now() - started,
      },
    }
  } catch (error: any) {
    console.error('[Sync] Refresh from Bkper failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Sync failed',
      data: error.message,
    })
  }
})
