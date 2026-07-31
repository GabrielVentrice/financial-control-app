import { and, eq, gte, lte, ilike, desc } from 'drizzle-orm'
import type { Transaction, TransactionQueryParams } from '~/types/transaction'
import { fetchTransactionsFromGoogleSheets } from './googleSheets'
import { enrichTransactionsWithPerson } from './personIdentifier'
import { processInstallments } from './installmentProcessor'
import { applyFilters } from './transactionFilters'
import {
  isCacheValid,
  readCache,
  writeCache,
  updateCacheMetadata,
  cacheExists,
} from './cacheManager'

/**
 * The single read path for transactions, shared by /api/transactions and
 * /api/categories.
 *
 * /api/categories used to fetch straight from Google Sheets on every request
 * while everything else read Postgres, so the budget screens could show numbers
 * that disagreed with the rest of the app (and paid a full Sheets round-trip
 * per call). Both now go through here.
 */

let dbModule: typeof import('../database') | null = null
async function getDb() {
  if (!dbModule && process.env.DATABASE_URL) {
    dbModule = await import('../database')
  }
  return dbModule
}

export async function loadTransactions(
  query: TransactionQueryParams
): Promise<Transaction[]> {
  const shouldProcessInstallments =
    query.processInstallments !== 'false' && query.processInstallments !== false

  // Expanding a series needs its "01/XX" anchor row, which a date filter may
  // well exclude — so when we're going to expand, we fetch without the date
  // window and re-apply it after. Filtering before expanding silently dropped
  // whole installment series from any date-scoped request.
  const deferDateFilter = shouldProcessInstallments && Boolean(query.startDate || query.endDate)
  const fetchQuery: TransactionQueryParams = deferDateFilter
    ? { ...query, startDate: undefined, endDate: undefined }
    : query

  const db = await getDb()
  let transactions = db
    ? await fetchFromDatabase(db, fetchQuery)
    : enrichTransactionsWithPerson(await fetchFromGoogleSheetsWithCache())

  if (shouldProcessInstallments) {
    transactions = processInstallments(transactions)
  }

  // The Sheets path fetches everything, so it always needs the full filter pass.
  // The DB path already applied everything except a deferred date window.
  if (!db) {
    transactions = applyFilters(transactions, query)
  } else if (deferDateFilter) {
    transactions = applyFilters(transactions, {
      startDate: query.startDate,
      endDate: query.endDate,
    })
  }

  return transactions
}

async function fetchFromDatabase(
  db: typeof import('../database'),
  query: TransactionQueryParams
): Promise<Transaction[]> {
  const { db: client, transactions: transactionsTable } = db

  const conditions = []
  if (query.person && query.person !== 'Ambos') {
    conditions.push(eq(transactionsTable.person, query.person))
  }
  if (query.startDate) conditions.push(gte(transactionsTable.date, query.startDate))
  if (query.endDate) conditions.push(lte(transactionsTable.date, query.endDate))
  if (query.searchTerm) conditions.push(ilike(transactionsTable.description, `%${query.searchTerm}%`))
  if (query.origin) conditions.push(ilike(transactionsTable.origin, `%${query.origin}%`))
  if (query.destination) conditions.push(ilike(transactionsTable.destination, `%${query.destination}%`))

  const rows = await client
    .select()
    .from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionsTable.date))

  return rows.map(t => ({
    transactionId: t.transactionId,
    date: t.date, // Already YYYY-MM-DD
    origin: t.origin || '',
    destination: t.destination || '',
    description: t.description || '',
    amount: parseFloat(t.amount),
    recordedAt: t.recordedAt?.toISOString() || '',
    remoteId: t.remoteId || '',
    person: (t.person as Transaction['person']) || null,
  }))
}

/** Legacy path for when DATABASE_URL isn't set. */
async function fetchFromGoogleSheetsWithCache(): Promise<Transaction[]> {
  const config = useRuntimeConfig()
  const cacheConfig = config.cache
  const spreadsheetId = config.public.googleSpreadsheetId

  if (!cacheConfig.enabled) {
    return fetchTransactionsFromGoogleSheets()
  }

  if ((await cacheExists()) && (await isCacheValid())) {
    return readCache()
  }

  const transactions = await fetchTransactionsFromGoogleSheets()
  await writeCache(transactions)
  await updateCacheMetadata(transactions.length, 'fresh', spreadsheetId, cacheConfig.ttlMinutes)
  return transactions
}
