/**
 * Initializes empty cache files in Google Drive folder
 * Run this once to create the required files manually
 */
export default defineEventHandler(async () => {
  const filesToCreate = [
    { name: 'transactions.csv', content: 'Transaction Id,Date,Origin,Destination,Description,Amount,Recorded at,Remote Id\n', mimeType: 'text/csv' },
    { name: 'metadata.json', content: '{"lastUpdate":"","recordCount":0,"dataHash":""}', mimeType: 'application/json' },
    { name: 'budgets.csv', content: 'Budget Id,Name,Amount,Period,Category,Created at\n', mimeType: 'text/csv' },
    { name: 'budgets-metadata.json', content: '{"lastUpdate":"","recordCount":0,"dataHash":""}', mimeType: 'application/json' }
  ]

  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  if (!folderId) {
    return {
      success: false,
      message: 'Google Drive folder ID not configured'
    }
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
    const results = []

    for (const file of filesToCreate) {
      try {
        const fileMetadata = {
          name: file.name,
          parents: [folderId]
        }

        const media = {
          mimeType: file.mimeType,
          body: file.content
        }

        const created = await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, name, webViewLink',
          supportsAllDrives: true
        })

        results.push({
          success: true,
          name: file.name,
          id: created.data.id,
          link: created.data.webViewLink
        })
      } catch (error: any) {
        results.push({
          success: false,
          name: file.name,
          error: error.message
        })
      }
    }

    return {
      success: true,
      message: 'File initialization complete',
      results
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Error initializing files',
      error: error.message
    }
  }
})
