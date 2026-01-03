/**
 * Budget Template Cache Manager - Handles CSV file-based caching for Budget Template data
 * Supports both Google Drive and local filesystem storage
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type { BudgetTemplate } from '~/types/budgetTemplate'
import type { CacheMetadata, CacheStatus } from '~/types/cache'
import {
  uploadFileToDrive,
  downloadFileFromDrive,
  fileExistsInDrive,
  deleteFileFromDrive
} from './googleDrive'

// Cache file paths (local fallback)
const CACHE_DIR = join(process.cwd(), 'server', 'cache')
const TEMPLATE_CACHE_FILE = join(CACHE_DIR, 'budget-templates.csv')
const TEMPLATE_METADATA_FILE = join(CACHE_DIR, 'budget-templates-metadata.json')

// Google Drive file names
const DRIVE_TEMPLATE_CACHE_FILE = 'budget-templates.csv'
const DRIVE_TEMPLATE_METADATA_FILE = 'budget-templates-metadata.json'

// CSV header matching BudgetTemplate structure
const CSV_HEADER = 'ID,Category,Person,Percentage,Active,Created At,Updated At'

/**
 * Ensures cache directory exists
 */
export async function ensureBudgetTemplateCacheDirectory(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating budget template cache directory:', error)
    throw error
  }
}

/**
 * Converts BudgetTemplate array to CSV string
 */
function templatesToCSV(templates: BudgetTemplate[]): string {
  const rows = templates.map(t => {
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
      escape(t.category),
      escape(t.person),
      escape(t.percentage),
      escape(t.active),
      escape(t.createdAt),
      escape(t.updatedAt)
    ].join(',')
  })

  return [CSV_HEADER, ...rows].join('\n')
}

/**
 * Parses CSV string to BudgetTemplate array
 */
function csvToTemplates(csv: string): BudgetTemplate[] {
  const lines = csv.trim().split('\n')

  // Skip header
  if (lines.length <= 1) {
    return []
  }

  const templates: BudgetTemplate[] = []

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

    // Create template object
    if (values.length >= 7) {
      templates.push({
        id: values[0] || '',
        category: values[1] || '',
        person: values[2] as 'Juliana' | 'Gabriel',
        percentage: parseFloat(values[3]) || 0,
        active: values[4] === 'true',
        createdAt: values[5] || '',
        updatedAt: values[6] || ''
      })
    }
  }

  return templates
}

/**
 * Reads budget templates from cache file
 * Tries Google Drive first, then falls back to local filesystem (development only)
 */
export async function readBudgetTemplateCache(): Promise<BudgetTemplate[]> {
  // Try Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const csv = await downloadFileFromDrive(DRIVE_TEMPLATE_CACHE_FILE)
      if (csv) {
        console.log('📥 Reading budget template cache from Google Drive')
        return csvToTemplates(csv)
      }
      // File doesn't exist in Google Drive
      console.log('📭 Budget template cache not found in Google Drive')
      return []
    } catch (error) {
      console.warn('⚠️  Failed to read budget template cache from Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        return []
      }
    }
  }

  // Fallback to local filesystem (development only)
  try {
    console.log('📁 Reading budget template cache from local filesystem')
    const csv = await fs.readFile(TEMPLATE_CACHE_FILE, 'utf-8')
    return csvToTemplates(csv)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Cache file doesn't exist
      return []
    }
    console.error('Error reading budget template cache file:', error)
    throw error
  }
}

/**
 * Writes budget templates to cache file
 * Saves to Google Drive when configured, otherwise falls back to local filesystem
 */
export async function writeBudgetTemplateCache(templates: BudgetTemplate[]): Promise<void> {
  const csv = templatesToCSV(templates)

  // Try to save to Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const success = await uploadFileToDrive(DRIVE_TEMPLATE_CACHE_FILE, csv, 'text/csv')
      if (success) {
        console.log('📤 Budget template cache saved to Google Drive')
        return // Success! No need for local backup in production
      }
    } catch (error) {
      console.warn('⚠️  Failed to save budget template cache to Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Falling back to local filesystem (development only)')
      } else {
        throw new Error('Failed to save budget template cache to Google Drive')
      }
    }
  }

  // Save locally only in development or when Google Drive is not configured
  try {
    await ensureBudgetTemplateCacheDirectory()
    await fs.writeFile(TEMPLATE_CACHE_FILE, csv, 'utf-8')
    console.log('💾 Budget template cache saved to local filesystem')
  } catch (error) {
    console.error('Error writing budget template cache file:', error)
    throw error
  }
}

