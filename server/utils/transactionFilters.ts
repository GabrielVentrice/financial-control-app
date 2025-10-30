import type { Transaction, TransactionQueryParams } from '~/types/transaction'

/**
 * Filters transactions by person (Juliana/Gabriel/Ambos)
 * Requires transactions to have 'person' field populated
 */
export function filterByPerson(
  transactions: Transaction[],
  person?: 'Juliana' | 'Gabriel' | 'Ambos'
): Transaction[] {
  if (!person || person === 'Ambos') {
    return transactions
  }

  return transactions.filter(transaction => transaction.person === person)
}

/**
 * Filters transactions by date range
 * Both startDate and endDate are inclusive
 */
export function filterByDateRange(
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): Transaction[] {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)

    if (startDate) {
      const start = new Date(startDate)
      if (transactionDate < start) return false
    }

    if (endDate) {
      const end = new Date(endDate)
      if (transactionDate > end) return false
    }

    return true
  })
}

/**
 * Filters transactions by description search term
 * Case-insensitive substring matching
 */
export function filterBySearchTerm(
  transactions: Transaction[],
  searchTerm?: string
): Transaction[] {
  if (!searchTerm) {
    return transactions
  }

  const searchLower = searchTerm.toLowerCase()
  return transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchLower)
  )
}

/**
 * Filters transactions by origin
 * Case-insensitive substring matching
 */
export function filterByOrigin(
  transactions: Transaction[],
  origin?: string
): Transaction[] {
  if (!origin) {
    return transactions
  }

  const originLower = origin.toLowerCase()
  return transactions.filter(transaction =>
    transaction.origin.toLowerCase().includes(originLower)
  )
}

/**
 * Filters transactions by destination (category)
 * Case-insensitive substring matching
 */
export function filterByDestination(
  transactions: Transaction[],
  destination?: string
): Transaction[] {
  if (!destination) {
    return transactions
  }

  const destinationLower = destination.toLowerCase()
  return transactions.filter(transaction =>
    transaction.destination.toLowerCase().includes(destinationLower)
  )
}

/**
 * Applies all filters from query parameters
 * This is the main filtering orchestrator
 */
export function applyFilters(
  transactions: Transaction[],
  params: TransactionQueryParams
): Transaction[] {
  let filtered = transactions

  // Apply person filter
  filtered = filterByPerson(filtered, params.person)

  // Apply date range filter
  filtered = filterByDateRange(filtered, params.startDate, params.endDate)

  // Apply search term filter
  filtered = filterBySearchTerm(filtered, params.searchTerm)

  // Apply origin filter
  filtered = filterByOrigin(filtered, params.origin)

  // Apply destination filter
  filtered = filterByDestination(filtered, params.destination)

  return filtered
}

/**
 * Validates query parameters
 * Ensures dates are in correct format and other params are valid
 */
export function validateQueryParams(params: TransactionQueryParams): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate person filter
  if (params.person && !['Juliana', 'Gabriel', 'Ambos'].includes(params.person)) {
    errors.push(`Invalid person filter: ${params.person}. Must be one of: Juliana, Gabriel, Ambos`)
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  if (params.startDate && !dateRegex.test(params.startDate)) {
    errors.push(`Invalid startDate format: ${params.startDate}. Expected YYYY-MM-DD`)
  }

  if (params.endDate && !dateRegex.test(params.endDate)) {
    errors.push(`Invalid endDate format: ${params.endDate}. Expected YYYY-MM-DD`)
  }

  // Validate date range logic
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate)
    const end = new Date(params.endDate)
    if (start > end) {
      errors.push('startDate must be before or equal to endDate')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
