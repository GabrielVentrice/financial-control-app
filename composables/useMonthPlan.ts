import type { MonthSnapshot } from '~/server/utils/monthSnapshot'
import { currentMonthKey } from '~/shared/dates'

/**
 * The month, as the server measured it.
 *
 * Every number on the screen — the headline, the pace bar, each category line —
 * arrives in one payload, so they cannot contradict each other. Saving a target
 * returns the recomputed snapshot, which is why editing a line updates the
 * totals without a refetch and without the client redoing the arithmetic on a
 * different set of rows.
 *
 * The cache key carries the month and the person: changing either is a
 * different question, and sharing one key made the second answer overwrite the
 * first (the bug that made useTransactions drop its parameters entirely).
 */
export const useMonthPlan = (monthKey: Ref<string>) => {
  const { selectedPerson } = usePersonFilter()

  const key = computed(() => `month-${monthKey.value}-${selectedPerson.value}`)

  const {
    data: snapshot,
    status,
    error: fetchError,
    refresh,
  } = useAsyncData<MonthSnapshot | null>(
    key,
    () =>
      $fetch<MonthSnapshot>('/api/month', {
        query: { month: monthKey.value, person: selectedPerson.value },
      }),
    {
      default: () => null,
      watch: [monthKey, selectedPerson],
      getCachedData: (k, nuxtApp) => nuxtApp.payload.data[k] ?? nuxtApp.static.data[k],
    }
  )

  const saving = useState<string | null>('month-saving-category', () => null)
  const saveError = useState<string | null>('month-save-error', () => null)

  const saveTarget = async (category: string, monthlyAmount: number): Promise<boolean> => {
    saving.value = category
    saveError.value = null
    try {
      snapshot.value = await $fetch<MonthSnapshot>('/api/budget-targets', {
        method: 'POST',
        body: {
          category,
          monthlyAmount,
          month: monthKey.value,
          person: selectedPerson.value,
        },
      })
      return true
    } catch (e: any) {
      saveError.value =
        e?.data?.data?.errors?.join(', ') || e?.statusMessage || e?.message || 'Erro ao salvar'
      return false
    } finally {
      saving.value = null
    }
  }

  return {
    snapshot,
    loading: computed(() => status.value === 'pending'),
    error: computed(() => fetchError.value?.message || null),
    saving,
    saveError,
    saveTarget,
    refresh,
  }
}

export { currentMonthKey }
