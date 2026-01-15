import type { Transaction, TransactionQueryParams } from '~/types/transaction'
import type { CacheRefreshResponse } from '~/types/cache'

/**
 * Composable for fetching and managing transactions using SSR
 * Uses useAsyncData for automatic SSR hydration - data loads on server
 * All filtering is done server-side via query parameters
 */
export const useTransactions = (initialParams?: MaybeRef<TransactionQueryParams>) => {
  // Convert to reactive ref if needed
  const params = isRef(initialParams) ? initialParams : ref(initialParams)

  // Create unique cache key based on parameters
  const cacheKey = computed(() => {
    const p = unref(params) || {}
    return `transactions-${JSON.stringify(p)}`
  })

  // Build query object for $fetch
  const queryObject = computed(() => {
    const p = unref(params)
    if (!p) return {}

    const query: Record<string, string> = {}
    if (p.person) query.person = p.person
    if (p.startDate) query.startDate = p.startDate
    if (p.endDate) query.endDate = p.endDate
    if (p.searchTerm) query.searchTerm = p.searchTerm
    if (p.origin) query.origin = p.origin
    if (p.destination) query.destination = p.destination
    if (p.processInstallments !== undefined) {
      query.processInstallments = String(p.processInstallments)
    }
    return query
  })

  // Use useAsyncData for SSR support - data fetches on server
  const {
    data: transactions,
    status,
    error: fetchError,
    refresh: refreshData,
    execute
  } = useAsyncData<Transaction[]>(
    cacheKey.value,
    () => $fetch<Transaction[]>('/api/transactions', {
      query: queryObject.value
    }),
    {
      default: () => [],
      watch: [queryObject], // Re-fetch when params change
      immediate: true // Fetch immediately on SSR
    }
  )

  // Computed states
  const loading = computed(() => status.value === 'pending')
  const error = computed(() => fetchError.value?.message || null)

  // Refreshing state for cache refresh
  const refreshing = useState<boolean>('cache-refreshing', () => false)

  /**
   * Refreshes cache by forcing a fetch from Google Sheets
   * Then refreshes the client data automatically
   */
  const refreshCache = async (): Promise<CacheRefreshResponse> => {
    refreshing.value = true

    try {
      const response = await $fetch<CacheRefreshResponse>('/api/cache/refresh', {
        method: 'POST'
      })

      if (response.success) {
        // Refresh the transactions data after cache update
        await refreshData()
      }

      return response
    } catch (e: any) {
      console.error('Erro ao atualizar cache:', e)

      return {
        success: false,
        metadata: {
          lastUpdate: new Date().toISOString(),
          status: 'error',
          transactionCount: 0,
          expiresAt: new Date().toISOString(),
          spreadsheetId: '',
          version: 1
        },
        transactionCount: 0,
        message: e.message || 'Erro ao atualizar cache',
        error: e.message || 'Erro ao atualizar cache'
      }
    } finally {
      refreshing.value = false
    }
  }

  /**
   * Helper: Get total amount from a list of transactions
   * This is a client-side calculation on already-filtered data
   */
  const getTotalAmount = (filteredTransactions?: Transaction[]) => {
    const txs = filteredTransactions || transactions.value || []
    return txs.reduce((sum, t) => sum + t.amount, 0)
  }

  /**
   * Helper: Client-side filter by date range (for already-fetched data)
   */
  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    return (transactions.value || []).filter((t) => {
      const transactionDate = new Date(t.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return transactionDate >= start && transactionDate <= end
    })
  }

  /**
   * Helper: Client-side filter by origin (for already-fetched data)
   */
  const getTransactionsByOrigin = (origin: string) => {
    return (transactions.value || []).filter((t) =>
      t.origin.toLowerCase().includes(origin.toLowerCase())
    )
  }

  /**
   * Helper: Client-side filter by description (for already-fetched data)
   */
  const getTransactionsByDescription = (searchTerm: string) => {
    return (transactions.value || []).filter((t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  /**
   * Manual fetch - for backward compatibility
   * With useAsyncData, data is fetched automatically, but this allows manual refresh
   */
  const fetchTransactions = async (newParams?: TransactionQueryParams) => {
    if (newParams && isRef(params)) {
      params.value = newParams
    }
    await refreshData()
  }

  return {
    transactions: computed(() => transactions.value || []),
    loading,
    error,
    refreshing: readonly(refreshing),
    refresh: refreshData,
    refreshCache,
    fetchTransactions, // Backward compatibility
    execute,
    getTransactionsByDateRange,
    getTotalAmount,
    getTransactionsByOrigin,
    getTransactionsByDescription,
  }
}
