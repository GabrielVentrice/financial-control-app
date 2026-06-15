import { sql } from 'drizzle-orm'
import { db, transactions, syncMetadata } from '../database'
import { fetchTransactionsFromGoogleSheets } from './googleSheets'
import { enrichTransactionsWithPerson } from './personIdentifier'

export interface SyncResult {
  total: number
  upserted: number
  batches: number
  durationMs: number
  status: 'success' | 'error'
}

const BATCH_SIZE = 500

/**
 * Synchronizes transactions from Google Sheets into PostgreSQL.
 *
 * Uses a batched bulk upsert (INSERT ... ON CONFLICT DO UPDATE) instead of a
 * per-row SELECT + INSERT/UPDATE. This collapses thousands of sequential Neon
 * HTTP round-trips into a handful of statements, so the whole sync completes
 * well within a serverless function's timeout (required for the Vercel cron).
 *
 * Shared by POST /api/sync (manual) and GET /api/cron/sync (scheduled).
 */
export async function syncTransactionsFromSheets(): Promise<SyncResult> {
  const startTime = Date.now()

  console.log('[Sync] Fetching transactions from Google Sheets...')
  const sheetsTransactions = await fetchTransactionsFromGoogleSheets()
  const enriched = enrichTransactionsWithPerson(sheetsTransactions)
  console.log(`[Sync] Fetched ${enriched.length} transactions`)

  const rows = enriched
    .filter(tx => tx.transactionId)
    .map(tx => ({
      transactionId: tx.transactionId,
      date: parseGoogleSheetsDate(tx.date),
      origin: tx.origin || null,
      destination: tx.destination || null,
      description: tx.description || null,
      amount: String(tx.amount),
      person: tx.person || null,
      recordedAt: tx.recordedAt ? new Date(tx.recordedAt) : null,
      remoteId: tx.remoteId || null,
    }))

  let upserted = 0
  let batches = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    await db
      .insert(transactions)
      .values(batch)
      .onConflictDoUpdate({
        target: transactions.transactionId,
        set: {
          date: sql`excluded.date`,
          origin: sql`excluded.origin`,
          destination: sql`excluded.destination`,
          description: sql`excluded.description`,
          amount: sql`excluded.amount`,
          person: sql`excluded.person`,
          recordedAt: sql`excluded.recorded_at`,
          remoteId: sql`excluded.remote_id`,
          updatedAt: new Date(),
        },
      })
    upserted += batch.length
    batches++
  }

  const durationMs = Date.now() - startTime
  await db.insert(syncMetadata).values({
    lastSyncAt: new Date(),
    transactionCount: enriched.length,
    status: 'success',
  })

  console.log(`[Sync] Completed in ${durationMs}ms. Upserted ${upserted} rows in ${batches} batches`)
  return { total: enriched.length, upserted, batches, durationMs, status: 'success' }
}

/**
 * Records a failed sync attempt in the metadata table (best-effort).
 */
export async function recordSyncError(message: string): Promise<void> {
  try {
    await db.insert(syncMetadata).values({
      lastSyncAt: new Date(),
      transactionCount: 0,
      status: 'error',
      errorMessage: message,
    })
  } catch (err) {
    console.error('[Sync] Failed to record sync error:', err)
  }
}

/**
 * Parses a date string from Google Sheets (M/D/YYYY) into ISO (YYYY-MM-DD).
 */
function parseGoogleSheetsDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]

  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [month, day, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  if (dateStr.includes('-')) {
    return dateStr.split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}
