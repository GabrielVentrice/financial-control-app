import { google } from 'googleapis'
import type { Transaction, SheetRow } from '~/types/transaction'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    // Configurar autenticação com Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleClientEmail,
        private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = config.public.googleSpreadsheetId

    // Buscar dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:H', // Todas as colunas de A até H
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      return []
    }

    // Primeira linha contém os headers
    const headers = rows[0]
    const dataRows = rows.slice(1)

    // Transformar rows em objetos Transaction
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
    console.error('Erro ao buscar transações:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar transações do Google Sheets',
      data: error.message,
    })
  }
})
