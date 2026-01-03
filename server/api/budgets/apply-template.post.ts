import type { ApplyTemplateRequest, ApplyTemplateResponse } from '~/types/budgetTemplate'
import type { BudgetInput } from '~/types/transaction'
import { fetchBudgetTemplatesFromGoogleSheets } from '~/server/utils/budgetTemplateSheets'
import { fetchBudgetsFromGoogleSheets, saveBudgetsToGoogleSheets } from '~/server/utils/budgetSheets'

/**
 * Apply budget template for a specific month/year
 *
 * Detects income for the selected month, calculates budget values based on template percentages,
 * and creates budgets for categories that don't have manual configuration yet.
 *
 * 📊 **Use Cases:**
 * - Automatically generate monthly budgets from templates
 * - Apply percentage-based budgets after income is received
 * - Semi-automated budget planning
 *
 * 💡 **Logic:**
 * 1. Fetch income transactions (destination = Bank Account) for the month
 * 2. Sum income by person
 * 3. Fetch active templates for the person
 * 4. Fetch existing budgets for month/year/person
 * 5. Calculate budget values: amount = income * (percentage / 100)
 * 6. Create budgets only for categories without existing configuration
 *
 * ✅ **Validations:**
 * - Template must exist and be active
 * - Income must be detected for the month
 * - Won't overwrite existing manual budgets
 *
 * @body request - ApplyTemplateRequest with person, month, year
 *
 * @returns ApplyTemplateResponse with success status, total income, templates applied, and budgets created count
 *
 * @example
 * POST /api/budgets/apply-template
 * {
 *   "person": "Juliana",
 *   "month": 1,
 *   "year": 2025
 * }
 */
export default defineEventHandler(async (event): Promise<ApplyTemplateResponse> => {
  try {
    // Read request body
    const body = await readBody(event) as ApplyTemplateRequest

    console.log('[API] Applying budget template for:', body)

    // Validate request
    const errors: string[] = []

    if (!body.person || (body.person !== 'Juliana' && body.person !== 'Gabriel')) {
      errors.push('person is required and must be either "Juliana" or "Gabriel"')
    }

    if (!body.month || typeof body.month !== 'number' || body.month < 1 || body.month > 12) {
      errors.push('month is required and must be a number between 1 and 12')
    }

    if (!body.year || typeof body.year !== 'number' || body.year < 2000 || body.year > 2100) {
      errors.push('year is required and must be a valid year (2000-2100)')
    }

    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request',
        data: { errors },
      })
    }

    const { person, month, year } = body

    // STEP 1: Fetch transactions to detect income
    console.log(`[API] Step 1: Fetching transactions for ${person} in ${month}/${year}...`)

    // Call the transactions API with filters
    const transactionsUrl = `/api/transactions?person=${person}&startDate=${year}-${String(month).padStart(2, '0')}-01&endDate=${year}-${String(month).padStart(2, '0')}-31`

    // Internal API call - returns array directly
    const transactionsResponse = await $fetch(transactionsUrl)
    const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : (transactionsResponse.transactions || [])

    console.log(`[API] Fetched ${transactions.length} transactions for ${person}`)

    // Filter transactions for income (destination = Bank Account)
    const incomeTransactions = transactions.filter((t: any) => {
      const destination = (t.destination || '').toLowerCase()
      return destination.includes('bank account')
    })

    console.log(`[API] Found ${incomeTransactions.length} income transactions`)

    // Calculate total income
    const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

    console.log(`[API] Total income for ${person} in ${month}/${year}: R$ ${totalIncome.toFixed(2)}`)

    // Validate that income was detected
    if (totalIncome <= 0) {
      return {
        success: false,
        totalIncome: 0,
        templatesApplied: [],
        budgetsCreated: 0,
        message: `No income detected for ${person} in ${month}/${year}. Unable to apply template.`,
      }
    }

    // STEP 2: Fetch active templates for the person
    console.log(`[API] Step 2: Fetching active templates for ${person}...`)

    const allTemplates = await fetchBudgetTemplatesFromGoogleSheets()
    const activeTemplates = allTemplates.filter(t => t.person === person && t.active)

    console.log(`[API] Found ${activeTemplates.length} active templates for ${person}`)

    if (activeTemplates.length === 0) {
      return {
        success: false,
        totalIncome,
        templatesApplied: [],
        budgetsCreated: 0,
        message: `No active templates found for ${person}. Please configure templates first.`,
      }
    }

    // STEP 3: Fetch existing budgets for this month/year/person
    console.log(`[API] Step 3: Fetching existing budgets for ${person} in ${month}/${year}...`)

    const allBudgets = await fetchBudgetsFromGoogleSheets()
    const existingBudgets = allBudgets.filter(
      b => b.person === person && b.month === month && b.year === year
    )

    console.log(`[API] Found ${existingBudgets.length} existing budgets for ${person} in ${month}/${year}`)

    // Create a set of categories that already have budgets
    const existingCategories = new Set(existingBudgets.map(b => b.category))

    // STEP 4: Calculate budget values and prepare budgets to create
    console.log(`[API] Step 4: Calculating budget values from templates...`)

    const templatesApplied: ApplyTemplateResponse['templatesApplied'] = []
    const budgetsToCreate: BudgetInput[] = []

    for (const template of activeTemplates) {
      const calculatedAmount = Math.round((totalIncome * template.percentage / 100) * 100) / 100 // Round to 2 decimals

      const alreadyExists = existingCategories.has(template.category)

      templatesApplied.push({
        category: template.category,
        percentage: template.percentage,
        calculatedAmount,
        applied: !alreadyExists,
        reason: alreadyExists ? 'Budget already configured manually' : undefined,
      })

      // Only create budget if category doesn't have one yet
      if (!alreadyExists) {
        budgetsToCreate.push({
          category: template.category,
          person,
          month,
          year,
          amount: calculatedAmount,
        })
      }
    }

    console.log(`[API] Templates processed: ${templatesApplied.length}, Budgets to create: ${budgetsToCreate.length}`)

    // STEP 5: Save new budgets
    let budgetsCreated = 0

    if (budgetsToCreate.length > 0) {
      console.log(`[API] Step 5: Saving ${budgetsToCreate.length} new budgets to Google Sheets...`)

      const savedBudgets = await saveBudgetsToGoogleSheets(budgetsToCreate)
      budgetsCreated = savedBudgets.length

      console.log(`[API] Successfully created ${budgetsCreated} budgets`)
    } else {
      console.log(`[API] Step 5: No new budgets to create (all categories already have budgets)`)
    }

    // STEP 6: Return response
    return {
      success: true,
      totalIncome,
      templatesApplied,
      budgetsCreated,
      message: `Successfully applied template for ${person}. Created ${budgetsCreated} budget(s) based on R$ ${totalIncome.toFixed(2)} income.`,
    }
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error applying budget template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to apply budget template',
      data: error.message,
    })
  }
})
