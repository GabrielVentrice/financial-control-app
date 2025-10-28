import type { Transaction } from '~/types/transaction'

export interface CategorySummary {
  name: string
  total: number
  count: number
  percentage: number
}

export interface Alert {
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
  amount?: number
}

export interface MonthlyStats {
  income: number
  expenses: number
  balance: number
  transactionCount: number
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

  const getCurrentMonthStats = (transactions: Transaction[]): MonthlyStats => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
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
      transactionCount: monthTransactions.length
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

  return {
    getCurrentMonthStats,
    getTopCategories,
    getUpcomingExpenses,
    generateAlerts,
    getMonthlyForecast
  }
}
