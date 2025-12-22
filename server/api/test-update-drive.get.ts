/**
 * Test updating files in Google Drive
 */
export default defineEventHandler(async () => {
  const { uploadFileToDrive } = await import('../utils/googleDrive')
  
  const results = []
  
  // Test updating each file
  const testFiles = [
    { name: 'transactions.csv', content: 'Transaction Id,Date,Origin,Destination,Description,Amount,Recorded at,Remote Id\n', mimeType: 'text/csv' },
    { name: 'metadata.json', content: '{"lastUpdate":"' + new Date().toISOString() + '","recordCount":0,"dataHash":"test"}', mimeType: 'application/json' }
  ]
  
  for (const file of testFiles) {
    const success = await uploadFileToDrive(file.name, file.content, file.mimeType)
    results.push({
      name: file.name,
      success,
      status: success ? 'Updated successfully' : 'Failed - file may not exist in Drive'
    })
  }
  
  return {
    message: 'Update test complete',
    results,
    instruction: results.some(r => !r.success) 
      ? 'Create missing files manually in Google Drive folder: https://drive.google.com/drive/folders/1yFWaKvlOaC1pZN_yN09XSTsD8wXW7NYt'
      : 'All files updated successfully! Google Drive sync is working.'
  }
})
