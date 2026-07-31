export interface SyncStatus {
  configured: boolean
  lastSyncAt: string | null
  status: 'success' | 'error' | null
  transactionCount: number
  errorMessage?: string | null
}

/**
 * Sheets → Postgres sync, from the UI.
 *
 * The app reads from Postgres, which mirrors the sheet and only catches up on
 * the daily cron. `POST /api/sync` is what actually pulls fresh rows in — the
 * old "Atualizar" button hit `/api/cache/refresh`, which rewrites an on-disk CSV
 * cache that nothing reads when DATABASE_URL is set (and which fails outright on
 * a read-only serverless filesystem). It looked like a refresh and did nothing.
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
   * Pulls the sheet into Postgres, then invalidates every cached payload so the
   * pages re-read the fresh rows.
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

  /** False when DATABASE_URL is absent: there is no Postgres to sync into. */
  const isConfigured = computed(() => status.value?.configured !== false)

  /** Stale after 48h — the cron is daily, so a two-day gap means it isn't running. */
  const isStale = computed(() => {
    const iso = status.value?.lastSyncAt
    if (!iso) return false
    return Date.now() - new Date(iso).getTime() > 48 * 60 * 60 * 1000
  })

  return {
    syncing: readonly(syncing),
    syncError,
    status,
    lastSyncLabel,
    isStale,
    isConfigured,
    syncNow,
    refreshStatus,
  }
}
