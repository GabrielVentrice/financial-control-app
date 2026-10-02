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
async function migrate() {
  const db = getDb()
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS daily_briefings (
      id serial PRIMARY KEY,
      date date NOT NULL UNIQUE,
      verdict varchar(20) NOT NULL,
      headline varchar(240) NOT NULL,
      highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
      items jsonb NOT NULL DEFAULT '[]'::jsonb,
      body text,
      created_at timestamp DEFAULT now()
    )
  `)
  // Tables created before the triage format: widen the headline, add the
  // structured columns and let the legacy body go empty.
  await db.execute(sql`ALTER TABLE daily_briefings ALTER COLUMN headline TYPE varchar(240)`)
  await db.execute(sql`ALTER TABLE daily_briefings ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb`)
  await db.execute(sql`ALTER TABLE daily_briefings ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb`)
  await db.execute(sql`ALTER TABLE daily_briefings ALTER COLUMN body DROP NOT NULL`)
}

function ensureTable() {
  tableReady ??= migrate()
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
  highlights: row.highlights ?? [],
  items: row.items ?? [],
  ...(row.body && { body: row.body }),
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
    highlights: briefing.highlights,
    items: briefing.items,
    body: briefing.body ?? null,
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
