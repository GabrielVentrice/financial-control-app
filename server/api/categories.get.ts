import type { Transaction, CategoriesQueryParams, CategoriesResponse, CategoryData, CategoryTotals, Budget } from '~/types/transaction'
import { loadTransactions } from '../utils/loadTransactions'
import { validateQueryParams } from '../utils/transactionFilters'
import { fetchBudgetsFromGoogleSheets } from '../utils/budgetSheets'
import { isSpendingCategory, expenseAmount, UNCATEGORIZED } from '~/shared/expenseRules'

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

    // STEP 1-4: same read path as /api/transactions (Postgres, person
    // enrichment, installment expansion, filters).
    const transactions = await loadTransactions(query)

    // STEP 5: Fetch budgets for the filtered period
    let budgets: Budget[] = []
    try {
      budgets = await fetchBudgetsFromGoogleSheets()

      // If date filters are present, filter budgets to match the period.
      // The month comes from the "YYYY-MM" slice — building a Date out of the
      // ISO day parses it as UTC and can land on the previous month in UTC-3.
      if (query.endDate) {
        const [filterYear, filterMonth] = query.endDate.split('-').map(Number)
        budgets = budgets.filter(
          budget => budget.year === filterYear && budget.month === filterMonth
        )
      }
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

  // Keep only rows whose destination is an actual spending category — accounts,
  // cards and adjustments are movements, not spending (shared/expenseRules.ts).
  const filteredTransactions = transactions.filter(t => isSpendingCategory(t.destination))

  // Group transactions by category
  const categoryMap = new Map<string, { count: number; total: number; transactions: Transaction[] }>()

  filteredTransactions.forEach(transaction => {
    const category = transaction.destination || UNCATEGORIZED
    const existing = categoryMap.get(category) || { count: 0, total: 0, transactions: [] }

    categoryMap.set(category, {
      count: existing.count + 1,
      total: existing.total + expenseAmount(transaction),
      transactions: [...existing.transactions, transaction]
    })
  })

  // Calculate total amount for percentage calculations
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + expenseAmount(t), 0)

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
      const category = t.destination || UNCATEGORIZED
      return isCustoFixoCategory(category)
    })
    .reduce((sum, t) => sum + expenseAmount(t), 0)

  const gastosComprometidosTotal = filteredTransactions
    .filter(t => {
      const category = t.destination || UNCATEGORIZED
      return isGastoComprometidoCategory(category)
    })
    .reduce((sum, t) => sum + expenseAmount(t), 0)

  const variableCostsTotal = filteredTransactions
    .filter(t => {
      const category = t.destination || UNCATEGORIZED
      return !isCustoFixoCategory(category) && !isGastoComprometidoCategory(category)
    })
    .reduce((sum, t) => sum + expenseAmount(t), 0)

  // Count categories by type
  const custosFixosCategoriesSet = new Set<string>()
  const gastosComprometidosCategoriesSet = new Set<string>()

  filteredTransactions.forEach(t => {
    const category = t.destination || UNCATEGORIZED
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