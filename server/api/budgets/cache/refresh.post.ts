/**
 * POST /api/budgets/cache/refresh
 * Forces budget cache refresh by fetching fresh data from Google Sheets
 */

import type { CacheRefreshResponse } from '~/types/cache'
import { fetchBudgetsFromGoogleSheets } from '~/server/utils/budgetSheets'
import { writeBudgetCache, updateBudgetCacheMetadata } from '~/server/utils/budgetCacheManager'

export default defineEventHandler(async (event): Promise<CacheRefreshResponse> => {
  const config = useRuntimeConfig(event)
  const cacheConfig = config.cache
  const spreadsheetId = config.public.googleSpreadsheetId

  try {
    console.log('[Budget Cache Refresh] Starting manual budget cache refresh...')

    // Fetch fresh data from Google Sheets
    const budgets = await fetchBudgetsFromGoogleSheets()

    // Write to cache file
    await writeBudgetCache(budgets)

    // Update metadata
    const metadata = await updateBudgetCacheMetadata(
      budgets.length,
      'fresh',
      spreadsheetId,
      cacheConfig.ttlMinutes
    )

    console.log(`[Budget Cache Refresh] Successfully cached ${budgets.length} budgets`)

    return {
      success: true,
      metadata,
      transactionCount: budgets.length,
      message: `Cache de budgets atualizado com sucesso! ${budgets.length} budgets carregados.`
    }
  } catch (error) {
    console.error('[Budget Cache Refresh] Error refreshing budget cache:', error)

    return {
      success: false,
      metadata: {
        lastUpdate: new Date().toISOString(),
        status: 'error',
        transactionCount: 0,
        expiresAt: new Date().toISOString(),
        spreadsheetId,
        version: 1
      },
      transactionCount: 0,
      message: 'Erro ao atualizar cache de budgets.',
      error: error instanceof Error ? error.message : String(error)
    }
  }
})
