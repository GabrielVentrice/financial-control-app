import { and, eq, gt, sql as raw } from 'drizzle-orm'
import { getDb, debtPlans, transactions, type DebtPlan } from '../database'
import {
  projectPayoff,
  capacityForMonth,
  costOfDoingNothing,
  paymentToClearIn,
  type PayoffResult,
} from '../../shared/debt'
import { currentMonthKey, monthKeyToIdx, idxToMonthKey } from '../../shared/dates'
import { parseInstallment } from '../../shared/installments'

/**
 * The row that duplicates a real card payment. The sheet records the automatic
 * card debit twice — once as a transfer to the card, once as the invoice itself
 * — so counting both would double every month's outflow and make the account
 * look far worse than it is. Same exclusion the expense rules use.
 */
const DUPLICATE_DESCRIPTION = 'pagamento debito automatico'

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
 * Net movement on the account strictly AFTER the anchor date.
 *
 * "After", not "on or after", on purpose: the anchor is a closing balance for
 * its own day, so replaying that day's transactions would count them twice.
 */
async function movementSince(account: string, anchorDate: string): Promise<number> {
  const db = getDb()
  const [row] = await db
    .select({
      inflow: raw<string>`coalesce(sum(case when ${transactions.destination} = ${account} then ${transactions.amount}::numeric else 0 end), 0)`,
      outflow: raw<string>`coalesce(sum(case when ${transactions.origin} = ${account} and lower(coalesce(${transactions.description}, '')) <> ${DUPLICATE_DESCRIPTION} then ${transactions.amount}::numeric else 0 end), 0)`,
    })
    .from(transactions)
    .where(gt(transactions.date, anchorDate))

  return num(row?.inflow) - num(row?.outflow)
}

/** Interest actually charged on the account, by month. */
async function readInterestHistory(account: string) {
  const db = getDb()
  const rows = await db
    .select({
      monthKey: raw<string>`to_char(${transactions.date}, 'YYYY-MM')`,
      amount: raw<string>`sum(${transactions.amount}::numeric)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.origin, account),
        raw`lower(coalesce(${transactions.description}, '')) ~ 'juros'`
      )
    )
    .groupBy(raw`to_char(${transactions.date}, 'YYYY-MM')`)
    .orderBy(raw`to_char(${transactions.date}, 'YYYY-MM')`)

  return rows.map(r => ({ monthKey: r.monthKey, amount: num(r.amount) }))
}

const median = (xs: number[]): number => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Recurring cash flow, measured over whole months that already closed.
 *
 * The MEDIAN month, not the average — and that distinction decides whether the
 * plan is honest. Averaging the last months here quietly folded a one-off tax
 * refund into the monthly surplus and reported R$ 1.265/mês of recurring room
 * that does not exist; the plan then promised a payoff date funded by a windfall
 * that already happened once. The median ignores that month, and equally
 * ignores the mirror-image artefact where a salary paid on the 30th leaves the
 * following month looking like it earned nothing.
 *
 * The current month is excluded entirely because it is half-lived: the salary
 * has landed but the card bill and the boletos have not, so it would always
 * read as a surplus that evaporates by the 15th.
 */
async function readCashflow(account: string, months: number) {
  const db = getDb()
  const endIdx = monthKeyToIdx(currentMonthKey())
  const startKey = idxToMonthKey(endIdx - months)

  const rows = await db
    .select({
      monthKey: raw<string>`to_char(${transactions.date}, 'YYYY-MM')`,
      inflow: raw<string>`coalesce(sum(case when ${transactions.destination} = ${account} then ${transactions.amount}::numeric else 0 end), 0)`,
      outflow: raw<string>`coalesce(sum(case when ${transactions.origin} = ${account} and lower(coalesce(${transactions.description}, '')) <> ${DUPLICATE_DESCRIPTION} then ${transactions.amount}::numeric else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        raw`to_char(${transactions.date}, 'YYYY-MM') >= ${startKey}`,
        raw`to_char(${transactions.date}, 'YYYY-MM') < ${currentMonthKey()}`
      )
    )
    .groupBy(raw`to_char(${transactions.date}, 'YYYY-MM')`)
    .orderBy(raw`to_char(${transactions.date}, 'YYYY-MM')`)

  const monthly = rows.map(r => ({ income: num(r.inflow), outflow: num(r.outflow) }))

  return {
    income: median(monthly.map(m => m.income)),
    outflow: median(monthly.map(m => m.outflow)),
    surplus: median(monthly.map(m => m.income - m.outflow)),
    months: monthly.length,
  }
}

/**
 * Installment load per month going forward.
 *
 * Derived from the installment NUMBER, not from counting the months the data
 * carries — the sheet clusters a whole series on one date, so month-counting
 * would report finished series as active and miss the roll-off entirely. Same
 * anchoring rule the installments page uses.
 */
async function readInstallmentLoad(person: string | null, horizon: number) {
  const db = getDb()
  const rows = await db
    .select({
      monthKey: raw<string>`to_char(${transactions.date}, 'YYYY-MM')`,
      origin: transactions.origin,
      description: transactions.description,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(raw`${transactions.description} ~ '[0-9]{2}/[0-9]{2}' and lower(coalesce(${transactions.origin}, '')) like '%credit card%'`)

  const series = new Map<string, { total: number; start: number; amount: number; anchorNum: number }>()
  for (const r of rows) {
    if (person && r.origin && !r.origin.toLowerCase().includes(person.toLowerCase())) continue
    const info = parseInstallment(r.description || '')
    if (!info) continue

    const key = `${info.description.toLowerCase()}_${r.origin}_${info.total}`
    const prev = series.get(key)
    // Anchor on the LOWEST-numbered row present: it is the one that pins when
    // installment #1 was due, and therefore when the series ends.
    if (prev && prev.anchorNum <= info.current) continue

    series.set(key, {
      total: info.total,
      start: monthKeyToIdx(r.monthKey) - (info.current - 1),
      amount: Math.abs(num(r.amount)),
      anchorNum: info.current,
    })
  }

  const refIdx = monthKeyToIdx(currentMonthKey())
  const byMonth: Record<string, number> = {}
  for (let i = 0; i < horizon; i++) byMonth[idxToMonthKey(refIdx + i)] = 0

  for (const s of series.values()) {
    for (let i = 0; i < horizon; i++) {
      const mi = refIdx + i
      if (mi >= s.start && mi < s.start + s.total) byMonth[idxToMonthKey(mi)] += s.amount
    }
  }
  return byMonth
}

/** Assembles everything the debt screen needs, from a single read pass. */
export async function buildDebtSnapshot(plan: DebtPlan): Promise<DebtSnapshot> {
  const account = plan.account
  const anchorBalance = num(plan.anchorBalance)
  const anchorDate = String(plan.anchorDate).slice(0, 10)
  const monthlyRate = num(plan.monthlyRate)
  const monthlyCut = num(plan.monthlyCut)

  const [moved, interestHistory, cashflow, installmentsByMonth] = await Promise.all([
    movementSince(account, anchorDate),
    readInterestHistory(account),
    // Six months: long enough for the median to shrug off a windfall or a
    // salary-timing artefact, short enough to still describe how you live now.
    readCashflow(account, 6),
    readInstallmentLoad(plan.person, 60),
  ])

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
  const interestLast12m = interestHistory
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
    interestHistory,
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
