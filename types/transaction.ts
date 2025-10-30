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
