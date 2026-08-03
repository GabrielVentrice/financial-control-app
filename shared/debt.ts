/**
 * Cheque-especial payoff math.
 *
 * Framework-agnostic (no Vue/Nitro) so the API and the page agree on every
 * number — the whole point of this screen is that the plan and the tracking are
 * the same calculation, not two that drift.
 *
 * Two ideas carry the model:
 *
 * 1. **The balance is derived, not typed in.** An overdraft balance is not a
 *    transaction, so it can't be read out of the ledger directly. Instead the
 *    user anchors it once ("hoje devo R$ X") and from then on the balance is
 *    the anchor plus every net movement on the account since — so each sync
 *    updates it for free, and the number stays honest without re-typing.
 *
 * 2. **Capacity is relative to today.** Today's surplus is whatever it is; what
 *    changes month to month is the installment load rolling off. So capacity in
 *    a future month is today's surplus plus the installments that will have
 *    ended by then, plus whatever the user commits to cutting. That keeps the
 *    projection tied to observed behaviour instead of an aspirational budget.
 */

/** One month of the payoff projection. */
export interface PayoffMonth {
  monthKey: string
  /** Debt at the start of the month, as a positive number. */
  opening: number
  /** Interest accrued this month. */
  interest: number
  /** Amount thrown at the debt this month. */
  payment: number
  /** Debt at the end of the month, as a positive number. */
  closing: number
  /** Installments still billing this month (drives the capacity). */
  installments: number
}

export interface PayoffInput {
  /** Current debt as a positive number. */
  balance: number
  /** Monthly interest rate as a decimal (0.031 = 3,1% a.m.). */
  monthlyRate: number
  /** Month the projection starts, "YYYY-MM". */
  startMonth: string
  /** Recurring surplus today (income − outflow). Usually ~0, can be negative. */
  baseSurplus: number
  /** Installment load per month, keyed "YYYY-MM". Missing month → 0. */
  installmentsByMonth: Record<string, number>
  /** Extra monthly cut the user commits to on top of the natural surplus. */
  monthlyCut: number
  /** How many months to project before giving up. */
  horizon?: number
}

export interface PayoffResult {
  months: PayoffMonth[]
  /** Month the debt hits zero, or null when it never does within the horizon. */
  payoffMonth: string | null
  /** Months until payoff, or null. */
  monthsToPayoff: number | null
  /** Total interest paid over the payoff. */
  totalInterest: number
  /** True when payments never outrun the interest. */
  neverPaysOff: boolean
}

const monthKeyToIdx = (key: string): number => {
  const [y, m] = key.split('-').map(Number)
  return y * 12 + (m - 1)
}

const idxToMonthKey = (idx: number): string =>
  `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`

/**
 * How much is available to throw at the debt in a given month.
 *
 * Anchored on today: the surplus you actually run, plus the installments that
 * have ended since (they stop leaving the account, so that money is now free),
 * plus the cut you commit to. Never negative — a month that can't pay simply
 * pays nothing rather than inventing new debt on top of the interest.
 */
export function capacityForMonth(
  monthKey: string,
  input: Pick<PayoffInput, 'baseSurplus' | 'installmentsByMonth' | 'monthlyCut' | 'startMonth'>
): number {
  const today = input.installmentsByMonth[input.startMonth] ?? 0
  const then = input.installmentsByMonth[monthKey] ?? 0
  const freed = today - then
  return Math.max(0, input.baseSurplus + freed + input.monthlyCut)
}

/**
 * Amortises the debt month by month.
 *
 * Interest is charged on the opening balance before the payment lands, which is
 * the conservative reading — a payment made mid-month earns you less relief
 * than this model gives it credit for, never more.
 */
export function projectPayoff(input: PayoffInput): PayoffResult {
  const horizon = input.horizon ?? 60
  const startIdx = monthKeyToIdx(input.startMonth)
  const months: PayoffMonth[] = []

  let balance = Math.max(0, input.balance)
  let totalInterest = 0
  let payoffMonth: string | null = null

  for (let i = 0; i < horizon && balance > 0.005; i++) {
    const monthKey = idxToMonthKey(startIdx + i)
    const opening = balance
    const interest = opening * input.monthlyRate
    const capacity = capacityForMonth(monthKey, input)
    // Never pay more than what is owed including this month's interest.
    const payment = Math.min(capacity, opening + interest)
    const closing = Math.max(0, opening + interest - payment)

    totalInterest += interest
    months.push({
      monthKey,
      opening,
      interest,
      payment,
      closing,
      installments: input.installmentsByMonth[monthKey] ?? 0,
    })

    balance = closing
    if (closing <= 0.005) {
      payoffMonth = monthKey
      break
    }
  }

  return {
    months,
    payoffMonth,
    monthsToPayoff: payoffMonth ? months.length : null,
    totalInterest,
    neverPaysOff: payoffMonth === null,
  }
}

/**
 * The monthly payment that clears the debt in exactly `months` months at a
 * fixed rate — the standard annuity payment. Used to answer "what would it take
 * to be done by <date>", which is the question a target date really asks.
 */
export function paymentToClearIn(balance: number, monthlyRate: number, months: number): number {
  if (months <= 0) return balance
  if (monthlyRate <= 0) return balance / months
  const factor = Math.pow(1 + monthlyRate, months)
  return (balance * monthlyRate * factor) / (factor - 1)
}

/**
 * Interest that will still be paid if nothing changes — the cost of doing
 * nothing, over a year. This is the number that makes the debt feel urgent:
 * a balance that merely sits there is not neutral, it bleeds.
 */
export function costOfDoingNothing(balance: number, monthlyRate: number, months = 12): number {
  return balance * (Math.pow(1 + monthlyRate, months) - 1)
}
