import type { Transaction, TransactionQueryParams } from '~/types/transaction'
import { fetchTransactionsFromGoogleSheets } from '../utils/googleSheets'
import { enrichTransactionsWithPerson } from '../utils/personIdentifier'
import { processInstallments } from '../utils/installmentProcessor'
import { applyFilters, validateQueryParams } from '../utils/transactionFilters'

/**
 * Transactions API Endpoint
 *
 * Supports the following query parameters:
 * - person: Filter by Juliana/Gabriel/Ambos
 * - startDate: Filter by start date (YYYY-MM-DD format)
 * - endDate: Filter by end date (YYYY-MM-DD format)
 * - processInstallments: Whether to expand installments (default: true)
 * - searchTerm: Search in transaction descriptions
 * - origin: Filter by origin (account/card)
 * - destination: Filter by destination (category)
 *
 * Example: /api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31
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
