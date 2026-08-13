import type { Transaction } from '~/types/transaction'

/**
 * The one dataset every transaction screen shares: the whole processed book
 * from /api/transactions, fetched once and reused across client-side
 * navigation.
 *
 * Deliberately takes no parameters. Every consumer wants the same payload, so
 * a single fixed useAsyncData key + getCachedData means the five screens hit
 * the network once per session (or on explicit refresh) and navigation between
 * them is instant. The old parameterized version froze its computed cache key
 * at setup time, so differently-filtered payloads would have silently
 * overwritten each other — per-screen filtering belongs in the screens,
 * on this shared data.
 */
export const useTransactions = () => {
  const {
    data: transactions,
    status,
    error: fetchError,
    refresh,
  } = useAsyncData<Transaction[]>(
    'transactions-all',
    () => $fetch<Transaction[]>('/api/transactions'),
    {
      default: () => [],
      // Reuse already-loaded data on client-side navigation instead of
      // re-fetching (and showing a loading state) every time a page mounts.
      // Refresh happens on full reload, an explicit refresh() or the sync
      // button's refreshNuxtData().
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
    }
  )

  const loading = computed(() => status.value === 'pending')
  const error = computed(() => fetchError.value?.message || null)

  return {
    transactions: computed(() => transactions.value || []),
    loading,
    error,
    refresh,
  }
}
