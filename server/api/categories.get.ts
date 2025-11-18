import type { Transaction, CategoriesQueryParams, CategoriesResponse, CategoryData, CategoryTotals, Budget } from '~/types/transaction'
import { fetchTransactionsFromGoogleSheets } from '../utils/googleSheets'
import { enrichTransactionsWithPerson } from '../utils/personIdentifier'
import { processInstallments } from '../utils/installmentProcessor'
import { applyFilters, validateQueryParams } from '../utils/transactionFilters'
import { fetchBudgetsFromGoogleSheets } from '../utils/budgetSheets'

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

    // STEP 5: Fetch budgets for the filtered period
    let budgets: Budget[] = []
    try {
      budgets = await fetchBudgetsFromGoogleSheets()

      // If date filters are present, filter budgets to match the period
      if (query.endDate) {
        console.log('[API] 🔧 Filtering budgets by endDate')
        const unfilteredCount = budgets.length

        const endDate = new Date(query.endDate)
        const filterYear = endDate.getFullYear()
        const filterMonth = endDate.getMonth() + 1 // Convert 0-indexed to 1-indexed

        console.log('[API] 🔍 Filter → Year:', filterYear, 'Month:', filterMonth)

        budgets = budgets.filter(budget => {
          const match = budget.year === filterYear && budget.month === filterMonth
          
          console.log('[API] 🔍 Budget:', budget.category, 'Person:', budget.person, '→ Year:', budget.year, 'Month:', budget.month, '→ Match?', match)

          return match
        })

        console.log(`[API] Filtered budgets: ${unfilteredCount} → ${budgets.length}`)
      }

      console.log('[API] Fetched budgets for period:', budgets.length)
    } catch (error) {
      console.warn('[API] Could not fetch budgets, continuing without budget data:', error)
    }

    // STEP 6: Process categories
    const includeTransactions = query.includeTransactions === 'true' || query.includeTransactions === true
    const categoriesResponse = processCategoriesData(transactions, budgets, includeTransactions, query.person)

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
function processCategoriesData(
  transactions: Transaction[],
  budgets: Budget[],
  includeTransactions: boolean,
  selectedPerson?: 'Juliana' | 'Gabriel' | 'Ambos'
): CategoriesResponse {
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
    'Medical',
    'Cleaning Services'
  ]

  // Configuration - Categories that are recurring but with variable amounts
  const GASTOS_COMPROMETIDOS_CATEGORIES = [
    ...CUSTOS_FIXOS_CATEGORIES,
    'Installments/Financing',
    'Financing',
    'Investments',
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

  // Helper function to calculate budget info for a category
  const calculateBudgetInfo = (categoryName: string, spent: number) => {
    const categoryBudgets = budgets.filter(b => b.category === categoryName)
    const julianaBudget = categoryBudgets.find(b => b.person === 'Juliana')?.amount || 0
    const gabrielBudget = categoryBudgets.find(b => b.person === 'Gabriel')?.amount || 0

    // Calculate budget based on selected person
    let totalBudget = 0
    let displayJulianaBudget = 0
    let displayGabrielBudget = 0

    if (selectedPerson === 'Gabriel') {
      totalBudget = gabrielBudget
      displayGabrielBudget = gabrielBudget
    } else if (selectedPerson === 'Juliana') {
      totalBudget = julianaBudget
      displayJulianaBudget = julianaBudget
    } else {
      totalBudget = julianaBudget + gabrielBudget
      displayJulianaBudget = julianaBudget
      displayGabrielBudget = gabrielBudget
    }

    // Calculate budget metrics if budget exists
    if (totalBudget > 0) {
      const remaining = totalBudget - spent
      const percentageUsed = (spent / totalBudget) * 100

      return {
        juliana: displayJulianaBudget,
        gabriel: displayGabrielBudget,
        total: totalBudget,
        remaining: remaining,
        percentageUsed: percentageUsed
      }
    }

    return undefined
  }

  // Build categories array with budget information
  const categories: CategoryData[] = []
  const processedCategories = new Set<string>()

  // First, process categories with transactions
  categoryMap.forEach((data, name) => {
    const budgetInfo = calculateBudgetInfo(name, data.total)

    categories.push({
      name,
      count: data.count,
      total: data.total,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      average: data.total / data.count,
      transactions: includeTransactions ? data.transactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ) : [],
      budget: budgetInfo
    })

    processedCategories.add(name)
  })

  // Then, add categories that have budgets but no transactions
  budgets.forEach(budget => {
    if (!processedCategories.has(budget.category)) {
      const budgetInfo = calculateBudgetInfo(budget.category, 0)

      if (budgetInfo) {
        categories.push({
          name: budget.category,
          count: 0,
          total: 0,
          percentage: 0,
          average: 0,
          transactions: [],
          budget: budgetInfo
        })

        processedCategories.add(budget.category)
      }
    }
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