/**
 * Reads budget template cache metadata
 * Tries Google Drive first, then falls back to local filesystem (development only)
 */
export async function getBudgetTemplateCacheMetadata(): Promise<CacheMetadata | null> {
  // Try Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const json = await downloadFileFromDrive(DRIVE_TEMPLATE_METADATA_FILE)
      if (json) {
        return JSON.parse(json) as CacheMetadata
      }
      // Metadata doesn't exist in Google Drive
      return null
    } catch (error) {
      console.warn('⚠️  Failed to read budget template metadata from Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        return null
      }
    }
  }

  // Fallback to local filesystem (development only)
  try {
    const json = await fs.readFile(TEMPLATE_METADATA_FILE, 'utf-8')
    return JSON.parse(json) as CacheMetadata
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Metadata file doesn't exist
      return null
    }
    console.error('Error reading budget template cache metadata:', error)
    return null
  }
}

/**
 * Updates budget template cache metadata
 * Saves to Google Drive and keeps local backup
 */
export async function updateBudgetTemplateCacheMetadata(
  templateCount: number,
  status: CacheStatus,
  spreadsheetId: string,
  ttlMinutes: number
): Promise<CacheMetadata> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)

  const metadata: CacheMetadata = {
    lastUpdate: now.toISOString(),
    status,
    transactionCount: templateCount, // Reusing same field name for consistency
    expiresAt: expiresAt.toISOString(),
    spreadsheetId,
    version: 1
  }

  const metadataJson = JSON.stringify(metadata, null, 2)

  // Try to save to Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const success = await uploadFileToDrive(DRIVE_TEMPLATE_METADATA_FILE, metadataJson, 'application/json')
      if (success) {
        console.log('📤 Budget template metadata saved to Google Drive')
        return metadata // Success! No need for local backup in production
      }
    } catch (error) {
      console.warn('⚠️  Failed to save budget template metadata to Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Failed to save budget template metadata to Google Drive')
      }
    }
  }

  // Save locally only in development or when Google Drive is not configured
  try {
    await ensureBudgetTemplateCacheDirectory()
    await fs.writeFile(TEMPLATE_METADATA_FILE, metadataJson, 'utf-8')
    return metadata
  } catch (error) {
    console.error('Error updating budget template cache metadata:', error)
    throw error
  }
}

/**
 * Checks if budget template cache is valid based on TTL
 */
export async function isBudgetTemplateCacheValid(): Promise<boolean> {
  const metadata = await getBudgetTemplateCacheMetadata()

  if (!metadata) {
    return false
  }

  const now = new Date()
  const expiresAt = new Date(metadata.expiresAt)

  return now < expiresAt && metadata.status === 'fresh'
}

/**
 * Checks if budget template cache exists
 * Checks Google Drive first, then local filesystem (development only)
 */
export async function budgetTemplateCacheExists(): Promise<boolean> {
  // Check Google Drive first
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      const exists = await fileExistsInDrive(DRIVE_TEMPLATE_CACHE_FILE)
      return exists
    } catch (error) {
      console.warn('⚠️  Failed to check budget template cache in Google Drive:', error)
      // Only fall back to local in development
      if (process.env.NODE_ENV !== 'development') {
        return false
      }
    }
  }

  // Fallback to local check (development only)
  try {
    await fs.access(TEMPLATE_CACHE_FILE)
    return true
  } catch {
    return false
  }
}

/**
 * Deletes budget template cache files (for testing/debugging)
 * Clears Google Drive and local filesystem (development only)
 */
export async function clearBudgetTemplateCache(): Promise<void> {
  // Delete from Google Drive
  const config = useRuntimeConfig()
  if (config.googleDriveCacheFolderId) {
    try {
      await deleteFileFromDrive(DRIVE_TEMPLATE_CACHE_FILE)
      await deleteFileFromDrive(DRIVE_TEMPLATE_METADATA_FILE)
      console.log('🗑️  Budget template cache cleared from Google Drive')
    } catch (error) {
      console.warn('⚠️  Failed to delete budget template cache from Google Drive:', error)
    }
  }

  // Delete from local filesystem (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      await fs.unlink(TEMPLATE_CACHE_FILE).catch(() => {})
      await fs.unlink(TEMPLATE_METADATA_FILE).catch(() => {})
      console.log('🗑️  Local budget template cache cleared')
    } catch (error) {
      console.error('Error clearing local budget template cache:', error)
    }
  }
}
