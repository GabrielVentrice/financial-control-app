/**
 * Debug Drive API - test different queries
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const folderId = config.googleDriveCacheFolderId

  try {
    const { google } = await import('googleapis')
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth })
    
    const tests = []
    
    // Test 1: List all files the service account can see
    try {
      const all = await drive.files.list({
        fields: 'files(id, name, parents, mimeType)',
        pageSize: 100
      })
      tests.push({
        name: 'All accessible files',
        count: all.data.files?.length || 0,
        files: all.data.files?.map(f => ({ 
          name: f.name, 
          id: f.id,
          parents: f.parents 
        }))
      })
    } catch (e: any) {
      tests.push({ name: 'All accessible files', error: e.message })
    }
    
    // Test 2: Query with parents
    try {
      const withParents = await drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name, mimeType)',
        pageSize: 100
      })
      tests.push({
        name: 'Files in folder (basic query)',
        count: withParents.data.files?.length || 0,
        files: withParents.data.files
      })
    } catch (e: any) {
      tests.push({ name: 'Files in folder (basic query)', error: e.message })
    }
    
    // Test 3: Query with shared drives support
    try {
      const withShared = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives'
      })
      tests.push({
        name: 'Files in folder (with allDrives)',
        count: withShared.data.files?.length || 0,
        files: withShared.data.files
      })
    } catch (e: any) {
      tests.push({ name: 'Files in folder (with allDrives)', error: e.message })
    }

    return {
      success: true,
      folderId,
      tests
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
