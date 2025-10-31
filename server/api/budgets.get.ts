import type { Budget, BudgetQueryParams, BudgetsResponse } from '~/types/transaction'
import { fetchBudgetsFromGoogleSheets } from '../utils/budgetSheets'

/**
 * Get budget configurations
 *
 * Fetches budget data from Google Sheets with optional filtering by category, month, and year.
 *
 * 📊 **Use Cases:**
 * - Display budget configuration page
 * - Compare actual spending vs budget
 * - Budget planning and analysis
 * - Monthly/yearly budget overview
 *
 * 🔍 **Filtering:**
 * - By category: Get budget for specific categories
 * - By month/year: Get budgets for specific time periods
 * - By date range: Get budgets within a date range
 *
 * @param category - Filter by category name (case-insensitive)
 * @param month - Filter by month (1-12)
 * @param year - Filter by year (YYYY)
 * @param startDate - Start date for filtering (YYYY-MM-DD format)
 * @param endDate - End date for filtering (YYYY-MM-DD format)
 *
 * @returns BudgetsResponse object with budgets array, total budgeted amount, and categories list
 *
 * @example
 * // Get all budgets
 * GET /api/budgets
 *
 * @example
 * // Get budgets for a specific category
 * GET /api/budgets?category=Groceries
 *
 * @example
 * // Get budgets for a specific month/year
 * GET /api/budgets?month=1&year=2025
 *
 * @example
 * // Get budgets within a date range
 * GET /api/budgets?startDate=2025-01-01&endDate=2025-12-31
 */
export default defineEventHandler(async (event): Promise<BudgetsResponse> => {
  try {
    // Parse query parameters
    const query = getQuery(event) as BudgetQueryParams

    console.log('[API] Fetching budgets with params:', query)

    // Fetch all budgets from Google Sheets
    let budgets = await fetchBudgetsFromGoogleSheets()
    console.log('[API] Fetched budgets from Google Sheets:', budgets.length)

    // Apply filters
    if (query.category) {
      const categoryLower = query.category.toLowerCase()
      budgets = budgets.filter(b => b.category.toLowerCase().includes(categoryLower))
      console.log(`[API] Filtered by category '${query.category}':`, budgets.length)
    }

    if (query.person) {
      budgets = budgets.filter(b => b.person === query.person)
      console.log(`[API] Filtered by person '${query.person}':`, budgets.length)
    }

    if (query.month) {
      const month = parseInt(query.month)
      if (month >= 1 && month <= 12) {
        budgets = budgets.filter(b => b.month === month)
        console.log(`[API] Filtered by month ${month}:`, budgets.length)
      }
    }

    if (query.year) {
      const year = parseInt(query.year)
      budgets = budgets.filter(b => b.year === year)
      console.log(`[API] Filtered by year ${year}:`, budgets.length)
    }

    // If month/year filter was applied but no budgets found, use the most recent previous month
    if (query.month && query.year && budgets.length === 0) {
      const requestedMonth = parseInt(query.month)
      const requestedYear = parseInt(query.year)
      const requestedDate = new Date(requestedYear, requestedMonth - 1, 1)

      console.log(`[API] No budgets found for ${requestedMonth}/${requestedYear}, searching for most recent previous month...`)

      // Fetch all budgets again (without month/year filter)
      let allBudgets = await fetchBudgetsFromGoogleSheets()

      // Apply other filters (category, person) if they were present
      if (query.category) {
        const categoryLower = query.category.toLowerCase()
        allBudgets = allBudgets.filter(b => b.category.toLowerCase().includes(categoryLower))
      }

      if (query.person) {
        allBudgets = allBudgets.filter(b => b.person === query.person)
      }

      // Find budgets from months before the requested date
      const previousBudgets = allBudgets.filter(budget => {
        const budgetDate = new Date(budget.year, budget.month - 1, 1)
        return budgetDate < requestedDate
      })

      if (previousBudgets.length > 0) {
        // Sort by date descending to get the most recent
        previousBudgets.sort((a, b) => {
          const dateA = new Date(a.year, a.month - 1, 1)
          const dateB = new Date(b.year, b.month - 1, 1)
          return dateB.getTime() - dateA.getTime()
        })

        // Get the most recent month/year
        const mostRecentMonth = previousBudgets[0].month
        const mostRecentYear = previousBudgets[0].year

        // Get all budgets from that most recent month
        budgets = previousBudgets.filter(b => b.month === mostRecentMonth && b.year === mostRecentYear)

        console.log(`[API] ✅ Using budgets from ${mostRecentMonth}/${mostRecentYear} as fallback (${budgets.length} budgets)`)
      } else {
        console.log(`[API] ⚠️  No previous budgets found for fallback`)
      }
    }

    // Filter by date range if provided
    if (query.startDate || query.endDate) {
      budgets = budgets.filter(budget => {
        // Create date from budget month/year (using first day of month)
        const budgetDate = new Date(budget.year, budget.month - 1, 1)

        if (query.startDate) {
          const startDate = new Date(query.startDate)
          // Compare only year and month
          if (budgetDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
            return false
          }
        }

        if (query.endDate) {
          const endDate = new Date(query.endDate)
          // Compare only year and month
          if (budgetDate > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) {
            return false
          }
        }

        return true
      })
      console.log(`[API] Filtered by date range:`, budgets.length)
    }

    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0)

    const totalByPerson = {
      Juliana: budgets.filter(b => b.person === 'Juliana').reduce((sum, budget) => sum + budget.amount, 0),
      Gabriel: budgets.filter(b => b.person === 'Gabriel').reduce((sum, budget) => sum + budget.amount, 0),
    }

    // Get unique categories
    const categories = Array.from(new Set(budgets.map(b => b.category))).sort()

    // Sort budgets by year, month, person, and category
    budgets.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year // Newest first
      if (a.month !== b.month) return b.month - a.month // Newest first
      if (a.person !== b.person) return a.person.localeCompare(b.person) // Juliana first
      return a.category.localeCompare(b.category)
    })

    const response: BudgetsResponse = {
      budgets,
      totalBudgeted,
      totalByPerson,
      categories,
    }

    console.log('[API] Returning budgets response:', {
      count: budgets.length,
      totalBudgeted,
      totalByPerson,
      categoriesCount: categories.length,
    })

    return response
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error processing budgets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process budgets',
      data: error.message,
    })
  }
})
