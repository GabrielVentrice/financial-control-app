/**
 * Google Drive Manager - Handles file operations on Google Drive for caching
 *
 * This utility provides functions to:
 * - Upload/update files to Google Drive
 * - Download files from Google Drive
 * - List and search for files
 * - Delete files
 *
 * All operations target a specific folder in Google Drive configured via environment variable.
 */

import { google, drive_v3 } from 'googleapis'
import type { Readable } from 'stream'

/**
 * Creates authenticated Google Drive client
 */
async function getDriveClient(): Promise<drive_v3.Drive> {
  const config = useRuntimeConfig()

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive'
      ],
    })

    return google.drive({ version: 'v3', auth })
  } catch (error) {
    console.error('Error creating Google Drive client:', error)
    throw error
  }
}

/**
 * Searches for a file by name in the specified folder
 */
async function findFileByName(
  drive: drive_v3.Drive,
  fileName: string,
  folderId: string
): Promise<string | null> {
  try {
    const query = `'${folderId}' in parents and name = '${fileName}' and trashed = false`

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives'
    })

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id || null
    }

    return null
  } catch (error) {
    console.error(`Error finding file '${fileName}':`, error)
    return null
  }
}

/**
 * Updates a file in Google Drive (file must already exist in the folder)
 * This works with Service Accounts on free Google accounts, avoiding quota issues.
 * 
 * IMPORTANT: Files must be manually created in the Drive folder first:
 * - transactions.csv
 * - metadata.json
 * - budgets.csv (if using budgets)
 * - budgets-metadata.json (if using budgets)
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string,
  mimeType: string
): Promise<boolean> {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    console.warn('⚠️ Google Drive folder ID not configured. Using local cache only.')
    return false
  }

  try {
    const drive = await getDriveClient()
    const existingFileId = await findFileByName(drive, fileName, folderId)

    if (!existingFileId) {
      console.warn(`⚠️ File '${fileName}' not found in Google Drive folder.`)
      console.warn(`📝 Please create an empty file named '${fileName}' in the Drive folder manually.`)
      console.warn(`🔗 Folder: https://drive.google.com/drive/folders/${folderId}`)
      return false
    }

    // Update existing file only (no creation to avoid quota issues)
    const media = {
      mimeType,
      body: content
    }

    await drive.files.update({
      fileId: existingFileId,
      media,
      fields: 'id, name, modifiedTime',
      supportsAllDrives: true
    })
    
    console.log(`✅ Updated file '${fileName}' in Google Drive`)
    return true

  } catch (error: any) {
    if (error.code === 403 && error.message?.includes('storage quota')) {
      console.error(`❌ Storage quota error for '${fileName}'. File must be created manually in Drive folder.`)
    } else {
      console.error(`❌ Error updating file '${fileName}':`, error.message)
    }
    return false
  }
}

/**
 * Downloads a file from Google Drive
 */
export async function downloadFileFromDrive(fileName: string): Promise<string | null> {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    console.warn('Google Drive folder ID not configured. Skipping Drive download.')
    return null
  }

  try {
    const drive = await getDriveClient()
    const fileId = await findFileByName(drive, fileName, folderId)

    if (!fileId) {
      console.log(`File '${fileName}' not found in Google Drive`)
      return null
    }

    const response = await drive.files.get({
      fileId,
      alt: 'media',
      supportsAllDrives: true
    }, {
      responseType: 'stream'
    })

    // Convert stream to string
    const chunks: Buffer[] = []
    const stream = response.data as unknown as Readable

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf-8')
        console.log(`✅ Downloaded file '${fileName}' from Google Drive`)
        resolve(content)
      })
      stream.on('error', (error: Error) => {
        console.error(`❌ Error downloading file '${fileName}':`, error)
        reject(error)
      })
    })
  } catch (error) {
    console.error(`❌ Error downloading file '${fileName}' from Google Drive:`, error)
    return null
  }
}

/**
 * Checks if a file exists in Google Drive
 */
export async function fileExistsInDrive(fileName: string): Promise<boolean> {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    return false
  }

  try {
    const drive = await getDriveClient()
    const fileId = await findFileByName(drive, fileName, folderId)
    return fileId !== null
  } catch (error) {
    console.error(`Error checking if file '${fileName}' exists:`, error)
    return false
  }
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteFileFromDrive(fileName: string): Promise<boolean> {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    console.warn('Google Drive folder ID not configured. Skipping Drive deletion.')
    return false
  }

  try {
    const drive = await getDriveClient()
    const fileId = await findFileByName(drive, fileName, folderId)

    if (!fileId) {
      console.log(`File '${fileName}' not found in Google Drive (nothing to delete)`)
      return true
    }

    await drive.files.delete({
      fileId,
      supportsAllDrives: true
    })

    console.log(`✅ Deleted file '${fileName}' from Google Drive`)
    return true
  } catch (error) {
    console.error(`❌ Error deleting file '${fileName}' from Google Drive:`, error)
    return false
  }
}

/**
 * Lists all files in the cache folder
 */
export async function listCacheFiles(): Promise<string[]> {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    console.warn('Google Drive folder ID not configured.')
    return []
  }

  try {
    const drive = await getDriveClient()
    const query = `'${folderId}' in parents and trashed = false`

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
      orderBy: 'modifiedTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    })

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files.map(file => file.name || 'unknown')
    }

    return []
  } catch (error) {
    console.error('Error listing cache files:', error)
    return []
  }
}
