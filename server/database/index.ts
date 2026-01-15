import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Creates a Neon database client using HTTP for serverless environments
 * This is the recommended approach for Vercel/Nuxt serverless functions
 */
function createDatabaseClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const sql = neon(databaseUrl)
  return drizzle(sql, { schema })
}

// Export the database client
// Note: In serverless, each request creates a new connection (HTTP-based)
export const db = createDatabaseClient()

// Re-export schema for convenience
export * from './schema'
