/**
 * Test endpoint to verify Google Drive connection
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const result = {
    configured: false,
    folderId: config.googleDriveCacheFolderId || 'NOT_SET',
    clientEmail: config.googleClientEmail || 'NOT_SET',
    hasPrivateKey: !!config.googlePrivateKey,
    tests: {} as Record<string, any>
  }

  // Check if configured
  if (!config.googleDriveCacheFolderId || !config.googleClientEmail || !config.googlePrivateKey) {
    return {
      success: false,
      message: 'Google Drive not fully configured',
      result
    }
  }

  result.configured = true

  try {
    const { google } = await import('googleapis')
    
    // Test 1: Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })
    result.tests.authCreated = true

    // Test 2: Try to access the folder
    try {
      const folderInfo = await drive.files.get({
        fileId: config.googleDriveCacheFolderId,
        fields: 'id, name, capabilities, driveId, teamDriveId, shared, ownedByMe',
        supportsAllDrives: true
      })
      
      result.tests.folderAccess = {
        success: true,
        folderName: folderInfo.data.name,
        shared: folderInfo.data.shared,
        ownedByMe: folderInfo.data.ownedByMe,
        driveId: folderInfo.data.driveId,
        teamDriveId: folderInfo.data.teamDriveId,
        canAddChildren: folderInfo.data.capabilities?.canAddChildren
      }
    } catch (error: any) {
      result.tests.folderAccess = {
        success: false,
        error: error.message
      }
    }

    // Test 3: Try to list files in the folder
    try {
      const fileList = await drive.files.list({
        q: `'${config.googleDriveCacheFolderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 5,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      })
      
      result.tests.listFiles = {
        success: true,
        fileCount: fileList.data.files?.length || 0,
        files: fileList.data.files?.map(f => ({ name: f.name, id: f.id }))
      }
    } catch (error: any) {
      result.tests.listFiles = {
        success: false,
        error: error.message
      }
    }

    // Test 4: Try to create a test file
    try {
      const testContent = `Test file created at ${new Date().toISOString()}`
      const fileName = `test-${Date.now()}.txt`
      
      const fileMetadata = {
        name: fileName,
        parents: [config.googleDriveCacheFolderId]
      }

      const media = {
        mimeType: 'text/plain',
        body: testContent
      }

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink',
        supportsAllDrives: true
      })

      result.tests.createFile = {
        success: true,
        fileId: file.data.id,
        fileName: file.data.name,
        link: file.data.webViewLink
      }

      // Delete the test file
      try {
        await drive.files.delete({
          fileId: file.data.id!,
          supportsAllDrives: true
        })
        result.tests.deleteFile = { success: true }
      } catch (deleteError: any) {
        result.tests.deleteFile = {
          success: false,
          error: deleteError.message
        }
      }

    } catch (error: any) {
      result.tests.createFile = {
        success: false,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.errors
      }
    }

    return {
      success: true,
      message: 'Tests completed',
      result
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Error running tests',
      error: error.message,
      result
    }
  }
})
