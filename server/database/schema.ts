import { pgTable, serial, varchar, date, decimal, timestamp } from 'drizzle-orm/pg-core'

/**
 * The only table left. Transactions are read straight from the Bkper API into
 * an in-memory snapshot (server/utils/bookSnapshot.ts) — the Postgres mirror
 * of the book, its sync metadata and the never-used budgets table are gone.
 *
 * NOTE: the old `transactions`, `budgets` and `sync_metadata` tables may still
 * exist in the database until `npm run db:push` is run against this slimmed
 * schema; leaving them there for a few days is the free rollback.
 */

/**
 * Debt payoff plans — currently the cheque especial.
 *
 * An overdraft balance is a bank *state*, not a transaction, so it can never be
 * read out of the ledger. What lives here is the anchor: the balance the user
 * confirmed on a given day. Everything after that day is derived from the
 * account's own movements, so each refresh moves the number without anyone
 * re-typing it. Re-anchor whenever the bank and the app disagree.
 */
export const debtPlans = pgTable('debt_plans', {
  id: serial('id').primaryKey(),
  /** Display name, e.g. "Cheque Especial". */
  name: varchar('name', { length: 100 }).notNull(),
  /** The ledger account this debt is attached to, e.g. "Bank Account Gabriel". */
  account: varchar('account', { length: 255 }).notNull(),
  /** Debt on the anchor date, stored POSITIVE. */
  anchorBalance: decimal('anchor_balance', { precision: 12, scale: 2 }).notNull(),
  anchorDate: date('anchor_date').notNull(),
  /** Monthly interest rate as a decimal (0.0310 = 3,10% a.m.). */
  monthlyRate: decimal('monthly_rate', { precision: 6, scale: 4 }).notNull(),
  /** Extra monthly cut the user commits to, on top of the natural surplus. */
  monthlyCut: decimal('monthly_cut', { precision: 12, scale: 2 }).notNull().default('0'),
  /** Optional "YYYY-MM" goal, for the "what would it take" reading. */
  targetMonth: varchar('target_month', { length: 7 }),
  person: varchar('person', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type DebtPlan = typeof debtPlans.$inferSelect
export type NewDebtPlan = typeof debtPlans.$inferInsert
