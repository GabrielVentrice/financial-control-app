/**
 * Formatting utilities for financial data
 * Provides consistent formatting across the application
 */

export const useFormatters = () => {
  /**
   * Format currency value to BRL
   * @param value - Numeric value to format
   * @param compact - Use compact notation (K, M)
   * @param decimals - Show decimal places
   */
  const formatCurrency = (
    value: number,
    options: { compact?: boolean; decimals?: boolean } = {}
  ): string => {
    const { compact = false, decimals = false } = options

    if (compact) {
      // Compact notation for large values
      if (Math.abs(value) >= 1000000) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }).format(value)
      }
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0
    }).format(value)
  }

  /**
   * Format number with thousand separators
   */
  const formatNumber = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  /**
   * Format percentage value
   */
  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`
  }

  /**
   * Format date to localized string
   * @param dateString - ISO date string
   * @param format - Output format style
   */
  const formatDate = (
    dateString: string,
    format: 'short' | 'medium' | 'long' = 'short'
  ): string => {
    if (!dateString) return '-'

    try {
      const date = new Date(dateString)

      switch (format) {
        case 'short':
          // DD/MM
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

        case 'medium':
          // DD Mon
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

        case 'long':
          // DD de Mês de YYYY
          return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })

        default:
          return date.toLocaleDateString('pt-BR')
      }
    } catch {
      return dateString
    }
  }

  /**
   * Format month name from index
   */
  const formatMonthName = (monthIndex: number, short: boolean = false): string => {
    const longMonths = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const shortMonths = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]

    const months = short ? shortMonths : longMonths
    return months[monthIndex] || ''
  }

  /**
   * Format relative time (e.g., "há 3 dias", "em 2 dias")
   */
  const formatRelativeDate = (dateString: string): string => {
    if (!dateString) return '-'

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (diffInDays === 0) return 'Hoje'
      if (diffInDays === 1) return 'Amanhã'
      if (diffInDays === -1) return 'Ontem'
      if (diffInDays > 0) return `Em ${diffInDays} dias`
      return `Há ${Math.abs(diffInDays)} dias`
    } catch {
      return dateString
    }
  }

  /**
   * Get color class for trend value
   */
  const getTrendColor = (value: number, invert: boolean = false): string => {
    if (value === 0) return 'text-gray-500'

    const isPositive = value > 0
    const shouldBeGreen = invert ? !isPositive : isPositive

    return shouldBeGreen ? 'text-positive' : 'text-negative'
  }

  /**
   * Get color class for value type
   */
  const getValueColor = (type: 'income' | 'expense' | 'balance', value?: number): string => {
    switch (type) {
      case 'income':
        return 'text-positive'
      case 'expense':
        return 'text-negative'
      case 'balance':
        return value !== undefined && value >= 0 ? 'text-positive' : 'text-negative'
      default:
        return 'text-gray-900'
    }
  }

  return {
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatDate,
    formatMonthName,
    formatRelativeDate,
    getTrendColor,
    getValueColor
  }
}
