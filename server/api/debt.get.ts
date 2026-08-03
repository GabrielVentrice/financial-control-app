import { buildDebtSnapshot, readPlan, type DebtSnapshot } from '../utils/debtPlan'

/**
 * Current state of the debt payoff plan.
 *
 * Returns `null` when no plan has been configured yet, rather than inventing
 * one — the anchor balance is something only the user can confirm against the
 * bank, and a guessed number here would quietly poison every projection built
 * on top of it.
 */
export default defineEventHandler(async (event): Promise<DebtSnapshot | null> => {
  defineRouteMeta({
    openAPI: {
      summary: 'Get the debt payoff plan and its current state',
      description:
        'Returns the live cheque-especial balance (anchor + account movement since), the interest actually charged, recurring cash flow, the forward installment load, and a month-by-month payoff projection. Returns null when no plan is configured.',
      tags: ['Debt'],
      responses: {
        200: { description: 'Debt snapshot, or null when unconfigured' },
        503: { description: 'Database not configured' },
      },
    },
  })

  try {
    const plan = await readPlan()
    if (!plan) return null
    return await buildDebtSnapshot(plan)
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API] Error building debt snapshot:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to build debt snapshot',
      data: error.message,
    })
  }
})
