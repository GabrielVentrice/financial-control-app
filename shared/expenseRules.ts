import type { Transaction } from '~/types/transaction'

/**
 * Single source of truth for "what counts as money going out".
 *
 * This used to live in four places that had drifted apart — the dashboard, the
 * categories page, the categories endpoint and the fixed-costs page each had
 * their own exclusion list, so the same month produced different totals
 * depending on which screen you were looking at. Everything now goes through
 * here; if a rule needs to change, it changes once.
 *
 * Framework-agnostic (no Vue/Nitro) so both sides can import it.
 */

/** Ledger accounts and cards. A destination here means money moved, not was spent. */
const ACCOUNT_MARKERS = ['bank account', 'credit card', 'credit account']

/** Bookkeeping categories that are not real spending. */
const EXCLUDED_CATEGORIES = ['adjustment']

/** Bookkeeping rows that duplicate a real transaction. */
const EXCLUDED_DESCRIPTIONS = ['pagamento debito automatico']

const norm = (value: string | null | undefined): string => (value || '').trim().toLowerCase()

/** True when the field names one of your own accounts/cards rather than a category. */
export function isAccountOrCard(value: string | null | undefined): boolean {
  const v = norm(value)
  return ACCOUNT_MARKERS.some(marker => v.includes(marker))
}

/** Money landing in one of your accounts. */
export function isIncome(t: Transaction): boolean {
  return norm(t.destination).includes('bank account')
}

/**
 * Money leaving one of your accounts or cards.
 *
 * `origin` is not always an account: the sheet also uses it for a handful of
 * category-shaped values ("Installments/Financing", "Salary Gabriel"). Rows
 * whose destination is a real spending category are outflows too, otherwise
 * ~20 financed purchases never counted as spending anywhere in the app.
 */
export function isExpense(t: Transaction): boolean {
  if (isAccountOrCard(t.origin)) return true
  return Boolean(norm(t.origin)) && !isIncome(t) && !isTransfer(t)
}

/** Destination is an account/card: a card payment or a transfer between accounts. */
export function isTransfer(t: Transaction): boolean {
  return isAccountOrCard(t.destination)
}

/** `Adjustment` shows up on both sides of the ledger; neither side is spending. */
export function isExcludedCategory(t: Transaction): boolean {
  return EXCLUDED_CATEGORIES.includes(norm(t.destination)) ||
         EXCLUDED_CATEGORIES.includes(norm(t.origin))
}

export function isExcludedDescription(t: Transaction): boolean {
  return EXCLUDED_DESCRIPTIONS.includes(norm(t.description))
}

/**
 * Real spending: money left an account or card, the destination is an actual
 * spending category (not a transfer), and it isn't a bookkeeping row.
 */
export function isRealExpense(t: Transaction): boolean {
  return (
    isExpense(t) &&
    !isTransfer(t) &&
    !isExcludedCategory(t) &&
    !isExcludedDescription(t)
  )
}

/** A destination that belongs on a "spending by category" breakdown. */
export function isSpendingCategory(destination: string | null | undefined): boolean {
  return !isAccountOrCard(destination) && !EXCLUDED_CATEGORIES.includes(norm(destination))
}

/** Display name for a category, with a single spelling of the empty case. */
export const UNCATEGORIZED = 'Sem categoria'

export function categoryNameOf(t: Transaction): string {
  return (t.destination || '').trim() || UNCATEGORIZED
}

/** Amounts are stored unsigned; treat refunds defensively all the same. */
export function expenseAmount(t: Transaction): number {
  return Math.abs(t.amount)
}
