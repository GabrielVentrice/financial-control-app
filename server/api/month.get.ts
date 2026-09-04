import { loadTransactions } from '../utils/loadTransactions'
import { getBookSnapshot } from '../utils/bookSnapshot'
import {
  readTargets,
  readActualCash,
  buildMonthSnapshot,
  type MonthSnapshot,
} from '../utils/monthSnapshot'
import { currentMonthKey } from '../../shared/dates'

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * The month, measured against the budget.
 *
 * One payload for the whole screen, so the headline number and the category
 * list are built from the same read and cannot disagree — the same contract
 * /api/debt keeps.
 *
 * Reads the installment-EXPANDED pipeline, unlike /api/debt: this screen has to
 * see the projected rows in order to say what the month is still committed to.
 * Splitting them back out is shared/monthBudget.ts's job, and it never lets a
 * projected row count as money already spent.
 */
export default defineEventHandler(async (event): Promise<MonthSnapshot> => {
  defineRouteMeta({
    openAPI: {
      summary: 'Get the current month measured against the budget',
      description:
        'Returns the month pace, income, realized spending, committed installments, one line per category with its target and headroom, and where the month sits on the move-out plan. Defaults to the current month and to the Gabriel person filter.',
      tags: ['Month'],
      parameters: [
        {
          name: 'month',
          in: 'query',
          description: 'Month to read, "YYYY-MM". Defaults to the current month.',
          schema: { type: 'string', example: '2026-09' },
        },
        {
          name: 'person',
          in: 'query',
          description: 'Person filter.',
          schema: { type: 'string', enum: ['Juliana', 'Gabriel', 'Ambos'] },
        },
      ],
      responses: {
        200: { description: 'Month snapshot' },
        400: { description: 'Invalid month key' },
        503: { description: 'Database not configured' },
      },
    },
  })

  const query = getQuery(event)
  const monthKey = String(query.month || '') || currentMonthKey()

  if (!MONTH_KEY.test(monthKey)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid month',
      data: `"${monthKey}" não é um mês válido. Use o formato YYYY-MM.`,
    })
  }

  const person = query.person as 'Juliana' | 'Gabriel' | 'Ambos' | undefined

  try {
    const [transactions, { transactions: raw }, targets] = await Promise.all([
      loadTransactions({ person }),
      getBookSnapshot(),
      readTargets(),
    ])

    const actualCash = await readActualCash(raw)

    return buildMonthSnapshot(transactions, targets, monthKey, actualCash)
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API] Error building month snapshot:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to build month snapshot',
      data: error.message,
    })
  }
})
