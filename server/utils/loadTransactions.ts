import type { Transaction, TransactionQueryParams } from '~/types/transaction'
import { getBookSnapshot } from './bookSnapshot'
import { processInstallments } from './installmentProcessor'
import { applyFilters } from './transactionFilters'

/**
 * The single read path for transactions, shared by /api/transactions,
 * /api/categories and the debt/budget endpoints that need spending data.
 *
 * Reads always come from the in-memory Bkper snapshot (see bookSnapshot.ts) —
 * there is no database mirror and no per-screen fetch anymore. The snapshot is
 * the whole book, which is what installment expansion needs: a series' "01/XX"
 * anchor row is always present, so the date window can safely be applied after
 * expansion (filtering first used to silently drop whole series).
 */
export async function loadTransactions(
  query: TransactionQueryParams
): Promise<Transaction[]> {
  const shouldProcessInstallments =
    query.processInstallments !== 'false' && query.processInstallments !== false

  const { transactions } = await getBookSnapshot()

  let result = transactions
  if (shouldProcessInstallments) {
    result = processInstallments(result)
  }

  return applyFilters(result, query)
}
