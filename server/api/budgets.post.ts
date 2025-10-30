import type { BudgetInput, Budget } from '~/types/transaction'
import { saveBudgetsToGoogleSheets } from '../utils/budgetSheets'

/**
 * Save or update budget configurations
 *
 * Creates new budgets or updates existing ones in Google Sheets.
 * If a budget for the same category/month/year exists, it will be updated.
 * Otherwise, a new budget will be created.
 *
 * 📊 **Use Cases:**
 * - Set monthly budget for categories
 * - Update existing budget amounts
 * - Bulk budget configuration
 *
 * 💡 **Request Body:**
 * Can be a single budget object or an array of budget objects
 *
 * @body budgets - Single BudgetInput or array of BudgetInput objects
 *
 * @returns Array of saved Budget objects with IDs and timestamps
 *
 * @example
 * // Save a single budget
 * POST /api/budgets
 * {
 *   "category": "Groceries",
 *   "month": 1,
 *   "year": 2025,
 *   "amount": 1500.00
 * }
 *
 * @example
 * // Save multiple budgets at once
 * POST /api/budgets
 * [
 *   {
 *     "category": "Groceries",
 *     "month": 1,
 *     "year": 2025,
 *     "amount": 1500.00
 *   },
 *   {
 *     "category": "Transportation",
 *     "month": 1,
 *     "year": 2025,
 *     "amount": 500.00
 *   }
 * ]
 */
export default defineEventHandler(async (event): Promise<Budget[]> => {
  try {
    // Read request body
    const body = await readBody(event)

    console.log('[API] Saving budgets. Body:', body)

    // Validate input
    let budgetsToSave: BudgetInput[]

    if (Array.isArray(body)) {
      budgetsToSave = body
    } else if (body && typeof body === 'object') {
      // Single budget object
      budgetsToSave = [body as BudgetInput]
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
        data: 'Request body must be a BudgetInput object or array of BudgetInput objects',
      })
    }

    // Validate each budget
    for (const budget of budgetsToSave) {
      const errors: string[] = []

      if (!budget.category || typeof budget.category !== 'string') {
        errors.push('category is required and must be a string')
      }

      if (!budget.person || (budget.person !== 'Juliana' && budget.person !== 'Gabriel')) {
        errors.push('person is required and must be either "Juliana" or "Gabriel"')
      }

      if (!budget.month || typeof budget.month !== 'number' || budget.month < 1 || budget.month > 12) {
        errors.push('month is required and must be a number between 1 and 12')
      }

      if (!budget.year || typeof budget.year !== 'number' || budget.year < 2000 || budget.year > 2100) {
        errors.push('year is required and must be a valid year (2000-2100)')
      }

      if (budget.amount === undefined || typeof budget.amount !== 'number' || budget.amount < 0) {
        errors.push('amount is required and must be a non-negative number')
      }

      if (errors.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid budget data',
          data: {
            budget,
            errors,
          },
        })
      }
    }

    console.log(`[API] Validated ${budgetsToSave.length} budgets. Saving to Google Sheets...`)

    // Save to Google Sheets
    const savedBudgets = await saveBudgetsToGoogleSheets(budgetsToSave)

    console.log(`[API] Successfully saved ${savedBudgets.length} budgets`)

    return savedBudgets
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error saving budgets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save budgets',
      data: error.message,
    })
  }
})
