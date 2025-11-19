/**
 * Cache-related type definitions for the Financial Control App
 */

/**
 * Cache status states
 */
export type CacheStatus =
  | 'fresh'    // Cache is valid and within TTL
  | 'stale'    // Cache exists but TTL expired
  | 'error'    // Error reading/writing cache
  | 'missing'  // Cache file doesn't exist

/**
 * Cache metadata stored in metadata.json
 */
export interface CacheMetadata {
  /** Timestamp of last cache update (ISO 8601) */
  lastUpdate: string

  /** Current cache status */
  status: CacheStatus

  /** Number of transactions in cache */
  transactionCount: number

  /** Timestamp when cache will expire (ISO 8601) */
  expiresAt: string

  /** Spreadsheet ID that was cached */
  spreadsheetId: string

  /** Cache format version (for future migrations) */
  version: number
}

/**
 * Cache status response from API
 */
export interface CacheStatusResponse extends CacheMetadata {
  /** Whether cache is currently valid (not stale/missing/error) */
  isValid: boolean

  /** Timestamp for next automatic refresh (if enabled) */
  nextRefresh: string | null

  /** Time until cache expires (in milliseconds) */
  timeUntilExpiry: number | null

  /** Human-readable message about cache status */
  message: string
}

/**
 * Cache refresh response from API
 */
export interface CacheRefreshResponse {
  /** Whether refresh was successful */
  success: boolean

  /** Updated cache metadata */
  metadata: CacheMetadata

  /** Number of transactions fetched */
  transactionCount: number

  /** Human-readable message */
  message: string

  /** Error message if refresh failed */
  error?: string
}

/**
 * Cache configuration from runtime config
 */
export interface CacheConfig {
  /** Whether caching is enabled */
  enabled: boolean

  /** Cache TTL in minutes */
  ttlMinutes: number

  /** Whether automatic refresh is enabled */
  autoRefresh: boolean
}
