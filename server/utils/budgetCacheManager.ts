/**
 * Budget Cache Manager - Handles CSV file-based caching for Budget data
 * Supports both Google Drive and local filesystem storage
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type { Budget } from '~/types/transaction'
import type { CacheMetadata, CacheStatus } from '~/types/cache'
import {
  uploadFileToDrive,
  downloadFileFromDrive,
  fileExistsInDrive,
  deleteFileFromDrive
} from './googleDrive'

// Cache file paths (local fallback)
const CACHE_DIR = join(process.cwd(), 'server', 'cache')
const BUDGET_CACHE_FILE = join(CACHE_DIR, 'budgets.csv')
const BUDGET_METADATA_FILE = join(CACHE_DIR, 'budgets-metadata.json')

// Google Drive file names
const DRIVE_BUDGET_CACHE_FILE = 'budgets.csv'
const DRIVE_BUDGET_METADATA_FILE = 'budgets-metadata.json'

// CSV header matching Budget structure
const CSV_HEADER = 'ID,Category,Person,Month,Year,Amount,Created At,Updated At'

/**
 * Ensures cache directory exists
 */
export async function ensureBudgetCacheDirectory(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating budget cache directory:', error)
    throw error
  }
}

/**
 * Converts Budget array to CSV string
 */
function budgetsToCSV(budgets: Budget[]): string {
  const rows = budgets.map(b => {
    // Escape CSV values (handle commas and quotes)
    const escape = (value: any): string => {
      const str = String(value || '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    return [
      escape(b.id),
      escape(b.category),
      escape(b.person),
      escape(b.month),
      escape(b.year),
      escape(b.amount),
      escape(b.createdAt),
      escape(b.updatedAt)
    ].join(',')
  })

  return [CSV_HEADER, ...rows].join('\n')
}

/**
 * Parses CSV string to Budget array
 */
function csvToBudgets(csv: string): Budget[] {
  const lines = csv.trim().split('\n')

  // Skip header
  if (lines.length <= 1) {
    return []
  }

  const budgets: Budget[] = []

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

    // Create budget object
    if (values.length >= 8) {
      budgets.push({
        id: values[0] || '',
        category: values[1] || '',
        person: values[2] as 'Juliana' | 'Gabriel',
        month: parseInt(values[3]) || 0,
        year: parseInt(values[4]) || 0,
        amount: parseFloat(values[5]) || 0,
        createdAt: values[6] || '',
        updatedAt: values[7] || ''
      })
    }
  }

  return budgets
}

/**
 * Reads budgets from cache file
 * Tries Google Drive first, then falls back to local filesystem (development only)
 */
export async function readBudgetCache(): Promise<Budget[]> {
  // Try Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const csv = await downloadFileFromDrive(DRIVE_BUDGET_CACHE_FILE)
      if (csv) {
        console.log('📥 Reading budget cache from Google Drive')
        return csvToBudgets(csv)
      }
      // File doesn't exist in Google Drive
      console.log('📭 Budget cache not found in Google Drive')
      return []
    } catch (error) {
      console.warn('⚠️  Failed to read budget cache from Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        return []
      }
    }
  }

  // Fallback to local filesystem (development only)
  try {
    console.log('📁 Reading budget cache from local filesystem')
    const csv = await fs.readFile(BUDGET_CACHE_FILE, 'utf-8')
    return csvToBudgets(csv)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Cache file doesn't exist
      return []
    }
    console.error('Error reading budget cache file:', error)
    throw error
  }
}

/**
 * Writes budgets to cache file
 * Saves to Google Drive when configured, otherwise falls back to local filesystem
 */
export async function writeBudgetCache(budgets: Budget[]): Promise<void> {
  const csv = budgetsToCSV(budgets)

  // Try to save to Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const success = await uploadFileToDrive(DRIVE_BUDGET_CACHE_FILE, csv, 'text/csv')
      if (success) {
        console.log('📤 Budget cache saved to Google Drive')
        return // Success! No need for local backup in production
      }
    } catch (error) {
      console.warn('⚠️  Failed to save budget cache to Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Falling back to local filesystem (development only)')
      } else {
        throw new Error('Failed to save budget cache to Google Drive')
      }
    }
  }

  // Save locally only in development or when Google Drive is not configured
  try {
    await ensureBudgetCacheDirectory()
    await fs.writeFile(BUDGET_CACHE_FILE, csv, 'utf-8')
    console.log('💾 Budget cache saved to local filesystem')
  } catch (error) {
    console.error('Error writing budget cache file:', error)
    throw error
  }
}

