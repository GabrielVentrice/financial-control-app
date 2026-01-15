import { and, eq, gte, lte, ilike, desc } from 'drizzle-orm'
import type { Transaction, TransactionQueryParams } from '~/types/transaction'
import { fetchTransactionsFromGoogleSheets } from '../utils/googleSheets'
import { enrichTransactionsWithPerson } from '../utils/personIdentifier'
import { processInstallments } from '../utils/installmentProcessor'
import { applyFilters, validateQueryParams } from '../utils/transactionFilters'
import {
  isCacheValid,
  readCache,
  writeCache,
  updateCacheMetadata,
  cacheExists
} from '../utils/cacheManager'

// Lazy load database to avoid errors when DATABASE_URL is not set
let dbModule: typeof import('../database') | null = null
async function getDb() {
  if (!dbModule && process.env.DATABASE_URL) {
    dbModule = await import('../database')
  }
  return dbModule
}

/**
 * Get financial transactions from Google Sheets
 *
 * Fetches financial transactions with advanced filtering and processing capabilities.
 *
 * 📊 **Processing Pipeline:**
 * 1. Fetches raw data from Google Sheets
 * 2. Enriches transactions with person identification (Juliana/Gabriel)
 * 3. Processes and expands installments across months (optional)
 * 4. Applies filters based on query parameters
 *
 * 👤 **Person Identification:**
 * - Automatically identifies person based on Origin field patterns
 * - Patterns are case-insensitive and use substring matching
 * - Configured in server/utils/personIdentifier.ts
 *
 * 💳 **Installment Processing:**
 * - Parses installment format (e.g., "Netflix 01/12")
 * - Expands recurring payments across months
 * - Groups related installments by series
 * - Can be disabled with processInstallments=false
 *
 * 🎯 **Use Cases:**
 * - Dashboard analytics and insights
 * - Transaction listing with filters
 * - Category-based spending analysis
 * - Installment timeline visualization
 * - Fixed costs historical analysis
 *
 * 📖 **Full Documentation:** GET /api/docs (HTML) or /api/docs/json (JSON)
 *
 * @param person - Filter by person: "Juliana", "Gabriel", or "Ambos" (both)
 * @param startDate - Start date for filtering transactions (YYYY-MM-DD format), example: 2025-01-01
 * @param endDate - End date for filtering transactions (YYYY-MM-DD format), example: 2025-01-31
 * @param searchTerm - Search term to filter transaction descriptions (case-insensitive), example: Netflix
 * @param origin - Filter by origin account/card, example: Bank Account Gabriel
 * @param destination - Filter by destination category, example: Groceries
 * @param processInstallments - Whether to process and expand installments across months (default: true)
 *
 * @returns Array of Transaction objects with person field populated
 *
 * @example
 * // Get all transactions
 * GET /api/transactions
 *
 * @example
 * // Get Gabriel's transactions for January 2025
 * GET /api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31
 *
 * @example
 * // Search for Netflix transactions
 * GET /api/transactions?searchTerm=Netflix
 *
 * @example
 * // Multiple filters with complex query
 * GET /api/transactions?person=Ambos&startDate=2025-01-01&endDate=2025-12-31&searchTerm=supermercado&processInstallments=true
 *
 * @example
 * // Filter by category and origin
 * GET /api/transactions?destination=Groceries&origin=Credit Card Juliana
 */
