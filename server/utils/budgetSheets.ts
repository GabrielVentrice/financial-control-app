import { google } from 'googleapis'
import type { Budget, BudgetSheetRow, BudgetInput } from '~/types/transaction'

const BUDGET_SHEET_NAME = 'Budgets' // Nome da aba na planilha do Google Sheets
const BUDGET_RANGE = `${BUDGET_SHEET_NAME}!A1:G` // Colunas A até G

/**
 * Creates Google Sheets authentication client with read/write permissions
 */
function createSheetsClient() {
  const config = useRuntimeConfig()

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.googleClientEmail,
      private_key: config.googlePrivateKey?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets', // Read/write access
    ],
  })

  return google.sheets({ version: 'v4', auth })
}

/**
 * Fetches budget data from Google Sheets
 */
export async function fetchBudgetsFromGoogleSheets(): Promise<Budget[]> {
  const config = useRuntimeConfig()

  try {
    const sheets = createSheetsClient()
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch data from Budgets sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: BUDGET_RANGE,
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      console.log('[Budgets] No budget data found in sheet')
      return []
    }

    // First row contains headers
    const headers = rows[0]
    const dataRows = rows.slice(1)

    // Transform rows into Budget objects
    const budgets: Budget[] = dataRows
      .filter(row => row.length > 0) // Skip empty rows
      .map((row) => {
        const rowData: any = {}
        headers.forEach((header: string, index: number) => {
          rowData[header] = row[index] || ''
        })

        const category = rowData['Category'] || ''
        const person = rowData['Person'] || ''
        const month = parseInt(rowData['Month']) || 0
        const year = parseInt(rowData['Year']) || 0
        const amount = parseFloat(rowData['Amount']) || 0

        return {
          id: `${category}-${person}-${month}-${year}`.toLowerCase().replace(/\s+/g, '-'),
          category,
          person: person as 'Juliana' | 'Gabriel',
          month,
          year,
          amount,
          createdAt: rowData['Created At'] || '',
          updatedAt: rowData['Updated At'] || '',
        }
      })
      .filter(budget => budget.category && budget.person && budget.month && budget.year) // Filter out invalid rows

    console.log(`[Budgets] Fetched ${budgets.length} budgets from Google Sheets`)
    return budgets
  } catch (error: any) {
    // If the sheet doesn't exist, return empty array
    if (error.message?.includes('Unable to parse range')) {
      console.log('[Budgets] Budgets sheet does not exist yet. Returning empty array.')
      return []
    }

    console.error('[Budgets] Error fetching budgets from Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch budgets from Google Sheets',
      data: error.message,
    })
  }
}

/**
 * Ensures the Budgets sheet exists and has the correct headers
 */
async function ensureBudgetSheetExists(): Promise<void> {
  const config = useRuntimeConfig()
  const sheets = createSheetsClient()
  const spreadsheetId = config.public.googleSpreadsheetId

  try {
    // Get spreadsheet metadata to check if Budgets sheet exists
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const budgetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.title === BUDGET_SHEET_NAME
    )

    if (!budgetSheet) {
      console.log('[Budgets] Creating Budgets sheet...')

      // Create the Budgets sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: BUDGET_SHEET_NAME,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 7,
                  },
                },
              },
            },
          ],
        },
      })

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${BUDGET_SHEET_NAME}!A1:G1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Category', 'Person', 'Month', 'Year', 'Amount', 'Created At', 'Updated At']],
        },
      })

      console.log('[Budgets] Budgets sheet created successfully')
    }
  } catch (error: any) {
    console.error('[Budgets] Error ensuring budget sheet exists:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to ensure budget sheet exists',
      data: error.message,
    })
  }
}

/**
 * Saves or updates budgets in Google Sheets
 * If a budget for the same category/month/year exists, it will be updated
 * Otherwise, a new budget will be created
 */
