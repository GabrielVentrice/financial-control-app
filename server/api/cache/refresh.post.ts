/**
 * POST /api/cache/refresh
 * Forces cache refresh by fetching fresh data from Google Sheets
 */

import type { CacheRefreshResponse } from '~/types/cache'
import { fetchTransactionsFromGoogleSheets } from '~/server/utils/googleSheets'
import { writeCache, updateCacheMetadata } from '~/server/utils/cacheManager'

export default defineEventHandler(async (event): Promise<CacheRefreshResponse> => {
  const config = useRuntimeConfig(event)
  const cacheConfig = config.cache
  const spreadsheetId = config.public.googleSpreadsheetId

  try {
    console.log('[Cache Refresh] Starting manual cache refresh...')

    // Fetch fresh data from Google Sheets
    const transactions = await fetchTransactionsFromGoogleSheets()

    if (!transactions || transactions.length === 0) {
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
        message: 'Nenhuma transação encontrada no Google Sheets.',
        error: 'No transactions found'
      }
    }

    // Write to cache file
    await writeCache(transactions)

    // Update metadata
    const metadata = await updateCacheMetadata(
      transactions.length,
      'fresh',
      spreadsheetId,
      cacheConfig.ttlMinutes
    )

    console.log(`[Cache Refresh] Successfully cached ${transactions.length} transactions`)

    return {
      success: true,
      metadata,
      transactionCount: transactions.length,
      message: `Cache atualizado com sucesso! ${transactions.length} transações carregadas.`
    }
  } catch (error) {
    console.error('[Cache Refresh] Error refreshing cache:', error)

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
      message: 'Erro ao atualizar cache.',
      error: error instanceof Error ? error.message : String(error)
    }
  }
})
