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

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database not configured',
      data: 'DATABASE_URL não está definida neste ambiente. Sem ela o app lê direto da planilha e a sincronização com o Postgres não acontece.',
    })
  }

  if (!client) {
    client = drizzle(neon(process.env.DATABASE_URL), { schema })
  }

  return client
}

/**
 * Back-compat for `import { db } from '../database'`: forwards property access
 * to the lazily-built client, so existing call sites keep working unchanged.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_target, prop) => Reflect.get(getDb() as object, prop),
})

// Re-export schema for convenience
export * from './schema'