/**
 * Reads budget cache metadata
 * Tries Google Drive first, then falls back to local filesystem (development only)
 */
export async function getBudgetCacheMetadata(): Promise<CacheMetadata | null> {
  // Try Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const json = await downloadFileFromDrive(DRIVE_BUDGET_METADATA_FILE)
      if (json) {
        return JSON.parse(json) as CacheMetadata
      }
      // Metadata doesn't exist in Google Drive
      return null
    } catch (error) {
      console.warn('⚠️  Failed to read budget metadata from Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        return null
      }
    }
  }

  // Fallback to local filesystem (development only)
  try {
    const json = await fs.readFile(BUDGET_METADATA_FILE, 'utf-8')
    return JSON.parse(json) as CacheMetadata
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Metadata file doesn't exist
      return null
    }
    console.error('Error reading budget cache metadata:', error)
    return null
  }
}

/**
 * Updates budget cache metadata
 * Saves to Google Drive and keeps local backup
 */
export async function updateBudgetCacheMetadata(
  budgetCount: number,
  status: CacheStatus,
  spreadsheetId: string,
  ttlMinutes: number
): Promise<CacheMetadata> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)

  const metadata: CacheMetadata = {
    lastUpdate: now.toISOString(),
    status,
    transactionCount: budgetCount,
    expiresAt: expiresAt.toISOString(),
    spreadsheetId,
    version: 1
  }

  const metadataJson = JSON.stringify(metadata, null, 2)

  // Try to save to Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const success = await uploadFileToDrive(DRIVE_BUDGET_METADATA_FILE, metadataJson, 'application/json')
      if (success) {
        console.log('📤 Budget metadata saved to Google Drive')
        return metadata // Success! No need for local backup in production
      }
    } catch (error) {
      console.warn('⚠️  Failed to save budget metadata to Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Failed to save budget metadata to Google Drive')
      }
    }
  }

  // Save locally only in development or when Google Drive is not configured
  try {
    await ensureBudgetCacheDirectory()
    await fs.writeFile(BUDGET_METADATA_FILE, metadataJson, 'utf-8')
    return metadata
  } catch (error) {
    console.error('Error updating budget cache metadata:', error)
    throw error
  }
}

/**
 * Checks if budget cache is valid based on TTL
 */
export async function isBudgetCacheValid(): Promise<boolean> {
  const metadata = await getBudgetCacheMetadata()

  if (!metadata) {
    return false
  }

  const now = new Date()
  const expiresAt = new Date(metadata.expiresAt)

  return now < expiresAt && metadata.status === 'fresh'
}

/**
 * Checks if budget cache exists
 * Checks Google Drive first, then local filesystem (development only)
 */
export async function budgetCacheExists(): Promise<boolean> {
  // Check Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const exists = await fileExistsInDrive(DRIVE_BUDGET_CACHE_FILE)
      return exists
    } catch (error) {
      console.warn('⚠️  Failed to check budget cache in Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        return false
      }
    }
  }

  // Fallback to local check (development only)
  try {
    await fs.access(BUDGET_CACHE_FILE)
    return true
  } catch {
    return false
  }
}

/**
 * Deletes budget cache files (for testing/debugging)
 * Clears Google Drive and local filesystem (development only)
 */
export async function clearBudgetCache(): Promise<void> {
  // Delete from Google Drive
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      await deleteFileFromDrive(DRIVE_BUDGET_CACHE_FILE)
      await deleteFileFromDrive(DRIVE_BUDGET_METADATA_FILE)
      console.log('🗑️  Budget cache cleared from Google Drive')
    } catch (error) {
      console.warn('⚠️  Failed to delete budget cache from Google Drive:', error)
    }
  }

  // Delete from local filesystem (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      await fs.unlink(BUDGET_CACHE_FILE).catch(() => {})
      await fs.unlink(BUDGET_METADATA_FILE).catch(() => {})
      console.log('🗑️  Local budget cache cleared')
    } catch (error) {
      console.error('Error clearing local budget cache:', error)
    }
  }
}
