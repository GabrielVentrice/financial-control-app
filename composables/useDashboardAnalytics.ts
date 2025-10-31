import type { Transaction } from '~/types/transaction'

export interface CategorySummary {
  name: string
  total: number
  count: number
  percentage: number
  trend?: number // Percentage change vs previous month
  avgLast3Months?: number
}

export interface Alert {
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  message: string
  amount?: number
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

export const useDashboardAnalytics = () => {
  // Helper function to check if transaction is income
  const isIncome = (transaction: Transaction): boolean => {
    return transaction.destination.toLowerCase().includes('bank account')
  }

  // Helper function to check if transaction is expense
  const isExpense = (transaction: Transaction): boolean => {
    const originLower = transaction.origin.toLowerCase()
    return originLower.includes('bank account') || originLower.includes('credit card')
  }

  // Get stats for a specific month
  const getMonthStats = (transactions: Transaction[], monthOffset: number = 0) => {
    const now = new Date()
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const targetMonth = targetDate.getMonth()
    const targetYear = targetDate.getFullYear()

    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === targetMonth && date.getFullYear() === targetYear
    })

    const income = monthTransactions
      .filter(t => isIncome(t))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const expenses = monthTransactions
      .filter(t => isExpense(t))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      income,
      expenses,
      balance: income - expenses,
      count: monthTransactions.length
    }
  }

  const getCurrentMonthStats = (transactions: Transaction[]): MonthlyStats => {
    const now = new Date()
    const currentDay = now.getDate()

    // Current month
    const current = getMonthStats(transactions, 0)

    // Previous month
    const previous = getMonthStats(transactions, -1)

    // Last 3 months average (excluding current)
    const last3Months = [-1, -2, -3].map(offset => getMonthStats(transactions, offset))
    const avg3MonthsIncome = last3Months.reduce((sum, m) => sum + m.income, 0) / 3
    const avg3MonthsExpenses = last3Months.reduce((sum, m) => sum + m.expenses, 0) / 3

    // Calculate trends
    const incomeTrend = previous.income > 0
      ? ((current.income - previous.income) / previous.income) * 100
      : 0

    const expensesTrend = previous.expenses > 0
      ? ((current.expenses - previous.expenses) / previous.expenses) * 100
      : 0

    const balanceTrend = previous.balance !== 0
      ? ((current.balance - previous.balance) / Math.abs(previous.balance)) * 100
      : 0

    // Comparison with 3-month average
    const incomeVsAvg = avg3MonthsIncome > 0
      ? ((current.income - avg3MonthsIncome) / avg3MonthsIncome) * 100
      : 0

    const expensesVsAvg = avg3MonthsExpenses > 0
      ? ((current.expenses - avg3MonthsExpenses) / avg3MonthsExpenses) * 100
      : 0

    // Daily average (considering current day of month)
    const dailyAverage = currentDay > 0 ? current.expenses / currentDay : 0

    return {
      income: current.income,
      expenses: current.expenses,
      balance: current.balance,
      transactionCount: current.count,
      dailyAverage,
      trend: {
        income: incomeTrend,
        expenses: expensesTrend,
        balance: balanceTrend
      },
      comparison: {
        incomeVsAvg,
        expensesVsAvg
      }
    }
  }

  const getTopCategories = (transactions: Transaction[], limit: number = 5): CategorySummary[] => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Filter to current month and only expenses
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear &&
             isExpense(t)
    })

    // Group by destination (category)
    const categoryMap = new Map<string, { total: number; count: number }>()

    monthTransactions.forEach(t => {
      const category = t.destination || 'Sem categoria'
      const existing = categoryMap.get(category) || { total: 0, count: 0 }
      categoryMap.set(category, {
        total: existing.total + Math.abs(t.amount),
        count: existing.count + 1
      })
    })

    // Calculate total expenses for percentage
    const totalExpenses = Array.from(categoryMap.values())
      .reduce((sum, cat) => sum + cat.total, 0)

    // Convert to array and sort
    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)

    return categories
  }

  const getUpcomingExpenses = (transactions: Transaction[]): Transaction[] => {
    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    return transactions
      .filter(t => {
        const date = new Date(t.date)
        return date > now && date <= nextMonth && isExpense(t)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const generateAlerts = (transactions: Transaction[]): Alert[] => {
    const alerts: Alert[] = []
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get current and previous month stats
    const currentMonthStats = getCurrentMonthStats(transactions)

    const previousMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear
    })

    const previousMonthExpenses = previousMonthTransactions
      .filter(t => isExpense(t))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Alert: Spending above previous month
    if (previousMonthExpenses > 0 && currentMonthStats.expenses > previousMonthExpenses * 1.2) {
      alerts.push({
        type: 'warning',
        title: 'Gastos Acima do Esperado',
        message: `Seus gastos estão 20% acima do mês passado`,
        amount: currentMonthStats.expenses - previousMonthExpenses
      })
    }

    // Alert: High value transactions this month
    const highValueTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear &&
             Math.abs(t.amount) > 1000
    })

    if (highValueTransactions.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Transações de Alto Valor',
        message: `${highValueTransactions.length} transação(ões) acima de R$ 1.000`,
        amount: highValueTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      })
    }

    // Alert: Negative balance
    if (currentMonthStats.balance < 0) {
      alerts.push({
        type: 'danger',
        title: 'Saldo Negativo',
        message: 'Suas despesas estão maiores que sua receita este mês',
        amount: Math.abs(currentMonthStats.balance)
      })
    }

    // Alert: Low transaction count (might indicate missing data)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const currentDay = now.getDate()
    const expectedTransactions = (currentDay / daysInMonth) * 20 // Assume ~20 transactions per month

    if (currentMonthStats.transactionCount < expectedTransactions * 0.5 && currentDay > 10) {
      alerts.push({
        type: 'warning',
        title: 'Poucas Transações Registradas',
        message: 'Você pode ter transações não registradas este mês'
      })
    }

    return alerts
  }

  const getMonthlyForecast = (transactions: Transaction[]) => {
    const now = new Date()
    const nextMonthDate = new Date(now)
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)

    const upcomingExpenses = getUpcomingExpenses(transactions)
    const totalUpcoming = upcomingExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Estimate income based on current month pattern
    const currentStats = getCurrentMonthStats(transactions)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()
    const projectedIncome = currentDay > 5 ? (currentStats.income / currentDay) * daysInMonth : currentStats.income

    return {
      projectedIncome,
      upcomingExpenses: totalUpcoming,
      projectedBalance: projectedIncome - totalUpcoming,
      upcomingCount: upcomingExpenses.length
    }
  }

  // Get historical data for sparklines
  const getHistoricalExpenses = (transactions: Transaction[]): HistoricalData => {
    // Get last 6 months of expenses
    const last6Months = [-5, -4, -3, -2, -1, 0].map(offset => {
      return getMonthStats(transactions, offset).expenses
    })

    const currentMonth = last6Months[5]
    const last3MonthsAverage = (last6Months[2] + last6Months[3] + last6Months[4]) / 3

    // Detect trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    const recentAvg = (last6Months[3] + last6Months[4] + last6Months[5]) / 3
    const olderAvg = (last6Months[0] + last6Months[1] + last6Months[2]) / 3

    if (recentAvg > olderAvg * 1.1) trend = 'increasing'
    else if (recentAvg < olderAvg * 0.9) trend = 'decreasing'

    return {
      last6Months,
      last3MonthsAverage,
      currentMonth,
      trend
    }
  }

  // Generate smart, prioritized insights
  const getSmartInsights = (transactions: Transaction[]): SmartInsight[] => {
    const insights: SmartInsight[] = []
    const stats = getCurrentMonthStats(transactions)
    const now = new Date()
    const currentDay = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    // Critical: Negative balance
    if (stats.balance < 0) {
      insights.push({
        type: 'danger',
        title: 'Saldo Negativo',
        message: 'Despesas excedem receitas',
        value: Math.abs(stats.balance),
        priority: 5
      })
    }

    // High priority: Significant expense increase
    if (stats.comparison.expensesVsAvg > 20) {
      insights.push({
        type: 'warning',
        title: `+${stats.comparison.expensesVsAvg.toFixed(0)}% vs média`,
        message: 'Gastos muito acima do normal dos últimos 3 meses',
        value: stats.expenses,
        priority: 4
      })
    }

    // High daily average warning
    const projectedMonthly = stats.dailyAverage * daysInMonth
    const last3MonthsAvg = getHistoricalExpenses(transactions).last3MonthsAverage
    if (projectedMonthly > last3MonthsAvg * 1.15 && currentDay > 7) {
      insights.push({
        type: 'warning',
        title: 'Ritmo de gastos elevado',
        message: `Média de R$ ${(stats.dailyAverage).toFixed(0)}/dia pode exceder orçamento`,
        priority: 4
      })
    }

    // Medium priority: Unusual spending in category
    const topCat = getTopCategories(transactions, 1)[0]
    if (topCat && topCat.percentage > 40) {
      insights.push({
        type: 'info',
        title: `${topCat.name} dominante`,
        message: `${topCat.percentage.toFixed(0)}% dos gastos concentrados`,
        value: topCat.total,
        priority: 3
      })
    }

    // Positive: Under budget
    if (stats.comparison.expensesVsAvg < -10) {
      insights.push({
        type: 'success',
        title: 'Gastos controlados',
        message: `${Math.abs(stats.comparison.expensesVsAvg).toFixed(0)}% abaixo da média`,
        priority: 2
      })
    }

    // Info: Trend detection
    const historical = getHistoricalExpenses(transactions)
    if (historical.trend === 'increasing') {
      insights.push({
        type: 'info',
        title: 'Tendência de aumento',
        message: 'Gastos crescendo nos últimos meses',
        priority: 2
      })
    } else if (historical.trend === 'decreasing') {
      insights.push({
        type: 'success',
        title: 'Tendência de redução',
        message: 'Gastos diminuindo nos últimos meses',
        priority: 2
      })
    }

    // Sort by priority
    return insights.sort((a, b) => b.priority - a.priority)
  }

  return {
    getCurrentMonthStats,
    getTopCategories,
    getUpcomingExpenses,
    generateAlerts,
    getMonthlyForecast,
    getHistoricalExpenses,
    getSmartInsights
  }
}
