import type { Transaction, CategoriesQueryParams, CategoriesResponse, CategoryData, CategoryTotals } from '~/types/transaction'
import { fetchTransactionsFromGoogleSheets } from '../utils/googleSheets'
import { enrichTransactionsWithPerson } from '../utils/personIdentifier'
import { processInstallments } from '../utils/installmentProcessor'
import { applyFilters, validateQueryParams } from '../utils/transactionFilters'

/**
 * Get category analysis and spending breakdown
 *
 * Provides detailed category-based analysis of financial transactions with configurable exclusions 
 * and categorization rules.
 *
 * 📊 **Processing Pipeline:**
 * 1. Fetches raw data from Google Sheets
 * 2. Enriches transactions with person identification (Juliana/Gabriel)
 * 3. Processes and expands installments across months (optional)
 * 4. Applies filters based on query parameters
 * 5. Categorizes and calculates spending totals
 * 6. Applies exclusion rules and category classifications
 *
 * 🏷️ **Category Classifications:**
 * - **Fixed Costs:** Same amount every month (rent, subscriptions, insurance)
 * - **Committed Expenses:** Recurring but variable amounts (utilities, financing)
 * - **Variable Costs:** Non-recurring expenses (groceries, entertainment)
 *
 * 🚫 **Excluded Categories:**
 * - System categories like "Credit Account", "Bank Account"
 * - "Sem Categoria", "Adjustment" entries
 * - Categories configured in EXCLUDED_CATEGORIES
 *
 * 💡 **Response Structure:**
 * - `categories`: Array of category data with totals, counts, and percentages
 * - `totals`: Summary totals for each expense type
 * - `config`: Current categorization rules and exclusions
 *
 * 📖 **Full Documentation:** GET /api/docs (HTML) or /api/docs/json (JSON)
 *
 * @param person - Filter by person: "Juliana", "Gabriel", or "Ambos" (both)
 * @param startDate - Start date for filtering transactions (YYYY-MM-DD format)
 * @param endDate - End date for filtering transactions (YYYY-MM-DD format)
 * @param searchTerm - Search term to filter transaction descriptions (case-insensitive)
 * @param origin - Filter by origin account/card
 * @param destination - Filter by destination category
 * @param processInstallments - Whether to process and expand installments across months (default: true)
 * @param includeTransactions - Whether to include individual transactions in response (default: false)
 *
 * @returns CategoriesResponse object with categories, totals and configuration
 *
 * @example
 * // Get category analysis for current month
 * GET /api/categories
 *
 * @example
 * // Get Gabriel's category analysis for January 2025 with transaction details
 * GET /api/categories?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31&includeTransactions=true
 *
 * @example  
 * // Search for specific category patterns
 * GET /api/categories?searchTerm=Netflix&includeTransactions=true
 */
export default defineEventHandler(async (event) => {
  try {
    // Parse query parameters
    const query = getQuery(event) as CategoriesQueryParams

    // Validate query parameters
    const validation = validateQueryParams(query)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: validation.errors,
      })
    }

    console.log('[API] Fetching categories with params:', query)

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

    // STEP 5: Process categories
    const includeTransactions = query.includeTransactions === 'true' || query.includeTransactions === true
    const categoriesResponse = processCategoriesData(transactions, includeTransactions)
    
    console.log('[API] Processed categories. Categories count:', categoriesResponse.categories.length)

    return categoriesResponse
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error processing categories:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process categories',
      data: error.message,
    })
  }
})

/**
 * Process transactions into category data with totals and classifications
 */
