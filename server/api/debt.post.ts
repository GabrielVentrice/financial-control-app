import { eq } from 'drizzle-orm'
import { getDb, debtPlans } from '../database'
import { buildDebtSnapshot, readPlan, DEFAULT_PLAN, type DebtSnapshot } from '../utils/debtPlan'

interface DebtPlanInput {
  name?: string
  account?: string
  /** Debt today, POSITIVE. Setting this re-anchors to `anchorDate`. */
  anchorBalance?: number
  /** "YYYY-MM-DD". Defaults to today when re-anchoring. */
  anchorDate?: string
  /** Decimal, e.g. 0.031 for 3,1% a.m. */
  monthlyRate?: number
  monthlyCut?: number
  targetMonth?: string | null
  person?: string | null
}

const isMonthKey = (v: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

/**
 * Creates or updates the debt plan.
 *
 * Re-anchoring is the important operation here: the balance is derived from the
 * anchor plus account movement, so drift between the app and the bank is fixed
 * by confirming a fresh balance, not by editing history.
 */
export default defineEventHandler(async (event): Promise<DebtSnapshot> => {
  defineRouteMeta({
    openAPI: {
      summary: 'Create or update the debt payoff plan',
      description:
        'Sets the anchor balance/date, interest rate, committed monthly cut and optional target month. Returns the recomputed debt snapshot.',
      tags: ['Debt'],
      responses: {
        200: { description: 'Updated debt snapshot' },
        400: { description: 'Invalid plan data' },
      },
    },
  })

  const body = (await readBody(event)) as DebtPlanInput
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const errors: string[] = []
  if (body.anchorBalance !== undefined && (typeof body.anchorBalance !== 'number' || body.anchorBalance < 0)) {
    errors.push('anchorBalance must be a non-negative number (the debt, positive)')
  }
  if (body.anchorDate !== undefined && !isIsoDate(body.anchorDate)) {
    errors.push('anchorDate must be YYYY-MM-DD')
  }
  if (body.monthlyRate !== undefined && (typeof body.monthlyRate !== 'number' || body.monthlyRate < 0 || body.monthlyRate > 1)) {
    errors.push('monthlyRate must be a decimal between 0 and 1 (0.031 = 3,1% a.m.)')
  }
  if (body.monthlyCut !== undefined && (typeof body.monthlyCut !== 'number' || body.monthlyCut < 0)) {
    errors.push('monthlyCut must be a non-negative number')
  }
  if (body.targetMonth != null && !isMonthKey(body.targetMonth)) {
    errors.push('targetMonth must be YYYY-MM or null')
  }
  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid plan data', data: { errors } })
  }

  const db = getDb()
  const existing = await readPlan()
  const today = new Date().toISOString().slice(0, 10)

  if (!existing) {
    if (body.anchorBalance === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'anchorBalance is required to create a plan',
        data: 'Informe quanto você deve hoje para ancorar o acompanhamento.',
      })
    }
    const [created] = await db
      .insert(debtPlans)
      .values({
        name: body.name ?? DEFAULT_PLAN.name,
        account: body.account ?? DEFAULT_PLAN.account,
        anchorBalance: String(body.anchorBalance),
        anchorDate: body.anchorDate ?? today,
        monthlyRate: String(body.monthlyRate ?? DEFAULT_PLAN.monthlyRate),
        monthlyCut: String(body.monthlyCut ?? DEFAULT_PLAN.monthlyCut),
        targetMonth: body.targetMonth ?? null,
        person: body.person ?? null,
      })
      .returning()
    return await buildDebtSnapshot(created)
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined) patch.name = body.name
  if (body.account !== undefined) patch.account = body.account
  if (body.monthlyRate !== undefined) patch.monthlyRate = String(body.monthlyRate)
  if (body.monthlyCut !== undefined) patch.monthlyCut = String(body.monthlyCut)
  if (body.targetMonth !== undefined) patch.targetMonth = body.targetMonth
  if (body.person !== undefined) patch.person = body.person
  // A new balance always moves the anchor date with it, otherwise the movement
  // since the old date would be replayed on top of an already-current number.
  if (body.anchorBalance !== undefined) {
    patch.anchorBalance = String(body.anchorBalance)
    patch.anchorDate = body.anchorDate ?? today
  } else if (body.anchorDate !== undefined) {
    patch.anchorDate = body.anchorDate
  }

  const [updated] = await db
    .update(debtPlans)
    .set(patch)
    .where(eq(debtPlans.id, existing.id))
    .returning()

  return await buildDebtSnapshot(updated)
})
