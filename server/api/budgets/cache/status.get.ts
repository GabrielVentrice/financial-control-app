/**
 * GET /api/budgets/cache/status
 * Returns current budget cache status and metadata
 */

import type { CacheStatusResponse, CacheStatus } from '~/types/cache'
import { getBudgetCacheMetadata, budgetCacheExists } from '~/server/utils/budgetCacheManager'

export default defineEventHandler(async (event): Promise<CacheStatusResponse> => {
  const config = useRuntimeConfig(event)
  const cacheConfig = config.cache

  // Check if cache exists
  const exists = await budgetCacheExists()

  if (!exists) {
    return {
      lastUpdate: new Date().toISOString(),
      status: 'missing' as CacheStatus,
      transactionCount: 0,
      expiresAt: new Date().toISOString(),
      spreadsheetId: config.public.googleSpreadsheetId,
      version: 1,
      isValid: false,
      nextRefresh: null,
      timeUntilExpiry: null,
      message: 'Cache de budgets não existe. Clique em Atualizar para criar o cache.'
    }
  }

  // Get metadata
  const metadata = await getBudgetCacheMetadata()

  if (!metadata) {
    return {
      lastUpdate: new Date().toISOString(),
      status: 'error' as CacheStatus,
      transactionCount: 0,
      expiresAt: new Date().toISOString(),
      spreadsheetId: config.public.googleSpreadsheetId,
      version: 1,
      isValid: false,
      nextRefresh: null,
      timeUntilExpiry: null,
      message: 'Erro ao ler metadados do cache de budgets.'
    }
  }

  // Calculate time until expiry
  const now = new Date()
  const expiresAt = new Date(metadata.expiresAt)
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  const isExpired = timeUntilExpiry <= 0

  // Determine status
  let status: CacheStatus = metadata.status
  let message = ''
  let isValid = true

  if (isExpired) {
    status = 'stale'
    isValid = false
    message = 'Cache de budgets expirado. Será atualizado automaticamente na próxima requisição.'
  } else {
    status = 'fresh'
    isValid = true
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60)
    message = `Cache de budgets válido. Expira em ${minutesUntilExpiry} minutos.`
  }

  // Calculate next refresh (if auto-refresh is enabled)
  let nextRefresh: string | null = null
  if (cacheConfig.autoRefresh && isExpired) {
    nextRefresh = new Date().toISOString() // Will refresh on next request
  }

  return {
    ...metadata,
    status,
    isValid,
    nextRefresh,
    timeUntilExpiry: isExpired ? 0 : timeUntilExpiry,
    message
  }
})