function processCategoriesData(transactions: Transaction[], includeTransactions: boolean): CategoriesResponse {
  // Configuration - Categories that should be excluded from analysis
  const EXCLUDED_CATEGORIES = [
    'Sem Categoria',
    'Credit Account Juliana',
    'Credit Account Gabriel',
    'Bank Account Juliana',
    'Bank Account Gabriel',
    'Credit Card Juliana',
    'Credit Card Gabriel',
    'Adjustment'
  ]

  // Configuration - Categories with same value every month (fixed costs)
  const CUSTOS_FIXOS_CATEGORIES = [
    'Rent',
    'Subscriptions/Softwares',
    'Insurance',
    'Utilities',
    'Business & Taxes',
    'Medical'
  ]

  // Configuration - Categories that are recurring but with variable amounts
  const GASTOS_COMPROMETIDOS_CATEGORIES = [
    'Installments/Financing',
    'Financing',
    'Utilities',
    'Business & Taxes',
    'Investments',
    'Medical',
    'Rent',
    'Subscriptions/Softwares',
    'Insurance'
  ]

  // Helper functions
  const shouldExcludeCategory = (categoryName: string): boolean => {
    const lowerCaseName = categoryName.toLowerCase()
    return EXCLUDED_CATEGORIES.some(excluded =>
      excluded.toLowerCase() === lowerCaseName
    )
  }

  const isCustoFixoCategory = (categoryName: string): boolean => {
    const lowerCaseName = categoryName.toLowerCase()
    return CUSTOS_FIXOS_CATEGORIES.some(fixed =>
      lowerCaseName.includes(fixed.toLowerCase())
    )
  }

  const isGastoComprometidoCategory = (categoryName: string): boolean => {
    const lowerCaseName = categoryName.toLowerCase()
    return GASTOS_COMPROMETIDOS_CATEGORIES.some(comprometido =>
      lowerCaseName.includes(comprometido.toLowerCase())
    )
  }

  // Filter out excluded categories
  const filteredTransactions = transactions.filter(t => {
    const category = t.destination || 'Sem Categoria'
    return !shouldExcludeCategory(category)
  })

  // Group transactions by category
  const categoryMap = new Map<string, { count: number; total: number; transactions: Transaction[] }>()

  filteredTransactions.forEach(transaction => {
    const category = transaction.destination || 'Sem Categoria'
    const existing = categoryMap.get(category) || { count: 0, total: 0, transactions: [] }

    categoryMap.set(category, {
      count: existing.count + 1,
      total: existing.total + transaction.amount,
      transactions: [...existing.transactions, transaction]
    })
  })

  // Calculate total amount for percentage calculations
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)

  // Build categories array
  const categories: CategoryData[] = []
  categoryMap.forEach((data, name) => {
    categories.push({
      name,
      count: data.count,
      total: data.total,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      average: data.total / data.count,
      transactions: includeTransactions ? data.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ) : []
    })
  })

  // Sort categories by total (descending)
  categories.sort((a, b) => b.total - a.total)

  // Calculate totals by category type
  const custosFixosTotal = filteredTransactions
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return isCustoFixoCategory(category)
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const gastosComprometidosTotal = filteredTransactions
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return isGastoComprometidoCategory(category)
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const variableCostsTotal = filteredTransactions
    .filter(t => {
      const category = t.destination || 'Sem Categoria'
      return !isCustoFixoCategory(category) && !isGastoComprometidoCategory(category)
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // Count categories by type
  const custosFixosCategoriesSet = new Set<string>()
  const gastosComprometidosCategoriesSet = new Set<string>()

  filteredTransactions.forEach(t => {
    const category = t.destination || 'Sem Categoria'
    if (isCustoFixoCategory(category)) {
      custosFixosCategoriesSet.add(category)
    }
    if (isGastoComprometidoCategory(category)) {
      gastosComprometidosCategoriesSet.add(category)
    }
  })

  const totals: CategoryTotals = {
    variableCosts: variableCostsTotal,
    fixedCosts: custosFixosTotal,
    committedExpenses: gastosComprometidosTotal,
    total: totalAmount,
    categoryCounts: {
      fixedCosts: custosFixosCategoriesSet.size,
      committedExpenses: gastosComprometidosCategoriesSet.size
    }
  }

  return {
    categories,
    totals
  }
}