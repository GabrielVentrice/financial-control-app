import { pgTable, serial, varchar, date, decimal, timestamp, integer, boolean, text } from 'drizzle-orm/pg-core'

/**
 * Three tables, and all hold the same kind of thing: app state that the ledger
 * cannot contain. Transactions themselves are read straight from the Bkper API
 * into an in-memory snapshot (server/utils/bookSnapshot.ts) — the Postgres
 * mirror of the book, its sync metadata and the never-used budgets table are
 * gone.
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

/**
 * Monthly spending targets, one row per category.
 *
 * The ledger says what was spent; nothing in it says what *should* be spent.
 * That half of the budget is a decision, so it lives here — the same reason
 * `debt_plans` exists.
 *
 * Targets are RECURRING, not per-month: the budget is a standing agreement with
 * yourself, and asking for sixteen numbers again every 1st of the month is how
 * budgets get abandoned. A per-month override can be layered on later if a
 * month ever genuinely needs different numbers.
 *
 * `category` matches the ledger's own destination names ("Supermarket",
 * "Transportation"), so a target joins to spending without a mapping table.
 */
export const budgetTargets = pgTable('budget_targets', {
  id: serial('id').primaryKey(),
  /** Ledger destination name, or one of the synthetic keys in shared/monthBudget.ts. */
  category: varchar('category', { length: 120 }).notNull().unique(),
  /** What this category is allowed to cost in a month. */
  monthlyAmount: decimal('monthly_amount', { precision: 12, scale: 2 }).notNull(),
  /** Display order, so the budget reads top-down the way it was decided. */
  sortOrder: integer('sort_order').notNull().default(0),
  /** Retired targets stay for history instead of being deleted. */
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type BudgetTarget = typeof budgetTargets.$inferSelect
export type NewBudgetTarget = typeof budgetTargets.$inferInsert

/**
 * The morning briefing, one row per day.
 *
 * Written by the `financas-diario` skill through `POST /api/briefing`, read by
 * the main screen. It is judgement, not data — the ledger cannot contain it, so
 * it lives here for the same reason the other two tables do.
 *
 * Created on first use (server/utils/briefing.ts) as well as by `db:push`, so a
 * deploy never depends on someone remembering to migrate before the first
 * morning run.
 */
export const dailyBriefings = pgTable('daily_briefings', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  verdict: varchar('verdict', { length: 20 }).notNull(),
  headline: varchar('headline', { length: 140 }).notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export type DailyBriefing = typeof dailyBriefings.$inferSelect
