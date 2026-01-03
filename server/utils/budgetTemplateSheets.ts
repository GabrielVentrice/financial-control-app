import { google } from 'googleapis'
import type { BudgetTemplate, BudgetTemplateInput } from '~/types/budgetTemplate'

const TEMPLATE_SHEET_NAME = 'Budget_Templates'
const TEMPLATE_RANGE = `${TEMPLATE_SHEET_NAME}!A1:F` // Colunas A até F (Category, Person, Percentage, Active, Created At, Updated At)

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
 * Fetches budget templates from Google Sheets
 */
export async function fetchBudgetTemplatesFromGoogleSheets(): Promise<BudgetTemplate[]> {
  const config = useRuntimeConfig()

  try {
    const sheets = createSheetsClient()
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch data from Budget_Templates sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: TEMPLATE_RANGE,
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      console.log('[BudgetTemplates] No template data found in sheet')
      return []
    }

    // First row contains headers
    const headers = rows[0]
    const dataRows = rows.slice(1)

    // Transform rows into BudgetTemplate objects
    const templates: BudgetTemplate[] = dataRows
      .filter(row => row.length > 0) // Skip empty rows
      .map((row) => {
        const rowData: any = {}
        headers.forEach((header: string, index: number) => {
          rowData[header] = row[index] || ''
        })

        const category = rowData['Category'] || ''
        const person = rowData['Person'] || ''
        const percentage = parseFloat(rowData['Percentage']) || 0
        const active = rowData['Active'] === 'true' || rowData['Active'] === true

        return {
          id: `${category}-${person}`.toLowerCase().replace(/\s+/g, '-'),
          category,
          person: person as 'Juliana' | 'Gabriel',
          percentage,
          active,
          createdAt: rowData['Created At'] || '',
          updatedAt: rowData['Updated At'] || '',
        }
      })
      .filter(template => template.category && template.person) // Filter out invalid rows

    console.log(`[BudgetTemplates] Fetched ${templates.length} templates from Google Sheets`)
    return templates
  } catch (error: any) {
    // If the sheet doesn't exist, return empty array
    if (error.message?.includes('Unable to parse range')) {
      console.log('[BudgetTemplates] Budget_Templates sheet does not exist yet. Returning empty array.')
      return []
    }

    console.error('[BudgetTemplates] Error fetching templates from Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch budget templates from Google Sheets',
      data: error.message,
    })
  }
}

/**
 * Ensures the Budget_Templates sheet exists and has the correct headers
 *
 * Sheet Structure (6 columns):
 * A: Category (e.g., "Food", "Transportation")
 * B: Person ("Juliana" or "Gabriel")
 * C: Percentage (e.g., 25.5)
 * D: Active (true/false)
 * E: Created At (ISO timestamp)
 * F: Updated At (ISO timestamp)
 */
async function ensureBudgetTemplateSheetExists(): Promise<void> {
  const config = useRuntimeConfig()
  const sheets = createSheetsClient()
  const spreadsheetId = config.public.googleSpreadsheetId

  try {
    // Get spreadsheet metadata to check if Budget_Templates sheet exists
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const templateSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.title === TEMPLATE_SHEET_NAME
    )

    if (!templateSheet) {
      console.log(`[BudgetTemplates] Creating ${TEMPLATE_SHEET_NAME} sheet with correct structure...`)

      // Create the Budget_Templates sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: TEMPLATE_SHEET_NAME,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 6,
                  },
                },
              },
            },
          ],
        },
      })

      // Add headers with correct structure
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${TEMPLATE_SHEET_NAME}!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Category', 'Person', 'Percentage', 'Active', 'Created At', 'Updated At']],
        },
      })

      console.log(`[BudgetTemplates] ✅ ${TEMPLATE_SHEET_NAME} sheet created successfully with structure: Category | Person | Percentage | Active | Created At | Updated At`)
    } else {
      console.log(`[BudgetTemplates] ℹ️  ${TEMPLATE_SHEET_NAME} sheet already exists`)
    }
  } catch (error: any) {
    console.error('[BudgetTemplates] Error ensuring template sheet exists:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to ensure budget template sheet exists',
      data: error.message,
    })
  }
}

/**
 * Saves or updates budget templates in Google Sheets (Budget_Templates sheet)
 *
 * If a template for the same Category/Person exists, it will be updated.
 * Otherwise, a new template will be created.
 *
 * Row Structure: Category | Person | Percentage | Active | Created At | Updated At
 *
 * ⚡ OPTIMIZED: Uses batch operations to update/append multiple templates in a single API call
 */
