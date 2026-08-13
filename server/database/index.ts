import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Neon client over HTTP, the right shape for serverless functions.
 *
 * Built lazily on purpose. This used to run at module scope, so merely
 * *importing* this file threw when DATABASE_URL was unset — and since
 * `/api/sync` imports it transitively, the endpoint answered a bare 500 in
 * ~0.5s with nothing in the logs to say why. Meanwhile the read path caught the
 * missing variable and quietly fell back to Google Sheets, so the app looked
 * healthy while the whole Postgres layer was dead. Importing is now free; only
 * touching the database needs the variable, and the error says which one.
 */
let client: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database not configured',
      data: 'DATABASE_URL não está definida neste ambiente. O plano de dívida (debt_plans) mora no Postgres; sem ela a tela de dívida não funciona.',
    })
  }

  if (!client) {
    client = drizzle(neon(process.env.DATABASE_URL), { schema })
  }

  return client
}

// Re-export schema for convenience
export * from './schema'
