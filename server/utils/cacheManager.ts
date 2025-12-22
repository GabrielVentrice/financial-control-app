/**
 * Cache Manager - Handles CSV file-based caching for Google Sheets data
 * Supports both Google Drive and local filesystem storage
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import type { Transaction } from '~/types/transaction'
import type { CacheMetadata, CacheStatus } from '~/types/cache'
import {
  uploadFileToDrive,
  downloadFileFromDrive,
  fileExistsInDrive,
  deleteFileFromDrive
} from './googleDrive'

// Cache file paths (local fallback)
const CACHE_DIR = join(process.cwd(), 'server', 'cache')
const CACHE_FILE = join(CACHE_DIR, 'transactions.csv')
const METADATA_FILE = join(CACHE_DIR, 'metadata.json')

// Google Drive file names
const DRIVE_CACHE_FILE = 'transactions.csv'
const DRIVE_METADATA_FILE = 'metadata.json'

// CSV header matching Google Sheets structure
const CSV_HEADER = 'Transaction Id,Date,Origin,Destination,Description,Amount,Recorded at,Remote Id'

/**
 * Ensures cache directory exists
 */
export async function ensureCacheDirectory(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating cache directory:', error)
    throw error
  }
}

/**
 * Converts Transaction array to CSV string
 */
function transactionsToCSV(transactions: Transaction[]): string {
  const rows = transactions.map(t => {
    // Escape CSV values (handle commas and quotes)
    const escape = (value: any): string => {
      const str = String(value || '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    return [
      escape(t.id),
      escape(t.date),
      escape(t.origin),
      escape(t.destination),
      escape(t.description),
      escape(t.amount),
      escape(t.recordedAt),
      escape(t.remoteId)
    ].join(',')
  })

  return [CSV_HEADER, ...rows].join('\n')
}

/**
 * Parses CSV string to Transaction array
 */
function csvToTransactions(csv: string): Transaction[] {
  const lines = csv.trim().split('\n')

  // Skip header
  if (lines.length <= 1) {
    return []
  }

  const transactions: Transaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV line (handle quoted values)
    const values: string[] = []
    let currentValue = ''
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      const nextChar = line[j + 1]

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"'
          j++ // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        // End of value
        values.push(currentValue)
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    // Push last value
    values.push(currentValue)

    // Create transaction object
    if (values.length >= 8) {
      transactions.push({
        id: values[0] || '',
        date: values[1] || '',
        origin: values[2] || '',
        destination: values[3] || '',
        description: values[4] || '',
        amount: parseFloat(values[5]) || 0,
        recordedAt: values[6] || '',
        remoteId: values[7] || '',
        person: '' // Will be enriched by personIdentifier
      })
    }
  }

  return transactions
}

/**
 * Reads transactions from cache file
 * Tries Google Drive first, then falls back to local filesystem
 */
export async function readCache(): Promise<Transaction[]> {
  // Try Google Drive first
  try {
    const config = useRuntimeConfig()
    if (config.googleDriveCacheFolderId) {
      const csv = await downloadFileFromDrive(DRIVE_CACHE_FILE)
      if (csv) {
        console.log('📥 Reading cache from Google Drive')
        return csvToTransactions(csv)
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to read from Google Drive, falling back to local:', error)
  }

  // Fallback to local filesystem
  try {
    console.log('📁 Reading cache from local filesystem')
    const csv = await fs.readFile(CACHE_FILE, 'utf-8')
    return csvToTransactions(csv)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Cache file doesn't exist
      return []
    }
    console.error('Error reading cache file:', error)
    throw error
  }
}

/**
 * Writes transactions to cache file
 * Saves to Google Drive and keeps local backup
 */
export async function writeCache(transactions: Transaction[]): Promise<void> {
  const csv = transactionsToCSV(transactions)

  // Try to save to Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const success = await uploadFileToDrive(DRIVE_CACHE_FILE, csv, 'text/csv')
      if (success) {
        console.log('📤 Cache saved to Google Drive')
      }
    } catch (error) {
      console.warn('⚠️  Failed to save to Google Drive, will save locally only:', error)
    }
  }

  // Always save locally as backup
  try {
    await ensureCacheDirectory()
    await fs.writeFile(CACHE_FILE, csv, 'utf-8')
    console.log('💾 Cache saved to local filesystem')
  } catch (error) {
    console.error('Error writing local cache file:', error)
    throw error
  }
}

