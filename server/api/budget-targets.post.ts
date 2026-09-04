import { loadTransactions } from '../utils/loadTransactions'
import { getBookSnapshot } from '../utils/bookSnapshot'
import {
  readTargets,
  saveTarget,
  readActualCash,
  buildMonthSnapshot,
  type MonthSnapshot,
} from '../utils/monthSnapshot'
import { currentMonthKey } from '../../shared/dates'

interface TargetInput {
  category?: string
  monthlyAmount?: number
  /** Month to rebuild the snapshot for, so the screen updates in place. */
  month?: string
  person?: 'Juliana' | 'Gabriel' | 'Ambos'
}

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Sets one category's monthly target.
 *
 * Answers with the recomputed month snapshot, not with the saved row — the same
 * contract /api/debt keeps. The screen swaps its state for the response and is
 * therefore never showing a target the server has not confirmed, nor a total
 * that was recomputed on the client from a different set of numbers.
 */
export default defineEventHandler(async (event): Promise<MonthSnapshot> => {
  const body = await readBody<TargetInput>(event)
  const errors: string[] = []

  const category = typeof body?.category === 'string' ? body.category.trim() : ''
  if (!category) errors.push('category é obrigatória')
  if (category.length > 120) errors.push('category tem no máximo 120 caracteres')

  const amount = body?.monthlyAmount
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    errors.push('monthlyAmount deve ser um número')
  } else if (amount < 0) {
    errors.push('monthlyAmount não pode ser negativo')
  } else if (amount > 1_000_000) {
    errors.push('monthlyAmount acima do limite (1.000.000)')
  }

  const monthKey = body?.month || currentMonthKey()
  if (!MONTH_KEY.test(monthKey)) errors.push('month deve estar no formato YYYY-MM')

  if (errors.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid budget target',
      data: { errors },
    })
  }

  try {
    await saveTarget(category, amount as number)

    const [transactions, { transactions: raw }, targets] = await Promise.all([
      loadTransactions({ person: body?.person }),
      getBookSnapshot(),
      readTargets(),
    ])

    const actualCash = await readActualCash(raw)

    return buildMonthSnapshot(transactions, targets, monthKey, actualCash)
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API] Error saving budget target:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save budget target',
      data: error.message,
    })
  }
})
