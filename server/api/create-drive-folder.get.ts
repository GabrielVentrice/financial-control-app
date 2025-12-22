/**
 * Creates a new folder in Google Drive accessible by the service account
 * Access via GET: /api/create-drive-folder
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.googleClientEmail || !config.googlePrivateKey) {
    return {
      success: false,
      message: 'Google credentials not configured'
    }
  }

  try {
    const { google } = await import('googleapis')
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Create a new folder directly accessible by the service account
    const folderMetadata = {
      name: 'financial-control-cache',
      mimeType: 'application/vnd.google-apps.folder'
    }

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name, webViewLink'
    })

    return {
      success: true,
      message: 'Folder created successfully!',
      folder: {
        id: folder.data.id,
        name: folder.data.name,
        link: folder.data.webViewLink
      },
      nextSteps: [
        `Update your .env file with: NUXT_GOOGLE_DRIVE_CACHE_FOLDER_ID=${folder.data.id}`,
        'Restart your dev server',
        'Test again with /api/test-drive'
      ]
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Error creating folder',
      error: error.message
    }
  }
})
