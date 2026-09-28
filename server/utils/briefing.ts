import { desc, sql } from 'drizzle-orm'
import { getDb, dailyBriefings, type DailyBriefing } from '../database'
import type { Briefing, BriefingVerdict } from '../../shared/briefing'

let tableReady: Promise<unknown> | null = null

/**
 * Creates the table the first time an instance touches it.
 *
 * Mirrors the Drizzle definition in schema.ts. It exists because the writer is
 * a morning cron: a deploy that shipped before `db:push` ran would otherwise
 * fail silently every day until someone opened the app and wondered why the
 * briefing was a week old.
 */
function ensureTable() {
  tableReady ??= getDb()
    .execute(sql`
      CREATE TABLE IF NOT EXISTS daily_briefings (
        id serial PRIMARY KEY,
        date date NOT NULL UNIQUE,
        verdict varchar(20) NOT NULL,
        headline varchar(140) NOT NULL,
        body text NOT NULL,
        created_at timestamp DEFAULT now()
      )
    `)
    .catch((error) => {
      tableReady = null
      throw error
    })
  return tableReady
}

const toBriefing = (row: DailyBriefing): Briefing => ({
  date: row.date,
  verdict: row.verdict as BriefingVerdict,
  headline: row.headline,
  body: row.body,
  createdAt: row.createdAt?.toISOString(),
})

export async function readLatestBriefing(): Promise<Briefing | null> {
  await ensureTable()
  const [row] = await getDb()
    .select()
    .from(dailyBriefings)
    .orderBy(desc(dailyBriefings.date))
    .limit(1)

  return row ? toBriefing(row) : null
}

/** Upsert by date: running the skill twice in a morning replaces the first take. */
export async function saveBriefing(briefing: Briefing): Promise<Briefing> {
  await ensureTable()
  const values = {
    date: briefing.date,
    verdict: briefing.verdict,
    headline: briefing.headline,
    body: briefing.body,
  }

  const [row] = await getDb()
    .insert(dailyBriefings)
    .values(values)
    .onConflictDoUpdate({
      target: dailyBriefings.date,
      set: { ...values, createdAt: sql`now()` },
    })
    .returning()

  return toBriefing(row)
}
