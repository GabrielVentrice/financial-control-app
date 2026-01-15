import { eq } from 'drizzle-orm'
import { db, transactions, syncMetadata } from '../database'
import { fetchTransactionsFromGoogleSheets } from '../utils/googleSheets'
import { enrichTransactionsWithPerson } from '../utils/personIdentifier'

/**
 * POST /api/sync
 *
 * Synchronizes transactions from Google Sheets to PostgreSQL database.
 * This is designed to be called manually or via a cron job.
 *
 * The sync process:
 * 1. Fetches all transactions from Google Sheets
 * 2. Enriches them with person identification
 * 3. Upserts into PostgreSQL (insert new, update existing)
 * 4. Records sync metadata for tracking
 */
export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('[Sync] Starting sync from Google Sheets to PostgreSQL...')

    // Step 1: Fetch transactions from Google Sheets
    const sheetsTransactions = await fetchTransactionsFromGoogleSheets()
    console.log(`[Sync] Fetched ${sheetsTransactions.length} transactions from Google Sheets`)

    // Step 2: Enrich with person identification
    const enrichedTransactions = enrichTransactionsWithPerson(sheetsTransactions)
    console.log('[Sync] Enriched transactions with person data')

    // Step 3: Upsert transactions into PostgreSQL
    let inserted = 0
    let updated = 0
    let errors = 0

    for (const tx of enrichedTransactions) {
      try {
        // Check if transaction exists
        const existing = await db
          .select()
          .from(transactions)
          .where(eq(transactions.transactionId, tx.transactionId))
          .limit(1)

        // Parse date - Google Sheets returns MM/DD/YYYY format
        const parsedDate = parseGoogleSheetsDate(tx.date)

        if (existing.length === 0) {
          // Insert new transaction
          await db.insert(transactions).values({
            transactionId: tx.transactionId,
            date: parsedDate,
            origin: tx.origin || null,
            destination: tx.destination || null,
            description: tx.description || null,
            amount: String(tx.amount),
            person: tx.person || null,
            recordedAt: tx.recordedAt ? new Date(tx.recordedAt) : null,
            remoteId: tx.remoteId || null,
          })
          inserted++
        } else {
          // Update existing transaction
          await db
            .update(transactions)
            .set({
              date: parsedDate,
              origin: tx.origin || null,
              destination: tx.destination || null,
              description: tx.description || null,
              amount: String(tx.amount),
              person: tx.person || null,
              recordedAt: tx.recordedAt ? new Date(tx.recordedAt) : null,
              remoteId: tx.remoteId || null,
              updatedAt: new Date(),
            })
            .where(eq(transactions.transactionId, tx.transactionId))
          updated++
        }
      } catch (txError: any) {
        console.error(`[Sync] Error processing transaction ${tx.transactionId}:`, txError.message)
        errors++
      }
    }

    // Step 4: Record sync metadata
    await db.insert(syncMetadata).values({
      lastSyncAt: new Date(),
      transactionCount: enrichedTransactions.length,
      status: errors === 0 ? 'success' : 'partial',
      errorMessage: errors > 0 ? `${errors} transactions failed to sync` : null,
    })

    const duration = Date.now() - startTime
    console.log(`[Sync] Completed in ${duration}ms. Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`)

    return {
      success: true,
      message: `Sync completed successfully`,
      stats: {
        total: enrichedTransactions.length,
        inserted,
        updated,
        errors,
        durationMs: duration,
      },
    }
  } catch (error: any) {
    console.error('[Sync] Sync failed:', error)

    // Record failed sync
    try {
      await db.insert(syncMetadata).values({
        lastSyncAt: new Date(),
        transactionCount: 0,
        status: 'error',
        errorMessage: error.message,
      })
    } catch (metaError) {
      console.error('[Sync] Failed to record sync metadata:', metaError)
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Sync failed',
      data: error.message,
    })
  }
})

/**
 * Parses a date string from Google Sheets format (M/D/YYYY) to ISO format (YYYY-MM-DD)
 */
function parseGoogleSheetsDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]

  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [month, day, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Handle YYYY-MM-DD format (already ISO)
  if (dateStr.includes('-')) {
    return dateStr.split('T')[0]
  }

  // Fallback to current date
  return new Date().toISOString().split('T')[0]
}
