<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">Fluxo de Caixa</h3>
      <span class="text-xs text-gray-500">Últimos 6 meses</span>
    </div>

    <!-- Chart Container -->
    <div class="p-4">
      <div class="h-64">
        <Bar
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>

    <!-- Legend - Minimal and clean -->
    <div class="px-4 pb-4 flex items-center justify-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-sm bg-positive"></div>
        <span class="text-xs text-gray-600">Receitas</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-sm bg-negative"></div>
        <span class="text-xs text-gray-600">Despesas</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-sm bg-gray-300"></div>
        <span class="text-xs text-gray-600">Saldo</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData
} from 'chart.js'
import type { Transaction } from '~/types/transaction'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: Transaction[]
}

const props = defineProps<Props>()

const { formatCurrency, formatMonthName } = useFormatters()
const { getCurrentMonthStats } = useDashboardAnalytics()

// Helper to check if transaction is income
const isIncome = (transaction: Transaction): boolean => {
  return transaction.destination.toLowerCase().includes('bank account')
}

// Helper to check if transaction is expense
const isExpense = (transaction: Transaction): boolean => {
  const originLower = transaction.origin.toLowerCase()
  return originLower.includes('bank account') || originLower.includes('credit card')
}

// Get stats for a specific month offset
const getMonthStats = (monthOffset: number = 0) => {
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const targetMonth = targetDate.getMonth()
  const targetYear = targetDate.getFullYear()

  const monthTransactions = props.transactions.filter(t => {
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
    monthName: formatMonthName(targetMonth, true)
  }
}

// Prepare chart data for last 6 months
const chartData = computed<ChartData<'bar'>>(() => {
  const last6Months = [-5, -4, -3, -2, -1, 0].map(offset => getMonthStats(offset))

  return {
    labels: last6Months.map(m => m.monthName),
    datasets: [
      {
        label: 'Receitas',
        data: last6Months.map(m => m.income),
        backgroundColor: '#059669', // positive color
        borderColor: '#059669',
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 40
      },
      {
        label: 'Despesas',
        data: last6Months.map(m => m.expenses),
        backgroundColor: '#DC2626', // negative color
        borderColor: '#DC2626',
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 40
      },
      {
        label: 'Saldo',
        data: last6Months.map(m => m.balance),
        backgroundColor: '#D1D5DB', // gray-300
        borderColor: '#D1D5DB',
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 40
      }
    ]
  }
})

// Chart.js options - Clean and professional
const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: false // Using custom legend below
    },
    tooltip: {
      backgroundColor: '#1F2937', // gray-800
      titleColor: '#F9FAFB', // gray-50
      bodyColor: '#F9FAFB',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      usePointStyle: true,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          return `${label}: ${formatCurrency(value)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      border: {
        display: false
      },
      ticks: {
        color: '#6B7280', // gray-500
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        }
      }
    },
    y: {
      grid: {
        color: '#F3F4F6', // gray-100
        drawBorder: false
      },
      border: {
        display: false,
        dash: [4, 4]
      },
      ticks: {
        color: '#6B7280', // gray-500
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        },
        callback: (value) => {
          // Format ticks as compact currency
          const numValue = typeof value === 'number' ? value : 0
          if (Math.abs(numValue) >= 1000) {
            return formatCurrency(numValue, { compact: true })
          }
          return formatCurrency(numValue)
        }
      }
    }
  }
}))
</script>
