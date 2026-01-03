import type {
  BudgetTemplate,
  BudgetTemplateInput,
  BudgetTemplatesResponse,
  ApplyTemplateRequest,
  ApplyTemplateResponse
} from '~/types/budgetTemplate'

/**
 * Composable for managing budget templates
 *
 * Provides functions to fetch, save, and apply budget templates
 */
export function useBudgetTemplates() {
  const templates = ref<BudgetTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalByPerson = ref<{ Juliana: number; Gabriel: number }>({ Juliana: 0, Gabriel: 0 })
  const validByPerson = ref<{ Juliana: boolean; Gabriel: boolean }>({ Juliana: true, Gabriel: true })

  /**
   * Fetches budget templates from API
   * @param person - Optional filter by person
   * @param active - Optional filter by active status
   */
  async function fetchTemplates(person?: 'Juliana' | 'Gabriel', active?: boolean) {
    loading.value = true
    error.value = null

    try {
      const params: Record<string, string> = {}

      if (person) {
        params.person = person
      }

      if (active !== undefined) {
        params.active = active.toString()
      }

      const response = await $fetch<BudgetTemplatesResponse>('/api/budget-templates', {
        params,
      })

      templates.value = response.templates || []
      totalByPerson.value = response.totalByPerson || { Juliana: 0, Gabriel: 0 }
      validByPerson.value = response.validByPerson || { Juliana: true, Gabriel: true }

      console.log('[useBudgetTemplates] Fetched templates:', {
        count: templates.value.length,
        totalByPerson: totalByPerson.value,
        validByPerson: validByPerson.value,
      })
    } catch (err: any) {
      console.error('[useBudgetTemplates] Error fetching templates:', err)
      error.value = err.data?.message || err.message || 'Failed to fetch templates'
      templates.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Saves budget templates to API
   * @param templatesToSave - Array of BudgetTemplateInput objects
   * @returns Saved templates or null on error
   */
  async function saveTemplates(templatesToSave: BudgetTemplateInput[]): Promise<BudgetTemplate[] | null> {
    loading.value = true
    error.value = null

    try {
      console.log('[useBudgetTemplates] Saving templates:', templatesToSave)

      const response = await $fetch<BudgetTemplate[]>('/api/budget-templates', {
        method: 'POST',
        body: templatesToSave,
      })

      console.log('[useBudgetTemplates] Templates saved successfully:', response.length)

      // Refresh templates after saving
      await fetchTemplates()

      return response
    } catch (err: any) {
      console.error('[useBudgetTemplates] Error saving templates:', err)
      error.value = err.data?.message || err.message || 'Failed to save templates'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Applies budget template for a specific month/year
   * @param request - ApplyTemplateRequest with person, month, year
   * @returns ApplyTemplateResponse or null on error
   */
  async function applyTemplate(request: ApplyTemplateRequest): Promise<ApplyTemplateResponse | null> {
    loading.value = true
    error.value = null

    try {
      console.log('[useBudgetTemplates] Applying template:', request)

      const response = await $fetch<ApplyTemplateResponse>('/api/budgets/apply-template', {
        method: 'POST',
        body: request,
      })

      console.log('[useBudgetTemplates] Template applied successfully:', response)

      return response
    } catch (err: any) {
      console.error('[useBudgetTemplates] Error applying template:', err)
      error.value = err.data?.message || err.message || 'Failed to apply template'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    templates,
    loading,
    error,
    totalByPerson,
    validByPerson,
    fetchTemplates,
    saveTemplates,
    applyTemplate,
  }
}
