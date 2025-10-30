import type { Transaction, TransactionQueryParams } from '~/types/transaction'

/**
 * Composable for fetching and managing transactions
 * All filtering is now done server-side via query parameters
 */
export const useTransactions = () => {
  const transactions = useState<Transaction[]>('transactions', () => [])
  const loading = useState<boolean>('transactions-loading', () => false)
  const error = useState<string | null>('transactions-error', () => null)

  /**
   * Fetches transactions from the API with optional filters
   * All filtering is performed server-side for better performance
   *
   * @param params - Query parameters for filtering
   */
  const fetchTransactions = async (params?: TransactionQueryParams) => {
    loading.value = true
    error.value = null

    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams()

      if (params?.person) queryParams.append('person', params.person)
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)
      if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm)
      if (params?.origin) queryParams.append('origin', params.origin)
      if (params?.destination) queryParams.append('destination', params.destination)
      if (params?.processInstallments !== undefined) {
        queryParams.append('processInstallments', String(params.processInstallments))
      }

      const url = queryParams.toString()
        ? `/api/transactions?${queryParams.toString()}`
        : '/api/transactions'

      const data = await $fetch<Transaction[]>(url)
      transactions.value = data
    } catch (e: any) {
      error.value = e.message || 'Erro ao carregar transações'
      console.error('Erro ao buscar transações:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Helper: Get total amount from a list of transactions
   * This is a client-side calculation on already-filtered data
   */
  const getTotalAmount = (filteredTransactions?: Transaction[]) => {
    const txs = filteredTransactions || transactions.value
    return txs.reduce((sum, t) => sum + t.amount, 0)
  }

  /**
   * Helper: Client-side filter by date range (for already-fetched data)
   * Prefer using fetchTransactions with startDate/endDate params for server-side filtering
   */
  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    return transactions.value.filter((t) => {
      const transactionDate = new Date(t.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return transactionDate >= start && transactionDate <= end
    })
  }

  /**
   * Helper: Client-side filter by origin (for already-fetched data)
   * Prefer using fetchTransactions with origin param for server-side filtering
   */
  const getTransactionsByOrigin = (origin: string) => {
    return transactions.value.filter((t) =>
      t.origin.toLowerCase().includes(origin.toLowerCase())
    )
  }

  /**
   * Helper: Client-side filter by description (for already-fetched data)
   * Prefer using fetchTransactions with searchTerm param for server-side filtering
   */
  const getTransactionsByDescription = (searchTerm: string) => {
    return transactions.value.filter((t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return {
    transactions: readonly(transactions),
    loading: readonly(loading),
    error: readonly(error),
    fetchTransactions,
    getTransactionsByDateRange,
    getTotalAmount,
    getTransactionsByOrigin,
    getTransactionsByDescription,
  }
}
