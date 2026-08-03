import type { DebtSnapshot } from '~/server/utils/debtPlan'

export interface DebtPlanPatch {
  anchorBalance?: number
  anchorDate?: string
  monthlyRate?: number
  monthlyCut?: number
  targetMonth?: string | null
}

/**
 * The debt payoff plan.
 *
 * Every number on the screen comes from the server in one payload, so the plan
 * you look at and the plan the projection is built from cannot disagree. The
 * page never recomputes the balance client-side — it is derived from the anchor
 * plus account movement, and that derivation lives in one place.
 */
export const useDebtPlan = () => {
  const {
    data: snapshot,
    status,
    error: fetchError,
    refresh,
  } = useAsyncData<DebtSnapshot | null>(
    'debt-plan',
    () => $fetch<DebtSnapshot | null>('/api/debt'),
    {
      default: () => null,
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
    }
  )

  const saving = useState<boolean>('debt-saving', () => false)
  const saveError = useState<string | null>('debt-save-error', () => null)

  const savePlan = async (patch: DebtPlanPatch): Promise<boolean> => {
    saving.value = true
    saveError.value = null
    try {
      const updated = await $fetch<DebtSnapshot>('/api/debt', { method: 'POST', body: patch })
      snapshot.value = updated
      return true
    } catch (e: any) {
      saveError.value = e?.data?.data?.errors?.join(', ') || e?.statusMessage || e?.message || 'Erro ao salvar'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    snapshot,
    loading: computed(() => status.value === 'pending'),
    error: computed(() => fetchError.value?.message || null),
    saving,
    saveError,
    savePlan,
    refresh,
  }
}