export async function saveBudgetTemplatesToGoogleSheets(templates: BudgetTemplateInput[]): Promise<BudgetTemplate[]> {
  const config = useRuntimeConfig()

  try {
    const startTime = Date.now()

    // Ensure the Budget_Templates sheet exists
    await ensureBudgetTemplateSheetExists()

    const sheets = createSheetsClient()
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch all data from sheet to find row positions
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: TEMPLATE_RANGE,
    })

    const allRows = response.data.values || [['Category', 'Person', 'Percentage', 'Active', 'Created At', 'Updated At']]
    const timestamp = new Date().toISOString()

    console.log(`[BudgetTemplates] Found ${allRows.length - 1} existing rows in sheet`)

    // Process all templates and classify them as updates or new entries
    const updatesToApply: { range: string; values: string[][] }[] = []
    const newRowsToAppend: string[][] = []
    const savedTemplates: BudgetTemplate[] = []

    for (const templateInput of templates) {
      const templateId = `${templateInput.category}-${templateInput.person}`
        .toLowerCase()
        .replace(/\s+/g, '-')

      // Check if template already exists (Category, Person)
      const existingIndex = allRows.findIndex((row, index) => {
        if (index === 0) return false // Skip header row
        const category = row[0] || ''
        const person = row[1] || ''

        return category === templateInput.category &&
               person === templateInput.person
      })

      const active = templateInput.active !== undefined ? templateInput.active : true

      if (existingIndex > 0) {
        // Prepare update for existing template
        const rowNumber = existingIndex + 1 // +1 because sheets are 1-indexed
        const createdAt = allRows[existingIndex][4] || timestamp

        const updatedRow = [
          templateInput.category,
          templateInput.person,
          templateInput.percentage.toString(),
          active.toString(),
          createdAt,
          timestamp,
        ]

        updatesToApply.push({
          range: `${TEMPLATE_SHEET_NAME}!A${rowNumber}:F${rowNumber}`,
          values: [updatedRow],
        })

        // Update the row in memory
        allRows[existingIndex] = updatedRow

        savedTemplates.push({
          id: templateId,
          category: templateInput.category,
          person: templateInput.person,
          percentage: templateInput.percentage,
          active,
          createdAt,
          updatedAt: timestamp,
        })

        console.log(`[BudgetTemplates] Prepared update for ${templateInput.person} - ${templateInput.category} (${templateInput.percentage}%)`)
      } else {
        // Prepare new template row
        const newRow = [
          templateInput.category,
          templateInput.person,
          templateInput.percentage.toString(),
          active.toString(),
          timestamp,
          timestamp,
        ]

        newRowsToAppend.push(newRow)

        savedTemplates.push({
          id: templateId,
          category: templateInput.category,
          person: templateInput.person,
          percentage: templateInput.percentage,
          active,
          createdAt: timestamp,
          updatedAt: timestamp,
        })

        console.log(`[BudgetTemplates] Prepared new template for ${templateInput.person} - ${templateInput.category} (${templateInput.percentage}%)`)
      }
    }

    // Batch update all existing templates in a single API call
    if (updatesToApply.length > 0) {
      console.log(`[BudgetTemplates] ⚡ Batch updating ${updatesToApply.length} templates in a single API call...`)

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updatesToApply,
        },
      })

      console.log(`[BudgetTemplates] ✅ Batch updated ${updatesToApply.length} templates`)
    }

    // Append all new templates in a single API call
    if (newRowsToAppend.length > 0) {
      console.log(`[BudgetTemplates] ⚡ Batch appending ${newRowsToAppend.length} new templates in a single API call...`)

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: TEMPLATE_RANGE,
        valueInputOption: 'RAW',
        requestBody: {
          values: newRowsToAppend,
        },
      })

      console.log(`[BudgetTemplates] ✅ Batch appended ${newRowsToAppend.length} new templates`)
    }

    const elapsedTime = Date.now() - startTime
    console.log(`[BudgetTemplates] 🚀 Saved ${savedTemplates.length} templates to Google Sheets in ${elapsedTime}ms`)
    console.log(`[BudgetTemplates] Performance: ${updatesToApply.length} updates + ${newRowsToAppend.length} new entries in ${updatesToApply.length > 0 || newRowsToAppend.length > 0 ? (updatesToApply.length > 0 && newRowsToAppend.length > 0 ? '2' : '1') : '0'} API call(s)`)

    return savedTemplates
  } catch (error: any) {
    console.error('[BudgetTemplates] Error saving templates to Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save budget templates to Google Sheets',
      data: error.message,
    })
  }
}

/**
 * Deletes a budget template from Google Sheets
 */
export async function deleteBudgetTemplateFromGoogleSheets(category: string, person: 'Juliana' | 'Gabriel'): Promise<void> {
  const config = useRuntimeConfig()

  try {
    const sheets = createSheetsClient()
    const spreadsheetId = config.public.googleSpreadsheetId

    // Fetch all data to find the row to delete
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: TEMPLATE_RANGE,
    })

    const allRows = response.data.values || []

    // Find the row index (Category, Person)
    const rowIndex = allRows.findIndex((row, index) => {
      if (index === 0) return false // Skip header
      const rowCategory = row[0] || ''
      const rowPerson = row[1] || ''

      return rowCategory === category &&
             rowPerson === person
    })

    if (rowIndex <= 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Budget template not found',
      })
    }

    // Get sheet ID
    const metadata = await sheets.spreadsheets.get({ spreadsheetId })
    const templateSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.title === TEMPLATE_SHEET_NAME
    )

    if (!templateSheet?.properties?.sheetId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Budget template sheet not found',
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
                sheetId: templateSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex, // 0-indexed
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    })

    console.log(`[BudgetTemplates] Deleted template for ${person} - ${category}`)
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('[BudgetTemplates] Error deleting template from Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete budget template from Google Sheets',
      data: error.message,
    })
  }
}
