export interface Transaction {
  transactionId: string
  date: string
  origin: string
  destination: string
  description: string
  amount: number
  recordedAt: string
  remoteId: string
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
