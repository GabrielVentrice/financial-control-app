import { pgTable, serial, varchar, date, decimal, timestamp, text, index } from 'drizzle-orm/pg-core'

/**
 * Transactions table - stores all financial transactions
 * This mirrors the data structure from Google Sheets
 */
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  transactionId: varchar('transaction_id', { length: 100 }).unique().notNull(),
  date: date('date').notNull(),
  origin: varchar('origin', { length: 255 }),
  destination: varchar('destination', { length: 255 }),
  description: text('description'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  person: varchar('person', { length: 50 }),
  recordedAt: timestamp('recorded_at'),
  remoteId: varchar('remote_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  dateIdx: index('transactions_date_idx').on(table.date),
  personIdx: index('transactions_person_idx').on(table.person),
  destinationIdx: index('transactions_destination_idx').on(table.destination),
}))

/**
 * Budgets table - stores monthly budgets per category
 */
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  person: varchar('person', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  categoryMonthIdx: index('budgets_category_month_idx').on(table.category, table.month),
}))

/**
 * Debt payoff plans — currently the cheque especial.
 *
 * An overdraft balance is a bank *state*, not a transaction, so it can never be
 * read out of the ledger. What lives here is the anchor: the balance the user
 * confirmed on a given day. Everything after that day is derived from the
 * account's own movements, so each sync moves the number without anyone
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

/**
 * Sync metadata table - tracks last sync from Google Sheets
 */
export const syncMetadata = pgTable('sync_metadata', {
  id: serial('id').primaryKey(),
  lastSyncAt: timestamp('last_sync_at').notNull(),
  transactionCount: serial('transaction_count').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'success' | 'error'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Type exports for use in application code
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type DebtPlan = typeof debtPlans.$inferSelect
export type NewDebtPlan = typeof debtPlans.$inferInsert
export type SyncMetadata = typeof syncMetadata.$inferSelect
