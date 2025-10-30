import type { Transaction, TransactionQueryParams } from '~/types/transaction'
import { fetchTransactionsFromGoogleSheets } from '../utils/googleSheets'
import { enrichTransactionsWithPerson } from '../utils/personIdentifier'
import { processInstallments } from '../utils/installmentProcessor'
import { applyFilters, validateQueryParams } from '../utils/transactionFilters'

/**
 * Get financial transactions from Google Sheets
 *
 * Fetches financial transactions with advanced filtering and processing capabilities.
 *
 * Processing Pipeline:
 * 1. Fetches raw data from Google Sheets
 * 2. Enriches transactions with person identification (Juliana/Gabriel)
 * 3. Processes and expands installments across months (optional)
 * 4. Applies filters based on query parameters
 *
 * Person Identification:
 * - Automatically identifies person based on Origin field patterns
 * - Patterns are case-insensitive and use substring matching
 * - Configured in server/utils/personIdentifier.ts
 *
 * Installment Processing:
 * - Parses installment format (e.g., "Netflix 01/12")
 * - Expands recurring payments across months
 * - Groups related installments by series
 * - Can be disabled with processInstallments=false
 *
 * Use Cases:
 * - Dashboard analytics and insights
 * - Transaction listing with filters
 * - Category-based spending analysis
 * - Installment timeline visualization
 * - Fixed costs historical analysis
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
 */
export default defineEventHandler(async (event) => {
  try {
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

    // STEP 1: Fetch raw data from Google Sheets
    let transactions = await fetchTransactionsFromGoogleSheets()
    console.log('[API] Fetched transactions from Google Sheets:', transactions.length)

    // STEP 2: Enrich with person identification
    transactions = enrichTransactionsWithPerson(transactions)
    console.log('[API] Enriched transactions with person data')

    // STEP 3: Process installments if requested (default: true)
    const shouldProcessInstallments = query.processInstallments !== 'false' && query.processInstallments !== false
    if (shouldProcessInstallments) {
      transactions = processInstallments(transactions)
      console.log('[API] Processed installments. New count:', transactions.length)
    }

    // STEP 4: Apply all filters
    transactions = applyFilters(transactions, query)
    console.log('[API] Applied filters. Final count:', transactions.length)

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
