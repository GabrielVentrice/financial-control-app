/**
 * Which categories count as fixed / committed spending.
 *
 * One list for both sides: /api/categories bucketed on `Cleaning Services`
 * while the fixed-costs page had its own copy without it, so the two screens
 * disagreed about what "fixed" meant. Matching is case-insensitive substring,
 * as everywhere else in the app.
 *
 * Framework-agnostic (no Vue/Nitro) so both sides can import it.
 */

/** Same value every month. */
export const CUSTOS_FIXOS_CATEGORIES = [
  'Rent',
  'Subscriptions/Softwares',
  'Insurance',
  'Utilities',
  'Business & Taxes',
  'Medical',
  'Cleaning Services',
]

/** Recurring, but the amount varies (installments, financing, investments). */
export const GASTOS_COMPROMETIDOS_CATEGORIES = [
  ...CUSTOS_FIXOS_CATEGORIES,
  'Installments/Financing',
  'Financing',
  'Investments',
]

const matches = (categoryName: string, list: string[]): boolean => {
  const lower = (categoryName || '').toLowerCase()
  return list.some(entry => lower.includes(entry.toLowerCase()))
}

export function isCustoFixoCategory(categoryName: string): boolean {
  return matches(categoryName, CUSTOS_FIXOS_CATEGORIES)
}

export function isGastoComprometidoCategory(categoryName: string): boolean {
  return matches(categoryName, GASTOS_COMPROMETIDOS_CATEGORIES)
}
