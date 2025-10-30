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