export default defineEventHandler(async (event) => {
  try {
    // Get runtime config
    const config = useRuntimeConfig(event)
    const cacheConfig = config.cache
    const spreadsheetId = config.public.googleSpreadsheetId

    // Parse query parameters
    const query = getQuery(event) as TransactionQueryParams

    // Validate query parameters
    const validation = validateQueryParams(query)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: validation.errors,
      })
    }

    console.log('[API] Fetching transactions with params:', query)

    let transactions: Transaction[] = []

    // Check if DATABASE_URL is configured - if so, use PostgreSQL
    const dbModule = await getDb()
    if (dbModule) {
      console.log('[API] Using PostgreSQL database')
      transactions = await fetchFromDatabase(dbModule, query)
    } else {
      // Fall back to Google Sheets + Cache
      console.log('[API] DATABASE_URL not set, using Google Sheets + Cache')
      transactions = await fetchFromGoogleSheetsWithCache(config, cacheConfig, spreadsheetId)
    }

    // STEP 2: Enrich with person identification (only needed if from Google Sheets)
    // Database already has person data from sync
    if (!dbModule) {
      transactions = enrichTransactionsWithPerson(transactions)
      console.log('[API] Enriched transactions with person data')
    }

    // STEP 3: Process installments if requested (default: true)
    const shouldProcessInstallments = query.processInstallments !== 'false' && query.processInstallments !== false
    if (shouldProcessInstallments) {
      transactions = processInstallments(transactions)
      console.log('[API] Processed installments. New count:', transactions.length)
    }

    // STEP 4: Apply all filters (for Google Sheets path - DB already filtered)
    if (!dbModule) {
      transactions = applyFilters(transactions, query)
      console.log('[API] Applied filters. Final count:', transactions.length)
    }

    return transactions
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error processing transactions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process transactions',
      data: error.message,
    })
  }
})

/**
 * Fetch transactions from PostgreSQL database with filtering
 */
async function fetchFromDatabase(
  dbModule: typeof import('../database'),
  query: TransactionQueryParams
): Promise<Transaction[]> {
  const { db, transactions: transactionsTable } = dbModule

  // Build query conditions
  const conditions = []

  if (query.person && query.person !== 'Ambos') {
    conditions.push(eq(transactionsTable.person, query.person))
  }

  if (query.startDate) {
    conditions.push(gte(transactionsTable.date, query.startDate))
  }

  if (query.endDate) {
    conditions.push(lte(transactionsTable.date, query.endDate))
  }

  if (query.searchTerm) {
    conditions.push(ilike(transactionsTable.description, `%${query.searchTerm}%`))
  }

  if (query.origin) {
    conditions.push(ilike(transactionsTable.origin, `%${query.origin}%`))
  }

  if (query.destination) {
    conditions.push(ilike(transactionsTable.destination, `%${query.destination}%`))
  }

  // Execute query
  const dbTransactions = await db
    .select()
    .from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionsTable.date))

  console.log(`[API] Fetched ${dbTransactions.length} transactions from PostgreSQL`)

  // Convert to Transaction type expected by the app
  return dbTransactions.map((t) => ({
    transactionId: t.transactionId,
    date: t.date, // Already in YYYY-MM-DD format
    origin: t.origin || '',
    destination: t.destination || '',
    description: t.description || '',
    amount: parseFloat(t.amount),
    recordedAt: t.recordedAt?.toISOString() || '',
    remoteId: t.remoteId || '',
    person: t.person || '',
  }))
}

/**
 * Fetch transactions from Google Sheets with caching (legacy path)
 */
async function fetchFromGoogleSheetsWithCache(
  config: any,
  cacheConfig: any,
  spreadsheetId: string
): Promise<Transaction[]> {
  let transactions: Transaction[] = []

  if (cacheConfig.enabled) {
    const exists = await cacheExists()
    const isValid = await isCacheValid()

    if (exists && isValid) {
      console.log('[API] Cache is valid, reading from cache')
      transactions = await readCache()
      console.log('[API] Read transactions from cache:', transactions.length)
    } else if (exists && !isValid) {
      console.log('[API] Cache expired, fetching fresh data from Google Sheets')
      transactions = await fetchTransactionsFromGoogleSheets()

      await writeCache(transactions)
      await updateCacheMetadata(transactions.length, 'fresh', spreadsheetId, cacheConfig.ttlMinutes)
      console.log('[API] Updated cache with fresh data:', transactions.length)
    } else {
      console.log('[API] Cache missing, creating initial cache')
      transactions = await fetchTransactionsFromGoogleSheets()

      await writeCache(transactions)
      await updateCacheMetadata(transactions.length, 'fresh', spreadsheetId, cacheConfig.ttlMinutes)
      console.log('[API] Created cache with data:', transactions.length)
    }
  } else {
    console.log('[API] Cache disabled, fetching from Google Sheets')
    transactions = await fetchTransactionsFromGoogleSheets()
    console.log('[API] Fetched transactions from Google Sheets:', transactions.length)
  }

  return transactions
}
