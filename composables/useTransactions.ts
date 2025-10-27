import type { Transaction } from '~/types/transaction'

export const useTransactions = () => {
  const transactions = useState<Transaction[]>('transactions', () => [])
  const loading = useState<boolean>('transactions-loading', () => false)
  const error = useState<string | null>('transactions-error', () => null)

  const fetchTransactions = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Transaction[]>('/api/transactions')
      transactions.value = data
    } catch (e: any) {
      error.value = e.message || 'Erro ao carregar transações'
      console.error('Erro ao buscar transações:', e)
    } finally {
      loading.value = false
    }
  }

  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    return transactions.value.filter((t) => {
      const transactionDate = new Date(t.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return transactionDate >= start && transactionDate <= end
    })
  }

  const getTotalAmount = (filteredTransactions?: Transaction[]) => {
    const txs = filteredTransactions || transactions.value
    return txs.reduce((sum, t) => sum + t.amount, 0)
  }

  const getTransactionsByOrigin = (origin: string) => {
    return transactions.value.filter((t) =>
      t.origin.toLowerCase().includes(origin.toLowerCase())
    )
  }

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
