import type { BudgetTemplate, BudgetTemplateQueryParams, BudgetTemplatesResponse } from '~/types/budgetTemplate'
import { fetchBudgetTemplatesFromGoogleSheets } from '../utils/budgetTemplateSheets'
import {
  isBudgetTemplateCacheValid,
  readBudgetTemplateCache,
  writeBudgetTemplateCache,
  updateBudgetTemplateCacheMetadata,
  budgetTemplateCacheExists
} from '../utils/budgetTemplateCacheManager'

/**
 * Get budget templates
 *
 * Fetches budget template data from Google Sheets with optional filtering.
 *
 * 📊 **Use Cases:**
 * - Display template configuration page
 * - Apply percentage-based budgets to months with income
 * - Budget template planning and analysis
 *
 * 🔍 **Filtering:**
 * - By person: Get templates for specific person
 * - By category: Get template for specific categories
 * - By active status: Get only active templates
 *
 * @param person - Filter by person (Juliana/Gabriel)
 * @param category - Filter by category name (case-insensitive)
 * @param active - Filter by active status (true/false)
 *
 * @returns BudgetTemplatesResponse object with templates array, total percentages by person, and validation status
 *
 * @example
 * // Get all templates
 * GET /api/budget-templates
 *
 * @example
 * // Get active templates for Juliana
 * GET /api/budget-templates?person=Juliana&active=true
 *
 * @example
 * // Get template for specific category
 * GET /api/budget-templates?category=Food
 */
export default defineEventHandler(async (event): Promise<BudgetTemplatesResponse> => {
  try {
    // Get runtime config
    const config = useRuntimeConfig(event)
    const cacheConfig = config.cache
    const spreadsheetId = config.public.googleSpreadsheetId

    // Parse query parameters
    const query = getQuery(event) as BudgetTemplateQueryParams

    console.log('[API] Fetching budget templates with params:', query)

    let templates: BudgetTemplate[] = []

    // STEP 1: Check cache (if enabled)
    if (cacheConfig.enabled) {
      const exists = await budgetTemplateCacheExists()
      const isValid = await isBudgetTemplateCacheValid()

      if (exists && isValid) {
        // Read from cache
        console.log('[API] Budget template cache is valid, reading from cache')
        templates = await readBudgetTemplateCache()
        console.log('[API] Read templates from cache:', templates.length)
      } else if (exists && !isValid) {
        // Cache expired, fetch fresh data
        console.log('[API] Budget template cache expired, fetching fresh data from Google Sheets')
        templates = await fetchBudgetTemplatesFromGoogleSheets()

        // Update cache
        await writeBudgetTemplateCache(templates)
        await updateBudgetTemplateCacheMetadata(
          templates.length,
          'fresh',
          spreadsheetId,
          cacheConfig.ttlMinutes
        )
        console.log('[API] Updated budget template cache with fresh data:', templates.length)
      } else {
        // Cache doesn't exist, create it
        console.log('[API] Budget template cache missing, creating initial cache')
        templates = await fetchBudgetTemplatesFromGoogleSheets()

        // Create cache
        await writeBudgetTemplateCache(templates)
        await updateBudgetTemplateCacheMetadata(
          templates.length,
          'fresh',
          spreadsheetId,
          cacheConfig.ttlMinutes
        )
        console.log('[API] Created budget template cache with data:', templates.length)
      }
    } else {
      // Cache disabled, fetch directly
      console.log('[API] Budget template cache disabled, fetching from Google Sheets')
      templates = await fetchBudgetTemplatesFromGoogleSheets()
      console.log('[API] Fetched templates from Google Sheets:', templates.length)
    }

    // Apply filters
    if (query.person) {
      templates = templates.filter(t => t.person === query.person)
      console.log(`[API] Filtered by person '${query.person}':`, templates.length)
    }

    if (query.category) {
      const categoryLower = query.category.toLowerCase()
      templates = templates.filter(t => t.category.toLowerCase().includes(categoryLower))
      console.log(`[API] Filtered by category '${query.category}':`, templates.length)
    }

    if (query.active !== undefined) {
      const activeFilter = query.active === 'true'
      templates = templates.filter(t => t.active === activeFilter)
      console.log(`[API] Filtered by active=${activeFilter}:`, templates.length)
    }

    // Calculate totals by person
    const totalByPerson = {
      Juliana: templates
        .filter(t => t.person === 'Juliana' && t.active)
        .reduce((sum, t) => sum + t.percentage, 0),
      Gabriel: templates
        .filter(t => t.person === 'Gabriel' && t.active)
        .reduce((sum, t) => sum + t.percentage, 0),
    }

    // Validate percentages (should be ≤ 100% for each person)
    const validByPerson = {
      Juliana: totalByPerson.Juliana <= 100,
      Gabriel: totalByPerson.Gabriel <= 100,
    }

    // Sort templates by person and category
    templates.sort((a, b) => {
      if (a.person !== b.person) return a.person.localeCompare(b.person) // Juliana first
      return a.category.localeCompare(b.category)
    })

    const response: BudgetTemplatesResponse = {
      templates,
      totalByPerson,
      validByPerson,
    }

    console.log('[API] Returning budget templates response:', {
      count: templates.length,
      totalByPerson,
      validByPerson,
    })

    return response
  } catch (error: any) {
    // If error is already a Nitro error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a new error
    console.error('[API] Error processing budget templates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process budget templates',
      data: error.message,
    })
  }
})
