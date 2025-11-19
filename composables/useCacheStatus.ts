/**
 * Composable for managing cache status and metadata
 */

import type { CacheStatusResponse } from '~/types/cache'

export const useCacheStatus = () => {
  // Cache status state
  const cacheStatus = useState<CacheStatusResponse | null>('cacheStatus', () => null)
  const loading = useState<boolean>('cacheStatusLoading', () => false)
  const error = useState<string>('cacheStatusError', () => '')

  /**
   * Fetches current cache status from API
   */
  const fetchCacheStatus = async () => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch<CacheStatusResponse>('/api/cache/status')
      cacheStatus.value = response
    } catch (e: any) {
      console.error('Error fetching cache status:', e)
      error.value = e.message || 'Erro ao buscar status do cache'
      cacheStatus.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Returns formatted time ago string (e.g., "há 15 minutos")
   */
  const getTimeAgo = computed(() => {
    if (!cacheStatus.value?.lastUpdate) return ''

    const lastUpdate = new Date(cacheStatus.value.lastUpdate)
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()

    const diffMinutes = Math.floor(diffMs / 1000 / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'agora mesmo'
    if (diffMinutes === 1) return 'há 1 minuto'
    if (diffMinutes < 60) return `há ${diffMinutes} minutos`
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`
    if (diffDays === 1) return 'há 1 dia'
    return `há ${diffDays} dias`
  })

  /**
   * Returns time until cache expires (e.g., "em 45 minutos")
   */
  const getTimeUntilExpiry = computed(() => {
    if (!cacheStatus.value?.timeUntilExpiry) return ''

    const timeMs = cacheStatus.value.timeUntilExpiry

    if (timeMs <= 0) return 'expirado'

    const minutes = Math.floor(timeMs / 1000 / 60)
    const hours = Math.floor(minutes / 60)

    if (minutes < 1) return 'menos de 1 minuto'
    if (minutes === 1) return 'em 1 minuto'
    if (minutes < 60) return `em ${minutes} minutos`
    if (hours === 1) return 'em 1 hora'
    return `em ${hours} horas`
  })

  /**
   * Returns status icon/emoji
   */
  const getStatusIcon = computed(() => {
    if (!cacheStatus.value) return '⚪'

    switch (cacheStatus.value.status) {
      case 'fresh':
        return '🟢'
      case 'stale':
        return '🟡'
      case 'error':
        return '🔴'
      case 'missing':
        return '⚪'
      default:
        return '⚪'
    }
  })

  /**
   * Returns status color class for Tailwind
   */
  const getStatusColor = computed(() => {
    if (!cacheStatus.value) return 'gray'

    switch (cacheStatus.value.status) {
      case 'fresh':
        return 'green'
      case 'stale':
        return 'yellow'
      case 'error':
        return 'red'
      case 'missing':
        return 'gray'
      default:
        return 'gray'
    }
  })

  /**
   * Returns formatted last update date
   */
  const getFormattedLastUpdate = computed(() => {
    if (!cacheStatus.value?.lastUpdate) return ''

    const date = new Date(cacheStatus.value.lastUpdate)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })

  return {
    // State
    cacheStatus,
    loading,
    error,

    // Actions
    fetchCacheStatus,

    // Computed
    getTimeAgo,
    getTimeUntilExpiry,
    getStatusIcon,
    getStatusColor,
    getFormattedLastUpdate
  }
}
