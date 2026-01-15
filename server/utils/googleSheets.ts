import { google } from 'googleapis'
import type { Transaction, SheetRow } from '~/types/transaction'

const TRANSACTIONS_SHEET_NAME = 'Fluxo' // Nome da aba na planilha do Google Sheets
const TRANSACTIONS_RANGE = `${TRANSACTIONS_SHEET_NAME}!A1:I` // Colunas A até I (Transaction Id, Status, Date, Origin, Destination, Description, Amount, Recorded at, Remote Id)

/**
 * Fetches raw transaction data from Google Sheets
 * This is the single source of truth for transaction data
 */
export async function fetchTransactionsFromGoogleSheets(): Promise<Transaction[]> {
  const config = useRuntimeConfig()

  try {
    // Configure Google Sheets authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch data from spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: TRANSACTIONS_RANGE,
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      return []
    }

    // First row contains headers
    const headers = rows[0]
    const dataRows = rows.slice(1)

    // Transform rows into Transaction objects
    const transactions: Transaction[] = dataRows.map((row) => {
      const rowData: any = {}
      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] || ''
      })

      return {
        transactionId: rowData['Transaction Id'] || '',
        date: rowData['Date'] || '',
        origin: rowData['Origin'] || '',
        destination: rowData['Destination'] || '',
        description: rowData['Description'] || '',
        amount: parseFloat(rowData['Amount']) || 0,
        recordedAt: rowData['Recorded at'] || '',
        remoteId: rowData['Remote Id'] || '',
      }
    })

    return transactions
  } catch (error: any) {
    console.error('Error fetching transactions from Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions from Google Sheets',
      data: error.message,
    })
  }
}
