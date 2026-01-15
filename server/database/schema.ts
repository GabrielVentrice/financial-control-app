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
export type SyncMetadata = typeof syncMetadata.$inferSelect
