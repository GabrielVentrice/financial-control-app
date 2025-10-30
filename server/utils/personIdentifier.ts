import type { Transaction } from '~/types/transaction'

export type PersonType = 'Juliana' | 'Gabriel' | null

/**
 * Person identification patterns
 * Customize these patterns to match your actual account/card names
 */
const JULIANA_PATTERNS = [
  'juliana',
  'cartao juliana',
  'conta juliana',
  'credit card juliana',
  'bank account juliana',
]

const GABRIEL_PATTERNS = [
  'gabriel',
  'cartao gabriel',
  'conta gabriel',
  'bank account gabriel',
  'credit card gabriel',
]

/**
 * Identifies which person a transaction belongs to based on the Origin field
 * Pattern matching is case-insensitive and uses substring matching
 */
export function identifyPerson(origin: string): PersonType {
  const originLower = origin.toLowerCase()

  // Check if origin matches Juliana's patterns
  if (JULIANA_PATTERNS.some(pattern => originLower.includes(pattern.toLowerCase()))) {
    return 'Juliana'
  }

  // Check if origin matches Gabriel's patterns
  if (GABRIEL_PATTERNS.some(pattern => originLower.includes(pattern.toLowerCase()))) {
    return 'Gabriel'
  }

  // Return null if no match
  return null
}

/**
 * Enriches transactions with person identification
 * Adds a 'person' field to each transaction
 */
export function enrichTransactionsWithPerson(transactions: Transaction[]): Transaction[] {
  return transactions.map(transaction => ({
    ...transaction,
    person: identifyPerson(transaction.origin),
  }))
}

/**
 * Exports patterns for potential customization or external use
 */
export function getPersonPatterns() {
  return {
    juliana: JULIANA_PATTERNS,
    gabriel: GABRIEL_PATTERNS,
  }
}