export async function saveBudgetsToGoogleSheets(budgets: BudgetInput[]): Promise<Budget[]> {
  const config = useRuntimeConfig()

  try {
    // Ensure the Budgets sheet exists
    await ensureBudgetSheetExists()

    const sheets = createSheetsClient()
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch existing budgets
    const existingBudgets = await fetchBudgetsFromGoogleSheets()

    // Fetch all data from sheet to find row positions
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: BUDGET_RANGE,
    })

    const allRows = response.data.values || [['Category', 'Person', 'Month', 'Year', 'Amount', 'Created At', 'Updated At']]
    const timestamp = new Date().toISOString()

    // Process each budget input
    const savedBudgets: Budget[] = []

    for (const budgetInput of budgets) {
      const budgetId = `${budgetInput.category}-${budgetInput.person}-${budgetInput.month}-${budgetInput.year}`
        .toLowerCase()
        .replace(/\s+/g, '-')

      // Check if budget already exists
      const existingIndex = allRows.findIndex((row, index) => {
        if (index === 0) return false // Skip header row
        const category = row[0] || ''
        const person = row[1] || ''
        const month = parseInt(row[2]) || 0
        const year = parseInt(row[3]) || 0
        return category === budgetInput.category && person === budgetInput.person && month === budgetInput.month && year === budgetInput.year
      })

      if (existingIndex > 0) {
        // Update existing budget
        console.log(`[Budgets] Updating budget for ${budgetInput.person} - ${budgetInput.category} ${budgetInput.month}/${budgetInput.year}`)

        const rowNumber = existingIndex + 1 // +1 because sheets are 1-indexed
        const createdAt = allRows[existingIndex][5] || timestamp

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${BUDGET_SHEET_NAME}!A${rowNumber}:G${rowNumber}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              budgetInput.category,
              budgetInput.person,
              budgetInput.month.toString(),
              budgetInput.year.toString(),
              budgetInput.amount.toString(),
              createdAt,
              timestamp,
            ]],
          },
        })

        // Update the row in memory
        allRows[existingIndex] = [
          budgetInput.category,
          budgetInput.person,
          budgetInput.month.toString(),
          budgetInput.year.toString(),
          budgetInput.amount.toString(),
          createdAt,
          timestamp,
        ]

        savedBudgets.push({
          id: budgetId,
          category: budgetInput.category,
          person: budgetInput.person,
          month: budgetInput.month,
          year: budgetInput.year,
          amount: budgetInput.amount,
          createdAt,
          updatedAt: timestamp,
        })
      } else {
        // Create new budget
        console.log(`[Budgets] Creating new budget for ${budgetInput.person} - ${budgetInput.category} ${budgetInput.month}/${budgetInput.year}`)

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: BUDGET_RANGE,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              budgetInput.category,
              budgetInput.person,
              budgetInput.month.toString(),
              budgetInput.year.toString(),
              budgetInput.amount.toString(),
              timestamp,
              timestamp,
            ]],
          },
        })

        savedBudgets.push({
          id: budgetId,
          category: budgetInput.category,
          person: budgetInput.person,
          month: budgetInput.month,
          year: budgetInput.year,
          amount: budgetInput.amount,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }

    console.log(`[Budgets] Saved ${savedBudgets.length} budgets to Google Sheets`)
    return savedBudgets
  } catch (error: any) {
    console.error('[Budgets] Error saving budgets to Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save budgets to Google Sheets',
      data: error.message,
    })
  }
}

/**
 * Deletes a budget from Google Sheets
 */
export async function deleteBudgetFromGoogleSheets(category: string, person: 'Juliana' | 'Gabriel', month: number, year: number): Promise<void> {
  const config = useRuntimeConfig()

  try {
    const sheets = createSheetsClient()
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch all data to find the row to delete
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: BUDGET_RANGE,
    })

    const allRows = response.data.values || []

    // Find the row index
    const rowIndex = allRows.findIndex((row, index) => {
      if (index === 0) return false // Skip header
      const rowCategory = row[0] || ''
      const rowPerson = row[1] || ''
      const rowMonth = parseInt(row[2]) || 0
      const rowYear = parseInt(row[3]) || 0
      return rowCategory === category && rowPerson === person && rowMonth === month && rowYear === year
    })

    if (rowIndex <= 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Budget not found',
      })
    }

    // Get sheet ID
    const metadata = await sheets.spreadsheets.get({ spreadsheetId })
    const budgetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.title === BUDGET_SHEET_NAME
    )

    if (!budgetSheet?.properties?.sheetId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Budget sheet not found',
      })
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: budgetSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex, // 0-indexed
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    })

    console.log(`[Budgets] Deleted budget for ${person} - ${category} ${month}/${year}`)
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Budgets] Error deleting budget from Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete budget from Google Sheets',
      data: error.message,
    })
  }
}
