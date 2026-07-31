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

export interface CashFlowMonth {
  key: string
  income: number
  expenses: number
  net: number
}

/** The single conclusion shown as "Sinal do mês" on the dashboard. */
export interface MonthSignal {
  positive: boolean
  title: string
  detail: string
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

  /**
   * Paired income/expense series for the chart, ending on the reference month.
   * The axis top is a fixed R$ 18k rounded up to the next multiple of 6k when a
   * month overflows it, so the bars stay comparable between months instead of
   * rescaling on every navigation.
   */
  const getCashFlow = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey(),
    months: number = 6
  ): { series: CashFlowMonth[]; axisTop: number } => {
    const series = Array.from({ length: months }, (_, i) => {
      const key = addMonthsToKey(refMonth, i - (months - 1))
      const { income, expenses } = getMonthStats(transactions, key)
      return { key, income, expenses, net: income - expenses }
    })

    const peak = Math.max(0, ...series.flatMap(m => [m.income, m.expenses]))
    const STEP = 6000
    const axisTop = Math.max(18000, Math.ceil(peak / STEP) * STEP)

    return { series, axisTop }
  }

  /**
   * The one conclusion the month is telling you — never a list.
   *
   * Ordered by what would change a decision: a hole in the month first, then a
   * sustained direction, then position against the recent average. Every branch
   * carries the numbers that justify it, because "you're spending a lot" without
   * a figure is not actionable.
   */
  const getMonthSignal = (
    transactions: Transaction[],
    refMonth: string = currentMonthKey()
  ): MonthSignal | null => {
    const stats = getCurrentMonthStats(transactions, refMonth)
    if (stats.transactionCount === 0) return null

    const fmt = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`

    if (stats.balance < 0) {
      return {
        positive: false,
        title: 'Saídas maiores que entradas',
        detail: `Faltam ${fmt(Math.abs(stats.balance))} para fechar o mês no zero.`,
      }
    }

    // Sustained direction: daily average this quarter vs. the previous one.
    const quarterAvg = (offset: number) => {
      const totals = [0, 1, 2].map(i => {
        const key = addMonthsToKey(refMonth, offset - i)
        return { spent: getMonthStats(transactions, key).expenses, days: daysInMonthKey(key) }
      })
      const spent = totals.reduce((s, t) => s + t.spent, 0)
      const days = totals.reduce((s, t) => s + t.days, 0)
      return days > 0 ? spent / days : 0
    }

    const thisQuarter = quarterAvg(0)
    const lastQuarter = quarterAvg(-3)

    if (lastQuarter > 0 && thisQuarter > 0) {
      const delta = (thisQuarter - lastQuarter) / lastQuarter
      if (delta <= -0.08) {
        return {
          positive: true,
          title: 'Gasto em queda no trimestre',
          detail: `Média de ${fmt(thisQuarter)}/dia, contra ${fmt(lastQuarter)}/dia no trimestre anterior.`,
        }
      }
      if (delta >= 0.08) {
        return {
          positive: false,
          title: 'Gasto em alta no trimestre',
          detail: `Média de ${fmt(thisQuarter)}/dia, contra ${fmt(lastQuarter)}/dia no trimestre anterior.`,
        }
      }
    }

    const vsAvg = stats.comparison.expensesVsAvg
    if (Math.abs(vsAvg) >= 10) {
      const above = vsAvg > 0
      return {
        positive: !above,
        title: above ? 'Acima da média dos 3 meses' : 'Abaixo da média dos 3 meses',
        detail: `${fmt(stats.expenses)} gastos, ${Math.abs(vsAvg).toFixed(0)}% ${above ? 'acima' : 'abaixo'} do normal recente.`,
      }
    }

    return {
      positive: true,
      title: 'Mês dentro do padrão',
      detail: `${fmt(stats.expenses)} gastos, em linha com a média dos últimos 3 meses.`,
    }
  }

  /**
   * Credit-card invoice for the cycle that is currently open.
   *
   * The cycle is described by a closing day and a due day. The previous model
   * assumed "closes on the last day of the month", which was wrong twice over:
   * the card actually bills on the 8th (seven consecutive
   * `PAGAMENTO DEBITO AUTOMATICO` rows land on the 8th/9th), and on the 31st the
   * +1-day shift rolled the whole card over to *next* month's invoice — so the
   * dashboard showed an almost-empty August bill on the last day of July.
   *
   * Installments due in the cycle ARE part of the bill — that is what a credit
   * card charges — so projected rows count toward the total. For the July 2026
   * cycle that is R$ 1.434,92 of recorded purchases plus R$ 1.825,72 of
   * installments; leaving the installments out understated the invoice by more
   * than half. `installments` is returned separately so the screen can show the
   * split.
   *
   * NOTE: the total is only as complete as the sheet. Even with installments
   * included it lands short of the invoice actually paid (R$ 846 for July 2026,
   * R$ 1.6k–2.9k in earlier months), because card purchases are missing from
   * the source. Treat this as "o que está lançado", not as the bank's number.
   */
  interface CreditCardInvoice {
    total: number
    installments: number
    items: Transaction[]
    count: number
    cardOrigin: string
    closingDate: string // YYYY-MM-DD, last day included in this invoice
    dueMonth: number // 0-11
    dueYear: number
  }

  /**
   * The card closes on the LAST day of the month and is due on the 8th of the
   * next one.
   *
   * Both ends come from the card itself: the bank reports "melhor dia de compra
   * = 01", and the best purchase day is by definition the day after closing, so
   * closing is the last day of the month. The due day is visible in the data —
   * seven consecutive `PAGAMENTO DEBITO AUTOMATICO` rows land on the 8th/9th.
   *
   * So the cycle is simply the calendar month: purchases from 01/07 to 31/07
   * close on 31/07 and are paid on 08/08.
   */
  const INVOICE_DUE_DAY = 8

  const getCreditCardInvoice = (
    transactions: Transaction[],
    options?: {
      cardOrigin?: string
      /** Day the invoice closes; 'last' (default) means the last day of the month. */
      closingDay?: number | 'last'
      dueDay?: number
      referenceDate?: Date
    }
  ): CreditCardInvoice => {
    const cardOrigin = options?.cardOrigin ?? 'Credit Card Gabriel'
    const closingDay = options?.closingDay ?? 'last'
    const dueDay = options?.dueDay ?? INVOICE_DUE_DAY
    const today = options?.referenceDate ?? new Date()

    const pad = (n: number) => String(n).padStart(2, '0')
    const lastDayOf = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

    // The open cycle is the one whose closing date has not passed yet. On the
    // closing day itself the cycle is still open — that is the case that broke:
    // on 31/07 the old code jumped to the invoice closing in August, which held
    // nothing but projected installments.
    let closeYear = today.getFullYear()
    let closeMonth = today.getMonth()
    const closeDayIn = (year: number, month: number) =>
      closingDay === 'last' ? lastDayOf(year, month) : Math.min(closingDay, lastDayOf(year, month))

    if (today.getDate() > closeDayIn(closeYear, closeMonth)) {
      closeMonth += 1
      if (closeMonth > 11) { closeMonth = 0; closeYear += 1 }
    }

    const closingDate = `${closeYear}-${pad(closeMonth + 1)}-${pad(closeDayIn(closeYear, closeMonth))}`

    // The cycle opens the day after the previous one closed.
    const prevMonth = closeMonth === 0 ? 11 : closeMonth - 1
    const prevYear = closeMonth === 0 ? closeYear - 1 : closeYear
    const openingDate = `${prevYear}-${pad(prevMonth + 1)}-${pad(closeDayIn(prevYear, prevMonth))}`

    const items = transactions
      .filter(t => (t.origin || '') === cardOrigin)
      .filter(t => !isExcludedDescription(t) && !isExcludedCategory(t))
      .filter(t => t.date > openingDate && t.date <= closingDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1))

    // Net total (purchases positive, refunds/estornos negative).
    const total = items.reduce((sum, t) => sum + t.amount, 0)
    const installments = items
      .filter(t => t.projected)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Paid on the due day of the month AFTER the cycle closes.
    const dueDate = new Date(closeYear, closeMonth + 1, dueDay)

    return {
      total,
      installments,
      items,
      count: items.length,
      cardOrigin,
      closingDate,
      dueMonth: dueDate.getMonth(),
      dueYear: dueDate.getFullYear(),
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
    getCashFlow,
    getMonthSignal,
    getCreditCardInvoice,
  }
}
