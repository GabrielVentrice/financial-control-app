import type { TransactionQueryParams } from '~/types/transaction'

/**
 * GET /api/docs/md
 * 
 * Returns API documentation in Markdown format for human-readable documentation
 * 
 * @example
 * curl http://localhost:3000/api/docs/md
 */
export default defineEventHandler(async (event) => {
  const baseUrl = getRequestURL(event).origin
  
  // Set the content type to markdown
  setHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  
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
      "/api/categories": {
        method: "GET",
        description: "Get category analysis and spending breakdown with configurable exclusions and categorization rules",
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
          },
          includeTransactions: {
            type: "boolean",
            required: false,
            default: false,
            values: [true, false, "true", "false"],
            description: "Whether to include individual transactions in response"
          }
        },
        responses: {
          "200": {
            description: "Success - Returns category analysis with totals and breakdowns",
            schema: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Category name" },
                      count: { type: "number", description: "Number of transactions in category" },
                      total: { type: "number", description: "Total amount spent in category" },
                      percentage: { type: "number", description: "Percentage of total spending" },
                      average: { type: "number", description: "Average transaction amount in category" },
                      transactions: { 
                        type: "array", 
                        description: "Individual transactions (only when includeTransactions=true)",
                        items: { type: "object", description: "Transaction object" }
                      }
                    }
                  }
                },
                totals: {
                  type: "object",
                  properties: {
                    variableCosts: { type: "number", description: "Total variable costs (non-recurring expenses)" },
                    fixedCosts: { type: "number", description: "Total fixed costs (same amount every month)" },
                    committedExpenses: { type: "number", description: "Total committed expenses (recurring but variable amounts)" },
                    total: { type: "number", description: "Total amount of all expenses" },
                    categoryCounts: {
                      type: "object",
                      properties: {
                        fixedCosts: { type: "number", description: "Number of fixed cost categories" },
                        committedExpenses: { type: "number", description: "Number of committed expense categories" }
                      }
                    }
                  }
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
                statusMessage: { type: "string", example: "Failed to process categories" },
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
        description: "JSON API documentation"
      },
      "/api/docs/md": {
        method: "GET",
        description: "Markdown API documentation (this endpoint)"
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
      },
      {
        title: "Category analysis for current month",
        url: `${baseUrl}/api/categories`,
        description: "Get spending breakdown by category"
      },
      {
        title: "Gabriel's category analysis with transaction details",
        url: `${baseUrl}/api/categories?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31&includeTransactions=true`,
        description: "Category analysis for specific person and period with individual transactions"
      },
      {
        title: "Category analysis for specific period",
        url: `${baseUrl}/api/categories?startDate=2025-01-01&endDate=2025-12-31`,
        description: "Annual category spending analysis"
      },
      {
        title: "Search categories by transaction pattern",
        url: `${baseUrl}/api/categories?searchTerm=Netflix&includeTransactions=true`,
        description: "Find categories containing specific transaction patterns"
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
      },
      categoryClassification: {
        description: "Automatic categorization of expenses into different types",
        types: {
          fixedCosts: {
            description: "Same amount every month",
            examples: ["Rent", "Subscriptions/Softwares", "Insurance"]
          },
          committedExpenses: {
            description: "Recurring but variable amounts", 
            examples: ["Utilities", "Financing", "Medical"]
          },
          variableCosts: {
            description: "Non-recurring expenses",
            examples: ["Groceries", "Entertainment", "Shopping"]
          }
        }
      },
      categoryExclusions: {
        description: "System categories automatically excluded from analysis",
        excludedCategories: ["Credit Account", "Bank Account", "Adjustment", "Sem Categoria"]
      }
    },

    useCases: [
      "Dashboard analytics and insights",
      "Transaction listing with filters", 
      "Category-based spending analysis",
      "Installment timeline visualization",
      "Fixed costs historical analysis",
      "Monthly/yearly spending breakdowns by category",
      "Budget planning and expense tracking",
      "Financial goal monitoring and progress tracking"
    ],

    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
  
  // Generate the Markdown content
  const markdown = `# Financial Control API

\`\`\`json
${JSON.stringify(documentation, null, 2)}
\`\`\`
`
  
  return markdown
})