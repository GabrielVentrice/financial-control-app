export interface SyncStatus {
  lastSyncAt: string | null
  status: 'success' | 'error' | null
  transactionCount: number
}

/**
 * Freshness of the server's in-memory Bkper snapshot, from the UI.
 *
 * `GET /api/sync` reports when the instance last read the book; `POST` forces
 * a fresh read (and invalidates the budget caches), then refreshNuxtData()
 * makes every screen re-fetch the new numbers. The route name survives from
 * the Postgres-mirror era — the semantics are now purely cache freshness.
 */
export const useSync = () => {
  const syncing = useState<boolean>('sync-running', () => false)
  const syncError = useState<string | null>('sync-error', () => null)

  // Fetched through useAsyncData so the freshness label is server-rendered.
  // On mount-only fetching, the staleness warning would appear after a
  // hydration flash — exactly when the user most needs to see it up front.
  const { data: status, refresh: refreshStatus } = useAsyncData<SyncStatus>(
    'sync-status',
    () => $fetch<SyncStatus>('/api/sync'),
    {
      default: () => null as unknown as SyncStatus,
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
    }
  )

  /**
   * Forces a fresh read of the book, then invalidates every cached payload so
   * the pages re-read the fresh rows.
   */
  const syncNow = async (): Promise<boolean> => {
    syncing.value = true
    syncError.value = null

    try {
      await $fetch('/api/sync', { method: 'POST' })
      await refreshNuxtData()
      return true
    } catch (e: any) {
      syncError.value = e?.data?.data || e?.statusMessage || e?.message || 'Falha ao sincronizar'
      return false
    } finally {
      syncing.value = false
    }
  }

  /** "há 3 dias" / "há 2 h" / "agora" — null when we have no sync on record. */
  const lastSyncLabel = computed(() => {
    const iso = status.value?.lastSyncAt
    if (!iso) return null

    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (minutes < 2) return 'agora'
    if (minutes < 60) return `há ${minutes} min`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `há ${hours} h`

    const days = Math.floor(hours / 24)
    return days === 1 ? 'há 1 dia' : `há ${days} dias`
  })

  /**
   * The snapshot refreshes itself on a 60min TTL, so anything much older than
   * that means refreshes are failing (Bkper down, refresh token revoked) and
   * the instance is serving its stale fallback.
   */
  const isStale = computed(() => {
    const iso = status.value?.lastSyncAt
    if (!iso) return false
    return Date.now() - new Date(iso).getTime() > 2 * 60 * 60 * 1000
  })

  return {
    syncing: readonly(syncing),
    syncError,
    status,
    lastSyncLabel,
    isStale,
    syncNow,
    refreshStatus,
  }
}
