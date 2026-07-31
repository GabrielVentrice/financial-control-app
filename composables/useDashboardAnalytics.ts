import type { Transaction } from '~/types/transaction'
import {
  isIncome,
  isRealExpense,
  isExcludedCategory,
  isExcludedDescription,
  categoryNameOf,
  expenseAmount,
} from '~/shared/expenseRules'
import {
  monthKeyOf,
  currentMonthKey,
  addMonthsToKey,
  daysInMonthKey,
  parseLocalDate,
} from '~/shared/dates'

export interface CategorySummary {
  name: string
  total: number
  count: number
  percentage: number
  trend?: number // Percentage change vs previous month
  avgLast3Months?: number
}

export interface MonthlyStats {
  income: number
  expenses: number
  balance: number
  transactionCount: number
  dailyAverage: number
  trend: {
    income: number // % change vs previous month
    expenses: number
    balance: number
  }
  comparison: {
    incomeVsAvg: number // % vs 3-month average
    expensesVsAvg: number
  }
}

export interface HistoricalData {
  last6Months: number[] // For sparklines
  last3MonthsAverage: number
  currentMonth: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface SmartInsight {
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  message: string
  value?: number
  action?: string
  priority: number // 1-5, higher = more important
}

/**
 * Dashboard analytics.
 *
 * Every function takes an optional `refMonth` ("YYYY-MM") so the dashboard can
 * navigate between months instead of being pinned to today. Months are bucketed
 * by string key, never by building a Date out of the ISO day — see
 * shared/dates.ts for why. What counts as income/expense lives in
 * shared/expenseRules.ts, shared with the categories and fixed-costs screens so
 * the three can't drift apart again.
 */
export const useDashboardAnalytics = () => {
  const inMonth = (t: Transaction, monthKey: string) => monthKeyOf(t.date) === monthKey

  /** Days to divide by for a daily average: the full month unless it's still running. */
  const elapsedDaysIn = (monthKey: string): number => {
    const now = new Date()
    if (monthKey === currentMonthKey(now)) return now.getDate()
    return daysInMonthKey(monthKey)
  }

  const getMonthStats = (transactions: Transaction[], monthKey: string) => {
    const monthTransactions = transactions.filter(t => inMonth(t, monthKey))

    const income = monthTransactions
      .filter(t => isIncome(t) && !isExcludedCategory(t) && !isExcludedDescription(t))
      .reduce((sum, t) => sum + expenseAmount(t), 0)

    const expenses = monthTransactions
      .filter(isRealExpense)
      .reduce((sum, t) => sum + expenseAmount(t), 0)

    return {
      income,
      expenses,
      balance: income - expenses,
      count: monthTransactions.length,
    }
  }

  const pctChange = (current: number, base: number): number =>
    base > 0 ? ((current - base) / base) * 100 : 0

  const getCurrentMonthStats = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey()
  ): MonthlyStats => {
    const current = getMonthStats(transactions, refMonth)
    const previous = getMonthStats(transactions, addMonthsToKey(refMonth, -1))

    const last3Months = [-1, -2, -3].map(offset =>
      getMonthStats(transactions, addMonthsToKey(refMonth, offset))
    )
    const avg3MonthsIncome = last3Months.reduce((sum, m) => sum + m.income, 0) / 3
    const avg3MonthsExpenses = last3Months.reduce((sum, m) => sum + m.expenses, 0) / 3

    const balanceTrend = previous.balance !== 0
      ? ((current.balance - previous.balance) / Math.abs(previous.balance)) * 100
      : 0

    return {
      income: current.income,
      expenses: current.expenses,
      balance: current.balance,
      transactionCount: current.count,
      dailyAverage: current.expenses / elapsedDaysIn(refMonth),
      trend: {
        income: pctChange(current.income, previous.income),
        expenses: pctChange(current.expenses, previous.expenses),
        balance: balanceTrend,
      },
      comparison: {
        incomeVsAvg: pctChange(current.income, avg3MonthsIncome),
        expensesVsAvg: pctChange(current.expenses, avg3MonthsExpenses),
      },
    }
  }

