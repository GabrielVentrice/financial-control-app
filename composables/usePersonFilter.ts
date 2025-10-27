import { ref, computed } from 'vue'
import type { Transaction } from '~/types/transaction'

export type PersonType = 'Juliana' | 'Gabriel' | 'Ambos'

// Global state for person filter
const selectedPerson = ref<PersonType>('Ambos')

export const usePersonFilter = () => {
  const setPersonFilter = (person: PersonType) => {
    console.log('🔄 Mudando filtro de pessoa para:', person)
    selectedPerson.value = person
    console.log('✅ Filtro atualizado. Valor atual:', selectedPerson.value)
  }

  /**
   * Identifies which person a transaction belongs to based on the Origin field
   * You should customize the patterns below to match your actual account/card names
   */
  const identifyPerson = (origin: string): PersonType | null => {
    const originLower = origin.toLowerCase()

    // Define patterns for Juliana's accounts/cards
    const julianaPatterns = [
      'juliana',
      'cartao juliana',
      'conta juliana',
      'Credit Card Juliana',
      'Bank Account Juliana',
      // Add more patterns as needed
    ]

    // Define patterns for Gabriel's accounts/cards
    const gabrielPatterns = [
      'gabriel',
      'cartao gabriel',
      'conta gabriel',
      'Bank Account Gabriel',
      'Credit Card Gabriel',

      // Add more patterns as needed
    ]

    // Check if origin matches Juliana's patterns
    if (julianaPatterns.some(pattern => originLower.includes(pattern))) {
      return 'Juliana'
    }

    // Check if origin matches Gabriel's patterns
    if (gabrielPatterns.some(pattern => originLower.includes(pattern))) {
      return 'Gabriel'
    }

    // Return null if no match (transaction won't be assigned to anyone)
    return null
  }

  /**
   * Filters transactions based on the selected person
   */
  const filterTransactionsByPerson = (transactions: Transaction[]): Transaction[] => {
    if (selectedPerson.value === 'Ambos') {
      return transactions
    }

    return transactions.filter(transaction => {
      const person = identifyPerson(transaction.origin)
      return person === selectedPerson.value
    })
  }

  return {
    selectedPerson: computed(() => selectedPerson.value),
    setPersonFilter,
    identifyPerson,
    filterTransactionsByPerson,
  }
}
