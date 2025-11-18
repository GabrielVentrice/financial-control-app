import { ref, computed } from 'vue'
import type { Transaction } from '~/types/transaction'

export type PersonType = 'Juliana' | 'Gabriel' | 'Ambos'

// Global state for person filter
const selectedPerson = ref<PersonType>('Gabriel')

/**
 * Composable for managing person filter state
 * Person identification and filtering is now done server-side
 * This composable only manages the UI state
 */
export const usePersonFilter = () => {
  const setPersonFilter = (person: PersonType) => {
    console.log('🔄 Mudando filtro de pessoa para:', person)
    selectedPerson.value = person
    console.log('✅ Filtro atualizado. Valor atual:', selectedPerson.value)
  }

  /**
   * @deprecated Use server-side filtering instead via fetchTransactions({ person: 'Gabriel' })
   * Kept for backward compatibility with existing code
   */
  const filterTransactionsByPerson = (transactions: Transaction[]): Transaction[] => {
    if (selectedPerson.value === 'Ambos') {
      return transactions
    }

    return transactions.filter(transaction => {
      return transaction.person === selectedPerson.value
    })
  }

  return {
    selectedPerson: computed(() => selectedPerson.value),
    setPersonFilter,
    filterTransactionsByPerson,
  }
}