  const getAllCategories = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey()
  ): CategorySummary[] => {
    const monthTransactions = transactions.filter(t => inMonth(t, refMonth) && isRealExpense(t))

    const categoryMap = new Map<string, { total: number; count: number }>()
    monthTransactions.forEach(t => {
      const category = categoryNameOf(t)
      const existing = categoryMap.get(category) || { total: 0, count: 0 }
      categoryMap.set(category, {
        total: existing.total + expenseAmount(t),
        count: existing.count + 1,
      })
    })

    const totalExpenses = Array.from(categoryMap.values())
      .reduce((sum, cat) => sum + cat.total, 0)

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }

  const getTopCategories = (
    transactions: Transaction[],
    limit: number = 5,
    refMonth: string = currentMonthKey()
  ): CategorySummary[] => getAllCategories(transactions, refMonth).slice(0, limit)

  const getMonthExpenses = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey()
  ): Transaction[] =>
    transactions
      .filter(t => inMonth(t, refMonth) && isRealExpense(t))
      .sort((a, b) => (a.date < b.date ? 1 : -1))

  /**
   * Scheduled spending in the 30 days ahead. Uses isRealExpense so card
   * payments and transfers between accounts don't show up as upcoming spending.
   */
  const getUpcomingExpenses = (transactions: Transaction[]): Transaction[] => {
    const now = new Date()
    const horizon = new Date(now)
    horizon.setMonth(horizon.getMonth() + 1)

    return transactions
      .filter(t => {
        const date = parseLocalDate(t.date)
        return date > now && date <= horizon && isRealExpense(t)
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1))
  }

  const getHistoricalExpenses = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey()
  ): HistoricalData => {
    const last6Months = [-5, -4, -3, -2, -1, 0].map(
      offset => getMonthStats(transactions, addMonthsToKey(refMonth, offset)).expenses
    )

    const last3MonthsAverage = (last6Months[2] + last6Months[3] + last6Months[4]) / 3
    const recentAvg = (last6Months[3] + last6Months[4] + last6Months[5]) / 3
    const olderAvg = (last6Months[0] + last6Months[1] + last6Months[2]) / 3

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (recentAvg > olderAvg * 1.1) trend = 'increasing'
    else if (recentAvg < olderAvg * 0.9) trend = 'decreasing'

    return { last6Months, last3MonthsAverage, currentMonth: last6Months[5], trend }
  }

  const getSmartInsights = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey()
  ): SmartInsight[] => {
    const insights: SmartInsight[] = []
    const stats = getCurrentMonthStats(transactions, refMonth)

    // An empty month says nothing about spending habits — don't invent insights.
    if (stats.transactionCount === 0) return insights

    const historical = getHistoricalExpenses(transactions, refMonth)

    if (stats.balance < 0) {
      insights.push({
        type: 'danger',
        title: 'Saldo Negativo',
        message: 'Despesas excedem receitas',
        value: Math.abs(stats.balance),
        priority: 5,
      })
    }

    if (stats.comparison.expensesVsAvg > 20) {
      insights.push({
        type: 'warning',
        title: `+${stats.comparison.expensesVsAvg.toFixed(0)}% vs média`,
        message: 'Gastos muito acima do normal dos últimos 3 meses',
        value: stats.expenses,
        priority: 4,
      })
    }

    // Only meaningful while the month is still running.
    const projectedMonthly = stats.dailyAverage * daysInMonthKey(refMonth)
    if (
      refMonth === currentMonthKey() &&
      new Date().getDate() > 7 &&
      projectedMonthly > historical.last3MonthsAverage * 1.15
    ) {
      insights.push({
        type: 'warning',
        title: 'Ritmo de gastos elevado',
        message: `Média de R$ ${stats.dailyAverage.toFixed(0)}/dia pode exceder orçamento`,
        priority: 4,
      })
    }

    const topCat = getTopCategories(transactions, 1, refMonth)[0]
    if (topCat && topCat.percentage > 40) {
      insights.push({
        type: 'info',
        title: `${topCat.name} dominante`,
        message: `${topCat.percentage.toFixed(0)}% dos gastos concentrados`,
        value: topCat.total,
        priority: 3,
      })
    }

    if (stats.comparison.expensesVsAvg < -10) {
      insights.push({
        type: 'success',
        title: 'Gastos controlados',
        message: `${Math.abs(stats.comparison.expensesVsAvg).toFixed(0)}% abaixo da média`,
        priority: 2,
      })
    }

    if (historical.trend === 'increasing') {
      insights.push({
        type: 'info',
        title: 'Tendência de aumento',
        message: 'Gastos crescendo nos últimos meses',
        priority: 2,
      })
    } else if (historical.trend === 'decreasing') {
      insights.push({
        type: 'success',
        title: 'Tendência de redução',
        message: 'Gastos diminuindo nos últimos meses',
        priority: 2,
      })
    }

    return insights.sort((a, b) => b.priority - a.priority)
  }

  // Credit card invoice (fatura) for a billing cycle that closes on the last day
  // of the month: a purchase belongs to the invoice of month(date + 1 day).
  // So a purchase on 31/05 belongs to June's invoice, paid in July.
  interface CreditCardInvoice {
    total: number
    items: Transaction[]
    count: number
    cardOrigin: string
    closingMonth: number // 0-11
    closingYear: number
    dueMonth: number // 0-11
    dueYear: number
  }

  const getCreditCardInvoice = (
    transactions: Transaction[],
    options?: { cardOrigin?: string; closingDay?: number | 'last'; referenceDate?: Date }
  ): CreditCardInvoice => {
    const cardOrigin = options?.cardOrigin ?? 'Credit Card Gabriel'
    const closingDay = options?.closingDay ?? 'last'
    const referenceDate = options?.referenceDate ?? new Date()

    const invoiceMonthOf = (d: Date): { year: number; month: number } => {
      if (closingDay === 'last') {
        // Closing on the last day: the last day's purchases roll into next month.
        const shifted = new Date(d)
        shifted.setDate(shifted.getDate() + 1)
        return { year: shifted.getFullYear(), month: shifted.getMonth() }
      }
      let month = d.getMonth()
      let year = d.getFullYear()
      if (d.getDate() > closingDay) {
        month += 1
        if (month > 11) { month = 0; year += 1 }
      }
      return { year, month }
    }

    const currentInvoice = invoiceMonthOf(referenceDate)

    const items = transactions
      .filter(t => (t.origin || '') === cardOrigin)
      .filter(t => !isExcludedDescription(t) && !isExcludedCategory(t))
      .filter(t => {
        const im = invoiceMonthOf(parseLocalDate(t.date))
        return im.year === currentInvoice.year && im.month === currentInvoice.month
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))

    // Net total (purchases positive, refunds/estornos negative).
    const total = items.reduce((sum, t) => sum + t.amount, 0)

    return {
      total,
      items,
      count: items.length,
      cardOrigin,
      closingMonth: currentInvoice.month,
      closingYear: currentInvoice.year,
      dueMonth: (currentInvoice.month + 1) % 12,
      dueYear: currentInvoice.month === 11 ? currentInvoice.year + 1 : currentInvoice.year,
    }
  }

  return {
    getMonthStats,
    getCurrentMonthStats,
    getTopCategories,
    getAllCategories,
    getMonthExpenses,
    getUpcomingExpenses,
    getHistoricalExpenses,
    getSmartInsights,
    getCreditCardInvoice,
  }
}
