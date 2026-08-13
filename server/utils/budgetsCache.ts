import type { Budget } from '~/types/transaction'
import type { BudgetTemplate } from '~/types/budgetTemplate'
import { fetchBudgetsFromGoogleSheets } from './budgetSheets'
import { fetchBudgetTemplatesFromGoogleSheets } from './budgetTemplateSheets'
import { createTtlCache } from './memoCache'

/**
 * Budgets and templates still live in Google Sheets (Bkper has no budget
 * concept), but every read now goes through the same in-instance TTL cache the
 * Bkper book uses — replacing three ~380-line CSV-on-Drive cache managers.
 * Writes invalidate, so the next read pays one Sheets round-trip and the rest
 * are memory.
 */

const ttlMs = () => (useRuntimeConfig().cache?.ttlMinutes || 60) * 60_000

const budgetsCache = createTtlCache<Budget[]>({
  name: 'sheets-budgets',
  ttlMs,
  fetcher: fetchBudgetsFromGoogleSheets,
})

const templatesCache = createTtlCache<BudgetTemplate[]>({
  name: 'sheets-budget-templates',
  ttlMs,
  fetcher: fetchBudgetTemplatesFromGoogleSheets,
})

export function getBudgetsCached(opts: { forceRefresh?: boolean } = {}): Promise<Budget[]> {
  return budgetsCache.get(opts)
}

export function invalidateBudgets(): void {
  budgetsCache.invalidate()
}

export function getBudgetTemplatesCached(
  opts: { forceRefresh?: boolean } = {}
): Promise<BudgetTemplate[]> {
  return templatesCache.get(opts)
}

export function invalidateBudgetTemplates(): void {
  templatesCache.invalidate()
}
