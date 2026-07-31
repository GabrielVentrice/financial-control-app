import type { TransactionQueryParams } from '~/types/transaction'
import { loadTransactions } from '../utils/loadTransactions'
import { validateQueryParams } from '../utils/transactionFilters'

/**
 * Get financial transactions
 *
 * Fetches financial transactions with advanced filtering and processing capabilities.
 *
 * 📊 **Processing Pipeline:**
 * 1. Reads from PostgreSQL (or Google Sheets + cache when DATABASE_URL is unset)
 * 2. Enriches transactions with person identification (Juliana/Gabriel)
 * 3. Processes and expands installments across months (optional)
 * 4. Applies filters based on query parameters
 *
 * 👤 **Person Identification:**
 * - Automatically identifies person based on Origin/Destination field patterns
 * - Patterns are case-insensitive and use substring matching
 * - Configured in server/utils/personIdentifier.ts
 *
 * 💳 **Installment Processing:**
 * - Parses installment format (e.g., "Netflix 01/12")
 * - Expands recurring payments across months
 * - Groups related installments by series
 * - Can be disabled with processInstallments=false
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
 * // Filter by category and origin
 * GET /api/transactions?destination=Groceries&origin=Credit Card Juliana
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event) as TransactionQueryParams

  const validation = validateQueryParams(query)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters',
      data: validation.errors,
    })
  }

  try {
    return await loadTransactions(query)
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('[API] Error processing transactions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process transactions',
      data: error.message,
    })
  }
})
