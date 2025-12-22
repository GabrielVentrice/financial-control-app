/**
 * Check folder permissions and suggest fixes
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
    
    // Try to get folder info
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, capabilities, permissions, shared, ownedByMe',
      supportsAllDrives: true
    })

    // Try to list permissions
    let permissions = []
    try {
      const perms = await drive.permissions.list({
        fileId: folderId,
        fields: 'permissions(id, emailAddress, role, type)',
        supportsAllDrives: true
      })
      permissions = perms.data.permissions || []
    } catch (e: any) {
      permissions = [{ error: 'Cannot list permissions: ' + e.message }]
    }

    const serviceAccountEmail = config.googleClientEmail
    const hasServiceAccountAccess = permissions.some(
      (p: any) => p.emailAddress === serviceAccountEmail && p.role === 'writer'
    )

    return {
      success: true,
      folder: {
        name: folder.data.name,
        shared: folder.data.shared,
        ownedByMe: folder.data.ownedByMe,
        canAddChildren: folder.data.capabilities?.canAddChildren,
        canEdit: folder.data.capabilities?.canEdit
      },
      permissions,
      serviceAccountEmail,
      hasServiceAccountAccess,
      diagnosis: hasServiceAccountAccess 
        ? '✅ Service Account has Editor access to the folder'
        : '❌ Service Account does NOT have Editor access. Please share the folder explicitly with: ' + serviceAccountEmail,
      instruction: hasServiceAccountAccess 
        ? null
        : [
            `1. Open: https://drive.google.com/drive/folders/${folderId}`,
            '2. Click the folder name at the top',
            '3. Click "Share" button (person icon with +)',
            `4. Add this email with Editor permission: ${serviceAccountEmail}`,
            '5. Uncheck "Notify people"',
            '6. Click "Share"'
          ]
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      diagnosis: '❌ Cannot access folder. Service Account may not have permissions.',
      instruction: [
        `1. Open: https://drive.google.com/drive/folders/${folderId}`,
        '2. Click "Share" button',
        `3. Add: ${config.googleClientEmail}`,
        '4. Permission: Editor',
        '5. Click "Share"'
      ]
    }
  }
})
