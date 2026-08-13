import { getBookSnapshotMeta } from '../utils/bookSnapshot'

/**
 * GET /api/health
 *
 * Post-deploy smoke check: is each data source configured, and does this
 * instance already hold a book snapshot?
 */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const { fetchedAt } = getBookSnapshotMeta()

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    sources: {
      bkper: Boolean(
        config.bkper?.bookId &&
        config.bkper?.refreshToken &&
        config.bkper?.clientId &&
        config.bkper?.clientSecret
      ),
      googleSheets: Boolean(config.googleClientEmail && config.googlePrivateKey),
      database: Boolean(process.env.DATABASE_URL),
    },
    snapshot: {
      loaded: fetchedAt !== null,
      fetchedAt: fetchedAt ? new Date(fetchedAt).toISOString() : null,
    },
  }
})
