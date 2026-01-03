import type { BudgetTemplateInput, BudgetTemplate } from '~/types/budgetTemplate'
import { saveBudgetTemplatesToGoogleSheets, fetchBudgetTemplatesFromGoogleSheets } from '../utils/budgetTemplateSheets'

/**
 * Save or update budget templates
 *
 * Creates new budget templates or updates existing ones in Google Sheets.
 * If a template for the same category/person exists, it will be updated.
 * Otherwise, a new template will be created.
 *
 * 📊 **Use Cases:**
 * - Configure percentage-based budget templates
 * - Update existing template percentages
 * - Bulk template configuration
 *
 * 💡 **Request Body:**
 * Can be a single template object or an array of template objects
 *
 * ✅ **Validations:**
 * - Percentage must be between 0 and 100
 * - Sum of active percentages per person must be ≤ 100%
 * - No duplicate category-person combinations
 *
 * @body templates - Single BudgetTemplateInput or array of BudgetTemplateInput objects
 *
 * @returns Array of saved BudgetTemplate objects with IDs and timestamps
 *
 * @example
 * // Save a single template
 * POST /api/budget-templates
 * {
 *   "category": "Food",
 *   "person": "Juliana",
 *   "percentage": 25.0,
 *   "active": true
 * }
 *
 * @example
 * // Save multiple templates at once
 * POST /api/budget-templates
 * [
 *   {
 *     "category": "Food",
 *     "person": "Juliana",
 *     "percentage": 25.0,
 *     "active": true
 *   },
 *   {
 *     "category": "Transportation",
 *     "person": "Juliana",
 *     "percentage": 10.0,
 *     "active": true
 *   }
 * ]
 */
export default defineEventHandler(async (event): Promise<BudgetTemplate[]> => {
  try {
    // Read request body
    const body = await readBody(event)

    console.log('[API] Saving budget templates. Body:', body)

    // Validate input
    let templatesToSave: BudgetTemplateInput[]

    if (Array.isArray(body)) {
      templatesToSave = body
    } else if (body && typeof body === 'object') {
      // Single template object
      templatesToSave = [body as BudgetTemplateInput]
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
        data: 'Request body must be a BudgetTemplateInput object or array of BudgetTemplateInput objects',
      })
    }

    // Validate each template
    for (const template of templatesToSave) {
      const errors: string[] = []

      if (!template.category || typeof template.category !== 'string') {
        errors.push('category is required and must be a string')
      }

      if (!template.person || (template.person !== 'Juliana' && template.person !== 'Gabriel')) {
        errors.push('person is required and must be either "Juliana" or "Gabriel"')
      }

      if (template.percentage === undefined || typeof template.percentage !== 'number' || template.percentage < 0 || template.percentage > 100) {
        errors.push('percentage is required and must be a number between 0 and 100')
      }

      if (template.active !== undefined && typeof template.active !== 'boolean') {
        errors.push('active must be a boolean')
      }

      if (errors.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid template data',
          data: {
            template,
            errors,
          },
        })
      }
    }

    // Check for duplicate category-person combinations in the input
    const seen = new Set<string>()
    for (const template of templatesToSave) {
      const key = `${template.category}-${template.person}`.toLowerCase()
      if (seen.has(key)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Duplicate template',
          data: `Template for category "${template.category}" and person "${template.person}" appears multiple times in the request`,
        })
      }
      seen.add(key)
    }

    // Fetch existing templates to validate percentage sums
    const existingTemplates = await fetchBudgetTemplatesFromGoogleSheets()

    // Create a map of existing templates (exclude ones being updated)
    const existingTemplatesMap = new Map<string, BudgetTemplate>()
    for (const existing of existingTemplates) {
      const key = `${existing.category}-${existing.person}`.toLowerCase()
      // Only keep if not being updated
      const isBeingUpdated = templatesToSave.some(
        t => t.category === existing.category && t.person === existing.person
      )
      if (!isBeingUpdated) {
        existingTemplatesMap.set(key, existing)
      }
    }

    // Calculate total percentages after saving
    const totalsAfterSave = {
      Juliana: 0,
      Gabriel: 0,
    }

    // Add percentages from existing templates (not being updated)
    for (const template of existingTemplatesMap.values()) {
      if (template.active) {
        totalsAfterSave[template.person] += template.percentage
      }
    }

    // Add percentages from templates being saved
    for (const template of templatesToSave) {
      const active = template.active !== undefined ? template.active : true
      if (active) {
        totalsAfterSave[template.person] += template.percentage
      }
    }

    // Validate percentage sums (should be ≤ 100% for each person)
    const validationErrors: string[] = []

    if (totalsAfterSave.Juliana > 100) {
      validationErrors.push(`Total percentage for Juliana would be ${totalsAfterSave.Juliana.toFixed(2)}% (must be ≤ 100%)`)
    }

    if (totalsAfterSave.Gabriel > 100) {
      validationErrors.push(`Total percentage for Gabriel would be ${totalsAfterSave.Gabriel.toFixed(2)}% (must be ≤ 100%)`)
    }

    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Percentage sum exceeds 100%',
        data: {
          errors: validationErrors,
          totalsAfterSave,
        },
      })
    }

    console.log(`[API] Validated ${templatesToSave.length} templates. Totals after save:`, totalsAfterSave)
    console.log(`[API] Saving to Google Sheets...`)

    // Save to Google Sheets
    const savedTemplates = await saveBudgetTemplatesToGoogleSheets(templatesToSave)

    console.log(`[API] Successfully saved ${savedTemplates.length} templates`)

    return savedTemplates
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error saving budget templates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save budget templates',
      data: error.message,
    })
  }
})
