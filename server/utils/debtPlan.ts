import { getDb, debtPlans, type DebtPlan } from '../database'
import {
  projectPayoff,
  capacityForMonth,
  costOfDoingNothing,
  paymentToClearIn,
  type PayoffResult,
} from '../../shared/debt'
import { currentMonthKey, monthKeyToIdx } from '../../shared/dates'
import {
  movementSince,
  interestHistory,
  cashflowMedian,
  installmentLoad,
} from '../../shared/debtAnalytics'
import type { Transaction } from '~/types/transaction'

/** Defaults for a first run, so the screen has something true to show. */
export const DEFAULT_PLAN = {
  name: 'Cheque Especial',
  account: 'Bank Account Gabriel',
  /**
   * 3,1% a.m. — the middle of what the ledger implies. Twelve months of
   * "JUROS LIMITE DA CONTA" charges divided by the reconstructed average
   * balance lands between roughly 2,5% and 3,5% depending on the month, and the
   * reconstruction is noisy enough that a single decimal would be false
   * precision. The user can set the real rate from the bank statement.
   */
  monthlyRate: 0.031,
  monthlyCut: 0,
}

export interface DebtSnapshot {
  plan: {
    id: number | null
    name: string
    account: string
    monthlyRate: number
    monthlyCut: number
    targetMonth: string | null
    anchorBalance: number
    anchorDate: string
  }
  /** Debt today: the anchor plus every movement on the account since. */
  currentBalance: number
  /** How much the balance moved since the anchor (negative = debt grew). */
  movedSinceAnchor: number
  /** Monthly interest actually charged, most recent last. */
  interestHistory: { monthKey: string; amount: number }[]
  interestLast12m: number
  /** Recurring cash flow, from the last full months of real movement. */
  cashflow: { income: number; outflow: number; surplus: number; months: number }
  /** Installment load per month going forward. */
  installmentsByMonth: Record<string, number>
  /** Month-by-month payoff under the current plan. */
  projection: PayoffResult
  /** Interest paid over the next 12 months if nothing changes. */
  costOfInaction: number
  /** What it would take to hit `targetMonth`, when one is set. */
  targetPayment: number | null
  /** Capacity available this month. */
  capacityNow: number
}

const num = (v: unknown): number => Number(v ?? 0)

/** Reads the single active plan, or null when none has been configured yet. */
export async function readPlan(): Promise<DebtPlan | null> {
  const db = getDb()
  const rows = await db.select().from(debtPlans).limit(1)
  return rows[0] ?? null
}

/**
 * Assembles everything the debt screen needs from the raw Bkper snapshot.
 *
 * RAW on purpose: the installment-expanded pipeline carries projected rows,
 * and a projected row counting as real account movement would move the debt
 * balance out of thin air. The math itself lives in shared/debtAnalytics.ts.
 */
export function buildDebtSnapshot(
  plan: DebtPlan,
  transactions: Transaction[]
): DebtSnapshot {
  const account = plan.account
  const anchorBalance = num(plan.anchorBalance)
  const anchorDate = String(plan.anchorDate).slice(0, 10)
  const monthlyRate = num(plan.monthlyRate)
  const monthlyCut = num(plan.monthlyCut)

  const moved = movementSince(transactions, account, anchorDate)
  const interest = interestHistory(transactions, account)
  // Six months: long enough for the median to shrug off a windfall or a
  // salary-timing artefact, short enough to still describe how you live now.
  const cashflow = cashflowMedian(transactions, account, 6)
  const installmentsByMonth = installmentLoad(transactions, plan.person, 60)

  // Anchor is stored positive; a positive net movement pays the debt down.
  const currentBalance = Math.max(0, anchorBalance - moved)

  const startMonth = currentMonthKey()
  const projection = projectPayoff({
    balance: currentBalance,
    monthlyRate,
    startMonth,
    baseSurplus: cashflow.surplus,
    installmentsByMonth,
    monthlyCut,
  })

  const cutoff = monthKeyToIdx(startMonth) - 12
  const interestLast12m = interest
    .filter(h => monthKeyToIdx(h.monthKey) >= cutoff)
    .reduce((sum, h) => sum + h.amount, 0)

  const targetPayment = plan.targetMonth
    ? paymentToClearIn(
        currentBalance,
        monthlyRate,
        Math.max(1, monthKeyToIdx(plan.targetMonth) - monthKeyToIdx(startMonth) + 1)
      )
    : null

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      account,
      monthlyRate,
      monthlyCut,
      targetMonth: plan.targetMonth,
      anchorBalance,
      anchorDate,
    },
    currentBalance,
    movedSinceAnchor: moved,
    interestHistory: interest,
    interestLast12m,
    cashflow,
    installmentsByMonth,
    projection,
    costOfInaction: costOfDoingNothing(currentBalance, monthlyRate, 12),
    targetPayment,
    capacityNow: capacityForMonth(startMonth, {
      startMonth,
      baseSurplus: cashflow.surplus,
      installmentsByMonth,
      monthlyCut,
    }),
  }
}
