/**
 * List all files in the Google Drive cache folder
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    return { success: false, message: 'Folder ID not configured' }
  }

  try {
    const { google } = await import('googleapis')
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    })

    return {
      success: true,
      folderLink: `https://drive.google.com/drive/folders/${folderId}`,
      fileCount: response.data.files?.length || 0,
      files: response.data.files || [],
      instructions: response.data.files?.length === 0 
        ? [
            '1. Open the folder link above',
            '2. Click "New" → "Google Docs"',
            '3. Delete all content and File → Download → Plain Text (.txt)',
            '4. Rename the downloaded file to: transactions.csv',
            '5. Upload it back to the folder',
            '6. Repeat for: metadata.json, budgets.csv, budgets-metadata.json'
          ]
        : null
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
