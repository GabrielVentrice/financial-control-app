export interface Transaction {
  transactionId: string
  date: string
  origin: string
  destination: string
  description: string
  amount: number
  recordedAt: string
  remoteId: string
  person?: 'Juliana' | 'Gabriel' | null // Auto-identified person
}

export interface SheetRow {
  'Transaction Id': string
  'Date': string
  'Origin': string
  'Destination': string
  'Description': string
  'Amount': string
  'Recorded at': string
  'Remote Id': string
}

export interface SpreadsheetConfig {
  spreadsheetId: string
  sheetName: string
  range: string
}

// API Query Parameters
export interface TransactionQueryParams {
  person?: 'Juliana' | 'Gabriel' | 'Ambos'
  startDate?: string
  endDate?: string
  processInstallments?: boolean | string
  searchTerm?: string
  origin?: string
  destination?: string
}

// Installment-related types
export interface InstallmentInfo {
  current: number
  total: number
  description: string
}

// Analytics types (for potential future API endpoints)
export interface CategorySummary {
  name: string
  total: number
  count: number
  percentage: number
}

export interface MonthlyStats {
  income: number
  expenses: number
  balance: number
  transactionCount: number
}

export interface Alert {
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
  amount?: number
}

// Categories API types
export interface CategoryData {
  name: string
  count: number
  total: number
  percentage: number
  average: number
  transactions: Transaction[]
}

export interface CategoryTotals {
  variableCosts: number
  fixedCosts: number
  committedExpenses: number
  total: number
  categoryCounts: {
    fixedCosts: number
    committedExpenses: number
  }
}

export interface CategoriesResponse {
  categories: CategoryData[]
  totals: CategoryTotals
  config?: {
    excludedCategories: string[]
    fixedCostCategories: string[]
    committedExpenseCategories: string[]
  }
}

export interface CategoriesQueryParams extends TransactionQueryParams {
  includeTransactions?: boolean | string // Whether to include individual transactions in response
}

// Budget types
export interface Budget {
  id: string // Unique identifier (category-month-year-person)
  category: string // Category name (from destination field)
  person: 'Juliana' | 'Gabriel' // Person the budget belongs to
  month: number // Month (1-12)
  year: number // Year (YYYY)
  amount: number // Budget amount
  createdAt?: string // Creation timestamp
  updatedAt?: string // Last update timestamp
}

export interface BudgetSheetRow {
  'Category': string
  'Person': string // Juliana or Gabriel
  'Month': string // MM format
  'Year': string // YYYY format
  'Amount': string
  'Created At': string
  'Updated At': string
}

export interface BudgetQueryParams {
  category?: string // Filter by category
  person?: 'Juliana' | 'Gabriel' // Filter by person
  month?: string // Filter by month (MM or M)
  year?: string // Filter by year (YYYY)
  startDate?: string // Start date for filtering (YYYY-MM-DD)
  endDate?: string // End date for filtering (YYYY-MM-DD)
}

export interface BudgetInput {
  category: string
  person: 'Juliana' | 'Gabriel' // Person the budget belongs to
  month: number // 1-12
  year: number // YYYY
  amount: number
}

export interface BudgetsResponse {
  budgets: Budget[]
  totalBudgeted: number
  totalByPerson: {
    Juliana: number
    Gabriel: number
  }
  categories: string[] // List of categories with budgets
}
