import type { TransactionQueryParams } from '~/types/transaction'

/**
 * GET /api/docs/json
 * 
 * Returns API documentation in JSON format for programmatic access
 * 
 * @example
 * curl http://localhost:3000/api/docs/json
 */
export default defineEventHandler(async (event) => {
  const baseUrl = getRequestURL(event).origin
  
  const documentation = {
    title: "Financial Control App - API Documentation",
    description: "API for accessing financial data from Google Sheets with advanced filtering and processing capabilities",
    version: "1.0.0",
    baseUrl: baseUrl,
    
    pipeline: {
      description: "Data processing pipeline",
      steps: [
        "1. Fetch raw data from Google Sheets",
        "2. Enrich transactions with person identification (Juliana/Gabriel)",
        "3. Process and expand installments across months (optional)", 
        "4. Apply filters based on query parameters"
      ]
    },

    endpoints: {
      "/api/transactions": {
        method: "GET",
        description: "Fetch financial transactions from Google Sheets",
        parameters: {
          person: {
            type: "string",
            required: false,
            values: ["Juliana", "Gabriel", "Ambos"],
            description: "Filter by person. 'Ambos' returns transactions from both people."
          },
          startDate: {
            type: "string",
            required: false,
            format: "YYYY-MM-DD",
            example: "2025-01-01",
            description: "Start date for filtering transactions"
          },
          endDate: {
            type: "string", 
            required: false,
            format: "YYYY-MM-DD",
            example: "2025-01-31",
            description: "End date for filtering transactions"
          },
          searchTerm: {
            type: "string",
            required: false,
            example: "Netflix",
            description: "Search term to filter transaction descriptions (case-insensitive)"
          },
          origin: {
            type: "string",
            required: false,
            example: "Bank Account Gabriel",
            description: "Filter by origin account/card"
          },
          destination: {
            type: "string",
            required: false,
            example: "Groceries",
            description: "Filter by destination category"
          },
          processInstallments: {
            type: "boolean",
            required: false,
            default: true,
            values: [true, false, "true", "false"],
            description: "Whether to process and expand installments across months"
          }
        },
        responses: {
          "200": {
            description: "Success - Returns array of Transaction objects",
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  transactionId: { type: "string", description: "Unique transaction identifier" },
                  date: { type: "string", format: "YYYY-MM-DD", description: "Transaction date" },
                  origin: { type: "string", description: "Source account or card" },
                  destination: { type: "string", description: "Transaction category or destination" },
                  description: { type: "string", description: "Detailed transaction description" },
                  amount: { type: "number", description: "Transaction amount (negative for expenses, positive for income)" },
                  recordedAt: { type: "string", format: "ISO 8601", description: "Timestamp when transaction was recorded" },
                  remoteId: { type: "string", description: "Google Sheets row identifier" },
                  person: { type: "string", enum: ["Juliana", "Gabriel", null], description: "Auto-identified person based on Origin field" }
                }
              }
            }
          },
          "400": {
            description: "Bad Request - Invalid query parameters",
            schema: {
              type: "object",
              properties: {
                statusCode: { type: "number", example: 400 },
                statusMessage: { type: "string", example: "Invalid query parameters" },
                data: { type: "array", items: { type: "string" }, example: ["startDate must be in YYYY-MM-DD format"] }
              }
            }
          },
          "500": {
            description: "Internal Server Error",
            schema: {
              type: "object",
              properties: {
                statusCode: { type: "number", example: 500 },
                statusMessage: { type: "string", example: "Failed to process transactions" },
                data: { type: "string", example: "Unable to connect to Google Sheets" }
              }
            }
          }
        }
      },
      "/api/health": {
        method: "GET",
        description: "API health check endpoint"
      },
      "/api/docs": {
        method: "GET", 
        description: "HTML API documentation"
      },
      "/api/docs/json": {
        method: "GET",
        description: "JSON API documentation (this endpoint)"
      }
    },

    examples: [
      {
        title: "Get all transactions",
        url: `${baseUrl}/api/transactions`,
        description: "Fetch all available transactions"
      },
      {
        title: "Gabriel's transactions for January 2025",
        url: `${baseUrl}/api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31`,
        description: "Filter transactions by person and date range"
      },
      {
        title: "Search for Netflix transactions",
        url: `${baseUrl}/api/transactions?searchTerm=Netflix`,
        description: "Search transactions by description"
      },
      {
        title: "Supermarket transactions from both people", 
        url: `${baseUrl}/api/transactions?person=Ambos&searchTerm=supermercado`,
        description: "Combine person filter with search term"
      },
      {
        title: "Filter by destination category",
        url: `${baseUrl}/api/transactions?destination=Groceries`,
        description: "Filter transactions by category"
      },
      {
        title: "Disable installment processing",
        url: `${baseUrl}/api/transactions?processInstallments=false`,
        description: "Get raw transactions without installment expansion"
      },
      {
        title: "Multiple filters example",
        url: `${baseUrl}/api/transactions?person=Juliana&startDate=2025-01-01&endDate=2025-03-31&searchTerm=restaurante&processInstallments=true`,
        description: "Complex filtering with multiple parameters"
      }
    ],

    validation: {
      rules: [
        "person must be 'Juliana', 'Gabriel', or 'Ambos'",
        "startDate and endDate must be in YYYY-MM-DD format",
        "processInstallments must be a boolean or string 'true'/'false'",
        "startDate must be before or equal to endDate"
      ]
    },

    features: {
      personIdentification: {
        description: "Automatically identifies person based on Origin field patterns",
        note: "Patterns are case-insensitive and use substring matching"
      },
      installmentProcessing: {
        description: "Parses installment format and expands recurring payments across months",
        example: "Netflix 01/12 becomes 12 separate monthly transactions",
        grouping: "Related installments are grouped by series"
      },
      filtering: {
        description: "Advanced filtering capabilities with multiple parameter support",
        features: ["Date range filtering", "Person-based filtering", "Text search", "Category filtering"]
      }
    },

    useCases: [
      "Dashboard analytics and insights",
      "Transaction listing with filters", 
      "Category-based spending analysis",
      "Installment timeline visualization",
      "Fixed costs historical analysis"
    ],

    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
  
  return documentation
})