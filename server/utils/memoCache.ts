/**
 * In-instance TTL cache.
 *
 * This is the cache layer the whole read path sits behind: reading the Bkper
 * book is a ~7s paginated crawl, so serving requests straight from the API is
 * not an option. Values live in module scope — on Vercel's Fluid Compute a warm
 * instance is reused across requests, so in practice the value survives well
 * beyond a single invocation, and a cold start pays the fetch once.
 *
 * Deliberately not Nitro's `cachedFunction`: the UI needs the snapshot's age
 * (the "dados de há X" label) and the "Atualizar" button needs explicit
 * invalidation, neither of which `cachedFunction` exposes.
 */

export interface TtlCacheMeta {
  fetchedAt: number | null
  ageMs: number | null
}

export interface TtlCache<T> {
  get(opts?: { forceRefresh?: boolean }): Promise<T>
  invalidate(): void
  meta(): TtlCacheMeta
}

export function createTtlCache<T>(options: {
  name: string
  /** A function so callers can read runtimeConfig lazily, inside a request. */
  ttlMs: () => number
  fetcher: () => Promise<T>
}): TtlCache<T> {
  let value: T | undefined
  let fetchedAt: number | null = null
  let inflight: Promise<T> | null = null

  const isExpired = () =>
    fetchedAt === null || Date.now() - fetchedAt > options.ttlMs()

  // Concurrent callers share one fetch instead of stampeding the upstream.
  function refresh(allowStaleFallback: boolean): Promise<T> {
    if (!inflight) {
      inflight = options
        .fetcher()
        .then(result => {
          value = result
          fetchedAt = Date.now()
          return result
        })
        .catch(error => {
          // A failed background refresh with an old value on hand serves stale
          // data: numbers from an hour ago beat a 500. An explicit refresh (the
          // "Atualizar" button) propagates instead — reporting success while
          // silently keeping old data would defeat the button's purpose.
          if (allowStaleFallback && value !== undefined) {
            console.error(`[cache:${options.name}] refresh failed, serving stale data`, error)
            return value
          }
          throw error
        })
        .finally(() => {
          inflight = null
        })
    }
    return inflight
  }

  return {
    get(opts = {}) {
      if (opts.forceRefresh || value === undefined || isExpired()) {
        return refresh(!opts.forceRefresh)
      }
      return Promise.resolve(value)
    },

    // Keeps the old value around as the stale fallback; only the freshness goes.
    invalidate() {
      fetchedAt = null
    },

    meta() {
      return {
        fetchedAt,
        ageMs: fetchedAt === null ? null : Date.now() - fetchedAt,
      }
    },
  }
}
