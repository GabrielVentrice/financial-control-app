import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.googleClientEmail,
      private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = config.public.googleSpreadsheetId

  const metadata = await sheets.spreadsheets.get({ spreadsheetId })

  const sheetNames = metadata.data.sheets?.map(sheet => ({
    title: sheet.properties?.title,
    sheetId: sheet.properties?.sheetId,
    index: sheet.properties?.index,
  }))

  // Try to get first 5 rows from first sheet
  const firstSheet = sheetNames?.[0]?.title || 'Sheet1'
  const preview = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${firstSheet}!A1:H5`,
  })

  return {
    spreadsheetId,
    sheets: sheetNames,
    firstSheetPreview: preview.data.values,
  }
})
