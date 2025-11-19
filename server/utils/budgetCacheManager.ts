/**
 * Budget Cache Manager - Handles CSV file-based caching for Budget data
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type { Budget } from '~/types/transaction'
import type { CacheMetadata, CacheStatus } from '~/types/cache'

// Cache file paths
const CACHE_DIR = join(process.cwd(), 'server', 'cache')
const BUDGET_CACHE_FILE = join(CACHE_DIR, 'budgets.csv')
const BUDGET_METADATA_FILE = join(CACHE_DIR, 'budgets-metadata.json')

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
 */
export async function readBudgetCache(): Promise<Budget[]> {
  try {
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
 */
export async function writeBudgetCache(budgets: Budget[]): Promise<void> {
  try {
    await ensureBudgetCacheDirectory()
    const csv = budgetsToCSV(budgets)
    await fs.writeFile(BUDGET_CACHE_FILE, csv, 'utf-8')
  } catch (error) {
    console.error('Error writing budget cache file:', error)
    throw error
  }
}

/**
 * Reads budget cache metadata
 */
export async function getBudgetCacheMetadata(): Promise<CacheMetadata | null> {
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
 */
export async function updateBudgetCacheMetadata(
  budgetCount: number,
  status: CacheStatus,
  spreadsheetId: string,
  ttlMinutes: number
): Promise<CacheMetadata> {
  try {
    await ensureBudgetCacheDirectory()

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

    await fs.writeFile(BUDGET_METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8')
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
 */
export async function budgetCacheExists(): Promise<boolean> {
  try {
    await fs.access(BUDGET_CACHE_FILE)
    return true
  } catch {
    return false
  }
}

/**
 * Deletes budget cache files (for testing/debugging)
 */
export async function clearBudgetCache(): Promise<void> {
  try {
    await fs.unlink(BUDGET_CACHE_FILE).catch(() => {})
    await fs.unlink(BUDGET_METADATA_FILE).catch(() => {})
  } catch (error) {
    console.error('Error clearing budget cache:', error)
  }
}
