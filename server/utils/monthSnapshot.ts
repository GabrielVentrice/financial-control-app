import { eq, asc } from 'drizzle-orm'
import { getDb, budgetTargets, type BudgetTarget as BudgetTargetRow } from '../database'
import { readPlan } from './debtPlan'
import { movementSince } from '../../shared/debtAnalytics'
import { currentMonthKey } from '../../shared/dates'
import {
  paceOf,
  incomeOf,
  buildBudgetLines,
  monthTotals,
  paceSignal,
  type BudgetTarget,
  type BudgetLine,
  type MonthPace,
  type MonthTotals,
} from '../../shared/monthBudget'
import {
  MOVE_PLAN,
  PLAN_TASKS,
  PLAN_ARTIFACT_URL,
  milestoneFor,
  type PlanMilestone,
  type PlanTask,
} from '../../shared/movePlan'
import type { Transaction } from '~/types/transaction'

/**
 * Everything the month screen needs, in one payload.
 *
 * Same shape of contract as server/utils/debtPlan.ts: a small async part that
 * touches the database, and a pure synchronous builder that does the work. The
 * builder is where the numbers come from, and it can be tested without a
 * database, a network or a browser.
 */

export interface MonthSnapshot {
  monthKey: string
  pace: MonthPace
  totals: MonthTotals
  lines: BudgetLine[]
  signal: ReturnType<typeof paceSignal>
  plan: {
    milestone: PlanMilestone | null
    /** Money in the account right now, derived from the debt anchor. Null without a debt plan. */
    actualCash: number | null
    /** actualCash − milestone.targetCash, when both exist. */
    cashDelta: number | null
    housingTarget: number
    reserveGoal: number
    moveMonth: string
    tasks: PlanTask[]
    artifactUrl: string
  }
}

const num = (v: unknown): number => Number(v ?? 0)

/**
 * The budget the plan of 04/09/2026 arrived at, keyed by the ledger's own
 * category names so a target joins to spending with no mapping table.
 *
 * Seeded once, on the first read of an empty table — a budget screen that opens
 * empty asks for sixteen decisions before it shows anything, and that is the
 * version of this screen that never gets used twice. Every number is editable
 * from the screen afterwards.
 *
 * Three lines from the plan are deliberately absent.
 *
 * `Rent` because the R$ 4.000 is a target for *after* the move: seeding it now
 * would credit R$ 4.000 of headroom every month against a bill that does not
 * exist yet, and the one number the screen must never overstate is how much is
 * left to spend. The commitment still lives in MOVE_PLAN.housingTarget, which
 * the plan strip shows. When rent starts hitting the ledger the category
 * appears in the untargeted list with a "definir" button.
 *
 * The R$ 450 loan repayment and the R$ 1.000 reserve transfer, because neither
 * has a ledger category of its own and inventing one would make the join lie.
 */
const SEED_TARGETS: Array<[string, number]> = [
  ['Utilities', 670],
  ['Supermarket', 800],
  ['Transportation', 600],
  ['Food', 400],
  ['Subscriptions/Softwares', 1_295],
  ['Financing', 368],
  ['Medical', 400],
  ['Entertainment', 300],
  ['Installments/Financing', 226],
  ['Home & Maintenance', 150],
  ['Clothing', 100],
  ['Gifts & Donations', 100],
  ['Taxes Due', 100],
  ['Personal care', 50],
]

const toTarget = (row: BudgetTargetRow): BudgetTarget => ({
  category: row.category,
  monthlyAmount: num(row.monthlyAmount),
  sortOrder: row.sortOrder,
})

/** Active targets in display order, seeding the plan's budget on an empty table. */
export async function readTargets(): Promise<BudgetTarget[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(budgetTargets)
    .where(eq(budgetTargets.active, true))
    .orderBy(asc(budgetTargets.sortOrder))

  if (rows.length > 0) return rows.map(toTarget)

  const seeded = await db
    .insert(budgetTargets)
    .values(
      SEED_TARGETS.map(([category, amount], i) => ({
        category,
        monthlyAmount: String(amount),
        sortOrder: i,
      }))
    )
    .returning()

  return seeded.map(toTarget).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Sets one category's target.
 *
 * Upsert by category rather than by id: the screen edits a line it is looking
 * at, and the category name is what identifies it on both sides of the join.
 * An amount of 0 retires the line without deleting its history.
 */
export async function saveTarget(category: string, monthlyAmount: number): Promise<BudgetTarget> {
  const db = getDb()
  const existing = await db
    .select()
    .from(budgetTargets)
    .where(eq(budgetTargets.category, category))
    .limit(1)

  if (existing[0]) {
    const [updated] = await db
      .update(budgetTargets)
      .set({ monthlyAmount: String(monthlyAmount), active: true, updatedAt: new Date() })
      .where(eq(budgetTargets.id, existing[0].id))
      .returning()
    return toTarget(updated)
  }

  const maxOrder = await db.select().from(budgetTargets)
  const [created] = await db
    .insert(budgetTargets)
    .values({
      category,
      monthlyAmount: String(monthlyAmount),
      sortOrder: maxOrder.length,
    })
    .returning()

  return toTarget(created)
}

/**
 * Cash in the account today, read off the debt plan's anchor.
 *
 * An account balance is a bank *state* and can never be read out of the ledger,
 * which is exactly the problem `debt_plans` already solved: the user confirmed
 * a balance on a date, and everything after it is account movement. Reusing
 * that anchor here means the two screens can never disagree about how much
 * money exists.
 *
 * RAW transactions on purpose — a projected installment counting as account
 * movement would move the balance out of thin air.
 */
export async function readActualCash(rawTransactions: Transaction[]): Promise<number | null> {
  const plan = await readPlan()
  if (!plan) return null

  const anchorDebt = num(plan.anchorBalance)
  const anchorDate = String(plan.anchorDate).slice(0, 10)
  const moved = movementSince(rawTransactions, plan.account, anchorDate)

  // The anchor is stored as debt (positive = owing), so cash is its negation.
  return moved - anchorDebt
}

export function buildMonthSnapshot(
  transactions: Transaction[],
  targets: BudgetTarget[],
  monthKey: string,
  actualCash: number | null,
  today: Date = new Date()
): MonthSnapshot {
  const pace = paceOf(monthKey, today)
  const lines = buildBudgetLines(transactions, monthKey, targets)
  const totals = monthTotals(lines, incomeOf(transactions, monthKey), pace)
  const milestone = milestoneFor(monthKey)

  return {
    monthKey,
    pace,
    totals,
    lines,
    signal: paceSignal(lines, pace),
    plan: {
      milestone,
      actualCash,
      cashDelta:
        actualCash !== null && milestone ? actualCash - milestone.targetCash : null,
      housingTarget: MOVE_PLAN.housingTarget,
      reserveGoal: MOVE_PLAN.reserveGoal,
      moveMonth: MOVE_PLAN.moveMonth,
      tasks: PLAN_TASKS,
      artifactUrl: PLAN_ARTIFACT_URL,
    },
  }
}

export { currentMonthKey }
