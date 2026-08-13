import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTtlCache } from '../server/utils/memoCache'

describe('createTtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const TTL = 60_000

  function makeCache(fetcher: () => Promise<string>) {
    return createTtlCache<string>({ name: 'test', ttlMs: () => TTL, fetcher })
  }

  it('fetches once and serves from memory within the TTL', async () => {
    const fetcher = vi.fn().mockResolvedValue('book-v1')
    const cache = makeCache(fetcher)

    expect(await cache.get()).toBe('book-v1')
    vi.advanceTimersByTime(TTL - 1)
    expect(await cache.get()).toBe('book-v1')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('refetches after the TTL expires', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('book-v1')
      .mockResolvedValueOnce('book-v2')
    const cache = makeCache(fetcher)

    await cache.get()
    vi.advanceTimersByTime(TTL + 1)
    expect(await cache.get()).toBe('book-v2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent fetches into one upstream call', async () => {
    let resolveFetch!: (value: string) => void
    const fetcher = vi.fn(() => new Promise<string>(resolve => { resolveFetch = resolve }))
    const cache = makeCache(fetcher)

    const first = cache.get()
    const second = cache.get()
    resolveFetch('book-v1')

    expect(await first).toBe('book-v1')
    expect(await second).toBe('book-v1')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('invalidate() expires the value but keeps it as stale fallback', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('book-v1')
      .mockResolvedValueOnce('book-v2')
    const cache = makeCache(fetcher)

    await cache.get()
    cache.invalidate()
    expect(cache.meta().fetchedAt).toBeNull()

    expect(await cache.get()).toBe('book-v2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('serves stale data when a background refresh fails', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('book-v1')
      .mockRejectedValueOnce(new Error('bkper down'))
    const cache = makeCache(fetcher)

    await cache.get()
    vi.advanceTimersByTime(TTL + 1)

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await cache.get()).toBe('book-v1')
    consoleError.mockRestore()
  })

  it('propagates the error on an explicit forceRefresh', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('book-v1')
      .mockRejectedValueOnce(new Error('bkper down'))
    const cache = makeCache(fetcher)

    await cache.get()
    await expect(cache.get({ forceRefresh: true })).rejects.toThrow('bkper down')
  })

  it('propagates the error when there is no previous value to fall back on', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('bkper down'))
    const cache = makeCache(fetcher)

    await expect(cache.get()).rejects.toThrow('bkper down')
  })

  it('reports the snapshot age through meta()', async () => {
    const cache = makeCache(vi.fn().mockResolvedValue('book-v1'))

    expect(cache.meta()).toEqual({ fetchedAt: null, ageMs: null })
    await cache.get()
    vi.advanceTimersByTime(5_000)
    expect(cache.meta().ageMs).toBe(5_000)
  })
})
