import type { Transaction } from '~/types/transaction'

/**
 * Bkper REST API client — the source of truth for transactions.
 *
 * The app used to read the Google Sheet that Bkper's own bot writes into, which
 * meant every number depended on a mirror that lags the ledger and drops
 * whatever the bot has not written yet. This reads the ledger itself.
 *
 * Docs: https://bkper.com/docs/api/rest
 */

const BKPER_API = 'https://api.bkper.app/v5'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

/** Bkper caps a page well below this; it is a ceiling, not a promise. */
const PAGE_SIZE = 200

/** A book of ~4k transactions paginates in ~22 pages; the cap only stops a runaway loop. */
const MAX_PAGES = 500

interface BkperAccount {
  id?: string
  name?: string
}

interface BkperTransaction {
  id?: string
  date?: string
  description?: string
  amount?: string
  creditAccount?: BkperAccount
  debitAccount?: BkperAccount
  remoteIds?: string[]
  createdAt?: string
  trashed?: boolean
}

interface BkperConfig {
  bookId: string
  refreshToken: string
  clientId: string
  clientSecret: string
  apiKey?: string
}

const REQUIRED_CONFIG = {
  bookId: 'NUXT_BKPER_BOOK_ID',
  refreshToken: 'NUXT_BKPER_REFRESH_TOKEN',
  clientId: 'NUXT_BKPER_CLIENT_ID',
  clientSecret: 'NUXT_BKPER_CLIENT_SECRET',
} as const

function readConfig(): BkperConfig {
  const { bkper } = useRuntimeConfig()
  const missing = Object.entries(REQUIRED_CONFIG)
    .filter(([key]) => !bkper?.[key as keyof BkperConfig])
    .map(([, envVar]) => envVar)

  if (missing.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Bkper is not configured',
      data: `Faltando no ambiente: ${missing.join(', ')}`,
    })
  }

  return bkper as BkperConfig
}

/**
 * Access tokens live an hour; a warm serverless instance reuses one across
 * requests instead of paying an OAuth round-trip per call.
 */
let cachedToken: { value: string; expiresAt: number } | null = null

/**
 * Bkper authenticates with a Google OAuth2 access token, and there is no
 * service-account path: the token has to identify a user account with access to
 * the book. So we keep the refresh token the `bkper auth login` device flow
 * hands out and mint access tokens from it — the only shape of this that works
 * unattended, which is what the daily cron needs.
 */
async function getAccessToken(config: BkperConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  try {
    const response = await $fetch<{ access_token: string; expires_in: number }>(
      GOOGLE_TOKEN_ENDPOINT,
      {
        method: 'POST',
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: config.refreshToken,
          grant_type: 'refresh_token',
        }),
      }
    )

    cachedToken = {
      value: response.access_token,
      expiresAt: Date.now() + response.expires_in * 1000,
    }
    return cachedToken.value
  } catch (error: any) {
    cachedToken = null
    throw createError({
      statusCode: 401,
      statusMessage: 'Bkper authentication failed',
      data:
        'O refresh token do Bkper foi recusado. Rode `bkper auth login` e atualize NUXT_BKPER_REFRESH_TOKEN.',
      cause: error,
    })
  }
}

async function bkperGet<T>(
  config: BkperConfig,
  path: string,
  options: { query?: Record<string, string | number>; cursor?: string } = {}
): Promise<T> {
  const token = await getAccessToken(config)

  return await $fetch<T>(`${BKPER_API}${path}`, {
    query: {
      ...options.query,
      ...(config.apiKey ? { key: config.apiKey } : {}),
    },
    headers: {
      Authorization: `Bearer ${token}`,
      // Pagination rides on a header, not a query param — passing the cursor as
      // a query param is silently ignored and every page comes back identical.
      ...(options.cursor ? { cursor: options.cursor } : {}),
    },
  })
}

/**
 * Transactions reference accounts by id only, so the names the whole app filters
 * on ("Credit Card Gabriel", "Food") have to come from this one extra call.
 */
async function fetchAccountNames(config: BkperConfig): Promise<Map<string, string>> {
  const { items } = await bkperGet<{ items?: BkperAccount[] }>(
    config,
    `/books/${config.bookId}/accounts`
  )

  const names = new Map<string, string>()
  for (const account of items || []) {
    if (account.id && account.name) names.set(account.id, account.name)
  }
  return names
}

/**
 * Bkper's double entry maps onto the ledger the app already speaks: money
 * leaves the credit account (origin) and lands in the debit account
 * (destination). Either side can be missing on an uncategorized draft — about
 * half the book — so both degrade to an empty string rather than dropping the
 * row.
 */
export function mapBkperTransactions(
  items: BkperTransaction[],
  accountNames: Map<string, string>
): Transaction[] {
  const nameOf = (account?: BkperAccount): string => {
    if (!account) return ''
    if (account.name) return account.name
    return (account.id && accountNames.get(account.id)) || ''
  }

  return items
    .filter(item => !item.trashed && item.id && item.date)
    .map(item => ({
      transactionId: item.id!,
      date: item.date!, // Bkper serializes dates as YYYY-MM-DD already
      origin: nameOf(item.creditAccount),
      destination: nameOf(item.debitAccount),
      description: item.description || '',
      amount: parseFloat(item.amount || '0') || 0,
      recordedAt: item.createdAt ? new Date(Number(item.createdAt)).toISOString() : '',
      remoteId: item.remoteIds?.[0] || '',
    }))
}

/**
 * Every transaction in the book, oldest cursor page to newest.
 */
export async function fetchTransactionsFromBkper(): Promise<Transaction[]> {
  const config = readConfig()
  const accountNames = await fetchAccountNames(config)

  const items: BkperTransaction[] = []
  let cursor: string | undefined
  let pages = 0

  do {
    const page = await bkperGet<{ items?: BkperTransaction[]; cursor?: string }>(
      config,
      `/books/${config.bookId}/transactions`,
      { query: { limit: PAGE_SIZE }, cursor }
    )

    items.push(...(page.items || []))
    cursor = page.cursor || undefined
    pages++
  } while (cursor && pages < MAX_PAGES)

  if (cursor) {
    console.warn(`[Bkper] Stopped at ${MAX_PAGES} pages with a cursor still open`)
  }

  return mapBkperTransactions(items, accountNames)
}
