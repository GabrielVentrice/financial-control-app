import type { Transaction, InstallmentInfo } from '~/types/transaction'
import { monthKeyOf, addMonthsToKey } from '~/shared/dates'

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

const pad = (n: number) => String(n).padStart(2, '0')

const installmentNumberOf = (transaction: Transaction): number =>
  parseInstallment(transaction.description)?.current ?? 0

/**
 * Builds one row per month for a series: the ledger's own rows where it has
 * them, a projection everywhere else.
 *
 * Two rules do the work, and they pull against each other:
 *
 * - **A month holds at most one installment.** The ledger writes several rows of
 *   a series on a single date (this book has 01/12, 02/12 and 04/12 all on
 *   16/12/2025), and those are one charge written repeatedly, not three charges.
 *   Keeping them all triples that month.
 * - **A row that exists wins over a row we invented.** The schedule used to be
 *   regenerated from the first installment and the real rows thrown away, so a
 *   card purchase that had just synced disappeared from every screen — replaced
 *   by a projected row on day 02, carrying the first installment's amount and an
 *   installment number that had drifted a month ahead of the ledger's.
 *
 * So the real rows claim their months first, and the projection fills the gaps
 * with whatever installment numbers are left over. When the ledger's dates are
 * erratic, a generated number can land a month before a larger real one; the
 * month totals stay right, which is what every screen reads.
 */
function buildSeriesSchedule(
  rows: Transaction[],
  firstInstallment: Transaction,
  installmentInfo: InstallmentInfo
): Transaction[] {
  const { total, description } = installmentInfo

  const byMonth = new Map<string, Transaction>()
  for (const row of rows) {
    const monthKey = monthKeyOf(row.date)
    const held = byMonth.get(monthKey)
    const winsTheMonth =
      !held ||
      (Boolean(held.projected) && !row.projected) ||
      (Boolean(held.projected) === Boolean(row.projected) &&
        installmentNumberOf(row) < installmentNumberOf(held))
    if (winsTheMonth) byMonth.set(monthKey, row)
  }

  const taken = new Set([...byMonth.values()].map(installmentNumberOf))
  const occupiedMonths = new Set(byMonth.keys())

  const generated: Transaction[] = []
  let monthKey = monthKeyOf(firstInstallment.date)

  for (let number = 1; number <= total; number++) {
    if (taken.has(number)) continue

    while (occupiedMonths.has(monthKey)) monthKey = addMonthsToKey(monthKey, 1)
    occupiedMonths.add(monthKey)

    generated.push({
      ...firstInstallment,
      transactionId: `${firstInstallment.transactionId}_${number}_${total}`,
      // Day 02 as a plain string: building it through `new Date` is what used to
      // roll month-boundary rows into the previous month under UTC-3.
      date: `${monthKey}-02`,
      description: `${description} ${pad(number)}/${pad(total)}`,
      amount: firstInstallment.amount,
      // Screens that report what already happened filter these out; without the
      // flag an un-synced month shows spending out of thin air.
      projected: true,
    })

    monthKey = addMonthsToKey(monthKey, 1)
  }

  return [...byMonth.values(), ...generated]
}

/**
 * Expands installment transactions into their full monthly schedule.
 *
 * 1. Non-installment transactions pass through unchanged.
 * 2. Installments are grouped by series (base description + origin + total).
 * 3. For each group with a first installment (01/XX), `buildSeriesSchedule`
 *    lays out one row per month — the ledger's rows where they exist, a
 *    projection for the rest.
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
      processed.push(...buildSeriesSchedule(installments, firstInstallment, installmentInfo))
      processedGroupKeys.add(groupKey)
    } catch (error) {
      console.error('[Installments] Error processing group:', groupKey, error)
      processed.push(...installments)
      processedGroupKeys.add(groupKey)
    }
  }

  return processed
}
