import type { Transaction, InstallmentInfo } from '~/types/transaction'

/**
 * Shared installment logic used by BOTH the server pipeline
 * (server/utils/installmentProcessor.ts → /api/transactions, /api/categories)
 * and the client composable (composables/useInstallments.ts → installments &
 * fixed-costs pages). Keep this module pure (no Vue/Nuxt/Nitro APIs) so it can
 * be bundled into either context.
 */

// Matches an "NN/NN" installment marker anywhere in the description.
const INSTALLMENT_REGEX = /(\d{2})\/(\d{2})/

/**
 * Parses the installment marker from a description.
 * Returns null when the "NN/NN" is not a real installment series, which guards
 * against false positives like dates ("13/01" → total 1) or anchor rows
 * ("ORTOBOM 00/21" → current 0).
 *
 * Valid series: total > 1, 1 <= current <= total, total <= 99.
 */
export function parseInstallment(description: string): InstallmentInfo | null {
  const match = (description || '').match(INSTALLMENT_REGEX)
  if (!match) return null

  const current = parseInt(match[1], 10)
  const total = parseInt(match[2], 10)

  // Reject patterns that are not a plausible installment series
  if (total <= 1 || total > 99 || current < 1 || current > total) {
    return null
  }

  const descriptionBase = description.substring(0, match.index).trim()

  return { description: descriptionBase, current, total }
}

/**
 * A transaction is an installment when it carries a valid "NN/NN" marker AND is
 * either a credit-card purchase (origin) or in the legacy "Installments/Financing"
 * category. This is the fix for the root cause: previously only the
 * "Installments/Financing" category was recognized, so installments on the card
 * with an empty/other category were never projected across months.
 */
export function isInstallmentTransaction(transaction: Transaction): boolean {
  const destination = (transaction.destination || '').toLowerCase()
  const origin = (transaction.origin || '').toLowerCase()

  const isFinancingCategory =
    destination.includes('installments/financing') ||
    (destination.includes('installments') && destination.includes('financing'))
  const isCardPurchase = origin.includes('credit card')

  if (!isFinancingCategory && !isCardPurchase) return false

  return parseInstallment(transaction.description) !== null
}

/**
 * Checks whether the transaction is the first installment (01/XX).
 */
export function isFirstInstallment(transaction: Transaction): boolean {
  const installmentInfo = parseInstallment(transaction.description)
  return installmentInfo !== null && installmentInfo.current === 1
}

/**
 * Builds the key that groups rows of the same installment series.
 * Uses base description + origin + total count. The amount is intentionally
 * NOT part of the key: rows of the same series can differ by cents
 * (e.g. 210,57 vs 210,48), which would otherwise split the series.
 */
export function createInstallmentGroupKey(
  transaction: Transaction,
  installmentInfo: InstallmentInfo
): string {
  return `${installmentInfo.description.toLowerCase()}_${transaction.origin}_${installmentInfo.total}`
}

/**
 * Generates the full monthly schedule from the first installment.
 * Installment #1 keeps its original date; #2..N land on day 02 of each
 * subsequent month. Each generated row keeps the original category (destination),
 * origin and amount via the spread.
 */
export function generateMonthlyInstallments(
  firstInstallment: Transaction,
  installmentInfo: InstallmentInfo
): Transaction[] {
  const { total, description } = installmentInfo
  const transactions: Transaction[] = []

  const firstDate = new Date(firstInstallment.date)

  // Second installment onwards: day 02 of the following months
  const nextMonth = new Date(firstDate)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(2)

  for (let i = 1; i <= total; i++) {
    let installmentDate: Date

    if (i === 1) {
      installmentDate = new Date(firstDate)
    } else {
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
 * Expands installment transactions into their full monthly schedule.
 *
 * 1. Non-installment transactions pass through unchanged.
 * 2. Installments are grouped by series (base description + origin + total).
 * 3. For each group, the first installment (01/XX) is found and the full
 *    schedule is regenerated, discarding the original rows. This is what
 *    prevents double counting when the sheet already contains later rows
 *    (e.g. 01/10 and 02/10 both present).
 * 4. If no 01/XX is present (purchase predates the data window), the existing
 *    rows are kept as-is.
 */
export function processInstallments(transactions: Transaction[]): Transaction[] {
  const processed: Transaction[] = []
  const installmentGroups = new Map<string, Transaction[]>()
  const processedGroupKeys = new Set<string>()

  // STEP 1 & 2: separate plain transactions from installment series
  for (const transaction of transactions) {
    if (!isInstallmentTransaction(transaction)) {
      processed.push(transaction)
      continue
    }

    const installmentInfo = parseInstallment(transaction.description)
    if (!installmentInfo) {
      processed.push(transaction)
      continue
    }

    const groupKey = createInstallmentGroupKey(transaction, installmentInfo)
    if (!installmentGroups.has(groupKey)) {
      installmentGroups.set(groupKey, [])
    }
    installmentGroups.get(groupKey)!.push(transaction)
  }

  // STEP 3 & 4: regenerate each series from its first installment
  for (const [groupKey, installments] of installmentGroups) {
    if (processedGroupKeys.has(groupKey)) continue

    try {
      const firstInstallment = installments.find(t => isFirstInstallment(t))

      if (!firstInstallment) {
        processed.push(...installments)
        processedGroupKeys.add(groupKey)
        continue
      }

      const installmentInfo = parseInstallment(firstInstallment.description)!
      const generatedInstallments = generateMonthlyInstallments(firstInstallment, installmentInfo)

      processed.push(...generatedInstallments)
      processedGroupKeys.add(groupKey)
    } catch (error) {
      console.error('[Installments] Error processing group:', groupKey, error)
      processed.push(...installments)
      processedGroupKeys.add(groupKey)
    }
  }

  return processed
}
