/**
 * GET /api/cache/status
 * Returns current cache status and metadata
 */

import type { CacheStatusResponse, CacheStatus } from '~/types/cache'
import { getCacheMetadata, cacheExists } from '~/server/utils/cacheManager'

export default defineEventHandler(async (event): Promise<CacheStatusResponse> => {
  const config = useRuntimeConfig(event)
  const cacheConfig = config.cache

  // Check if cache exists
  const exists = await cacheExists()

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
      message: 'Cache não existe. Clique em Atualizar para criar o cache.'
    }
  }

  // Get metadata
  const metadata = await getCacheMetadata()

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
      message: 'Erro ao ler metadados do cache.'
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
    message = 'Cache expirado. Será atualizado automaticamente na próxima requisição.'
  } else {
    status = 'fresh'
    isValid = true
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60)
    message = `Cache válido. Expira em ${minutesUntilExpiry} minutos.`
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
