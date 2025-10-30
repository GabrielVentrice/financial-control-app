import type { Transaction, InstallmentInfo } from '~/types/transaction'

/**
 * Parses transaction description to extract installment information
 * Expected format: "Description X/Y" or "Description X/Y other words"
 * Examples: "Netflix 01/12", "Purchase 03/10 - Item"
 */
export function parseInstallment(description: string): InstallmentInfo | null {
  // Regex to capture pattern "X/Y" anywhere in description
  const regex = /(\d{2})\/(\d{2})/
  const match = description.match(regex)

  if (!match) {
    return null
  }

  const current = parseInt(match[1])
  const total = parseInt(match[2])

  // Extract base description (text before the X/Y pattern)
  const descriptionBase = description.substring(0, match.index).trim()

  return {
    description: descriptionBase,
    current,
    total,
  }
}

/**
 * Checks if transaction is an installment/financing type
 * Filters only by category "Installments/Financing"
 */
export function isInstallmentTransaction(transaction: Transaction): boolean {
  const destination = transaction.destination?.toLowerCase() || ''
  return destination.includes('installments/financing') ||
         (destination.includes('installments') && destination.includes('financing'))
}

/**
 * Checks if transaction is the first installment (01/XX)
 */
export function isFirstInstallment(transaction: Transaction): boolean {
  const installmentInfo = parseInstallment(transaction.description)
  return installmentInfo !== null && installmentInfo.current === 1
}

/**
 * Creates unique key to group related installments
 * Based on base description + origin
 */
export function createInstallmentGroupKey(
  transaction: Transaction,
  installmentInfo: InstallmentInfo
): string {
  return `${installmentInfo.description.toLowerCase()}_${transaction.origin}`
}

/**
 * Generates all monthly installments from the first installment
 * Base date: day of first installment, subsequent installments on day 01 of each month
 */
export function generateMonthlyInstallments(
  firstInstallment: Transaction,
  installmentInfo: InstallmentInfo
): Transaction[] {
  const { total, description } = installmentInfo
  const transactions: Transaction[] = []

  // Date of first installment (keeps original day)
  const firstDate = new Date(firstInstallment.date)

  // Second installment onwards: day 01 of next month
  let nextMonth = new Date(firstDate)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(2)

  // Generate all installments from 01/XX to XX/XX
  for (let i = 1; i <= total; i++) {
    let installmentDate: Date

    if (i === 1) {
      // First installment: keep original date
      installmentDate = new Date(firstDate)
    } else {
      // Other installments: day 01 of month
      installmentDate = new Date(nextMonth)
      installmentDate.setMonth(nextMonth.getMonth() + (i - 2))
    }

    const dateISO = installmentDate.toISOString().split('T')[0]

    transactions.push({
      ...firstInstallment,
      transactionId: `${firstInstallment.transactionId}_${i}_${total}`,
      date: dateISO,
      description: `${description} ${String(i).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
      amount: firstInstallment.amount,
    })
  }

  return transactions
}

/**
 * Processes all installment/financing transactions
 *
 * FLOW:
 * 1. Filter transactions with destination = "Installments/Financing"
 * 2. Identify first installments (01/XX)
 * 3. Group related installments by base description + origin
 * 4. Remove duplicate installments from same group
 * 5. Generate new transactions with correct dates (day 01 of each month)
 *
 * @param transactions - Original transaction list
 * @returns Processed transaction list
 */
export function processInstallments(transactions: Transaction[]): Transaction[] {
  const processed: Transaction[] = []
  const installmentGroups = new Map<string, Transaction[]>()
  const processedGroupKeys = new Set<string>()

  // Debug logs
  console.log('[Installments] Total transactions received:', transactions.length)
  const installmentTransactions = transactions.filter(t => isInstallmentTransaction(t))
  console.log('[Installments] Installment/financing transactions:', installmentTransactions.length)

  // STEP 1 & 2: Separate transactions and identify installments
  for (const transaction of transactions) {
    // If not installment/financing, add directly
    if (!isInstallmentTransaction(transaction)) {
      processed.push(transaction)
      continue
    }

    // Try to parse installment information
    const installmentInfo = parseInstallment(transaction.description)

    if (!installmentInfo) {
      // Couldn't parse X/Y pattern, add normally
      processed.push(transaction)
      continue
    }

    // STEP 3: Create group key (description + origin)
    const groupKey = createInstallmentGroupKey(transaction, installmentInfo)

    // Add to group
    if (!installmentGroups.has(groupKey)) {
      installmentGroups.set(groupKey, [])
    }
    installmentGroups.get(groupKey)!.push(transaction)
  }

  console.log('[Installments] Number of groups identified:', installmentGroups.size)

  // STEP 4 & 5: Process each installment group
  for (const [groupKey, installments] of installmentGroups) {
    if (processedGroupKeys.has(groupKey)) continue

    try {
      // Find first installment (01/XX)
      const firstInstallment = installments.find(t => isFirstInstallment(t))

      if (!firstInstallment) {
        // If first installment not found, add all original installments
        processed.push(...installments)
        processedGroupKeys.add(groupKey)
        continue
      }

      const installmentInfo = parseInstallment(firstInstallment.description)!

      // Generate all installments with correct dates
      const generatedInstallments = generateMonthlyInstallments(
        firstInstallment,
        installmentInfo
      )

      processed.push(...generatedInstallments)
      processedGroupKeys.add(groupKey)
    } catch (error) {
      // In case of error, add original transactions
      console.error('[Installments] Error processing group:', groupKey, error)
      processed.push(...installments)
      processedGroupKeys.add(groupKey)
    }
  }

  console.log('[Installments] Processed transactions:', processed.length)
  return processed
}