/**
 * Reads cache metadata
 * Tries Google Drive first, then falls back to local filesystem
 */
export async function getCacheMetadata(): Promise<CacheMetadata | null> {
  // Try Google Drive first
  try {
    const config = useRuntimeConfig()
    if (config.googleDriveCacheFolderId) {
      const json = await downloadFileFromDrive(DRIVE_METADATA_FILE)
      if (json) {
        return JSON.parse(json) as CacheMetadata
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to read metadata from Google Drive, falling back to local:', error)
  }

  // Fallback to local filesystem
  try {
    const json = await fs.readFile(METADATA_FILE, 'utf-8')
    return JSON.parse(json) as CacheMetadata
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Metadata file doesn't exist
      return null
    }
    console.error('Error reading cache metadata:', error)
    return null
  }
}

/**
 * Updates cache metadata
 * Saves to Google Drive and keeps local backup
 */
export async function updateCacheMetadata(
  transactionCount: number,
  status: CacheStatus,
  spreadsheetId: string,
  ttlMinutes: number
): Promise<CacheMetadata> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)

  const metadata: CacheMetadata = {
    lastUpdate: now.toISOString(),
    status,
    transactionCount,
    expiresAt: expiresAt.toISOString(),
    spreadsheetId,
    version: 1
  }

  const metadataJson = JSON.stringify(metadata, null, 2)

  // Try to save to Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      await uploadFileToDrive(DRIVE_METADATA_FILE, metadataJson, 'application/json')
    } catch (error) {
      console.warn('⚠️  Failed to save metadata to Google Drive:', error)
    }
  }

  // Always save locally as backup
  try {
    await ensureCacheDirectory()
    await fs.writeFile(METADATA_FILE, metadataJson, 'utf-8')
    return metadata
  } catch (error) {
    console.error('Error updating cache metadata:', error)
    throw error
  }
}

/**
 * Checks if cache is valid based on TTL
 */
export async function isCacheValid(): Promise<boolean> {
  const metadata = await getCacheMetadata()

  if (!metadata) {
    return false
  }

  const now = new Date()
  const expiresAt = new Date(metadata.expiresAt)

  return now < expiresAt && metadata.status === 'fresh'
}

/**
 * Checks if cache exists
 * Checks Google Drive first, then local filesystem
 */
export async function cacheExists(): Promise<boolean> {
  // Check Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const exists = await fileExistsInDrive(DRIVE_CACHE_FILE)
      if (exists) {
        return true
      }
    } catch (error) {
      console.warn('⚠️  Failed to check cache in Google Drive:', error)
    }
  }

  // Fallback to local check
  try {
    await fs.access(CACHE_FILE)
    return true
  } catch {
    return false
  }
}

/**
 * Deletes cache files (for testing/debugging)
 * Clears both Google Drive and local filesystem
 */
export async function clearCache(): Promise<void> {
  // Delete from Google Drive
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      await deleteFileFromDrive(DRIVE_CACHE_FILE)
      await deleteFileFromDrive(DRIVE_METADATA_FILE)
    } catch (error) {
      console.warn('⚠️  Failed to delete cache from Google Drive:', error)
    }
  }

  // Delete from local filesystem
  try {
    await fs.unlink(CACHE_FILE).catch(() => {})
    await fs.unlink(METADATA_FILE).catch(() => {})
    console.log('🗑️  Local cache cleared')
  } catch (error) {
    console.error('Error clearing local cache:', error)
  }
}
