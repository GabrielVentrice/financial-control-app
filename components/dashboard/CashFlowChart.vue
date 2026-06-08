<template>
  <div class="bg-white border border-gray-100 rounded-xl p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Fluxo de Caixa</h2>
      <span class="text-[11px] text-gray-500">Últimos 6 meses</span>
    </div>

    <!-- Chart Container -->
    <div class="h-64" role="img" aria-label="Grafico de barras de fluxo de caixa dos ultimos 6 meses, comparando receitas, despesas e saldo por mes">
      <Bar
        v-if="chartData"
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <!-- Legend -->
    <div class="mt-4 flex items-center justify-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-sm bg-positive"></div>
        <span class="text-[11px] text-gray-500">Receitas</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-sm" style="background-color: rgba(220, 38, 38, 0.7)"></div>
        <span class="text-[11px] text-gray-500">Despesas</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-sm bg-gray-300"></div>
        <span class="text-[11px] text-gray-500">Saldo</span>
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: Transaction[]
}

const props = defineProps<Props>()

const { formatCurrency, formatMonthName } = useFormatters()
const { getCurrentMonthStats } = useDashboardAnalytics()

const EXCLUDED_CATEGORIES = ['adjustment']
const EXCLUDED_DESCRIPTIONS = ['pagamento debito automatico']

const isIncome = (transaction: Transaction): boolean => {
  return transaction.destination.toLowerCase().includes('bank account')
}

const isExpense = (transaction: Transaction): boolean => {
  const originLower = transaction.origin.toLowerCase()
  return originLower.includes('bank account') || originLower.includes('credit card')
}

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
    .filter(t => isExpense(t) && !EXCLUDED_CATEGORIES.includes((t.destination || '').toLowerCase()) && !EXCLUDED_DESCRIPTIONS.includes((t.description || '').toLowerCase()))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return {
    income,
    expenses,
    balance: income - expenses,
    monthName: formatMonthName(targetMonth, true)
  }
}

const chartData = computed<ChartData<'bar'>>(() => {
  const last6Months = [-5, -4, -3, -2, -1, 0].map(offset => getMonthStats(offset))

  // Balance can be negative; render negative bars with a distinct dashed,
  // low-opacity style so they read clearly against the visible zero line.
  const balances = last6Months.map(m => m.balance)
  const balanceFill = balances.map(b => (b >= 0 ? '#D1D5DB' : 'rgba(156, 163, 175, 0.2)'))
  const balanceBorder = balances.map(b => (b >= 0 ? '#D1D5DB' : '#9CA3AF'))
  const balanceBorderWidth = balances.map(b => (b >= 0 ? 0 : 1.5))

  return {
    labels: last6Months.map(m => m.monthName),
    datasets: [
      {
        label: 'Receitas',
        data: last6Months.map(m => m.income),
        backgroundColor: '#059669',
        borderColor: '#059669',
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 40
      },
      {
        label: 'Despesas',
        data: last6Months.map(m => m.expenses),
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
        borderColor: 'rgba(220, 38, 38, 0.7)',
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 40
      },
      {
        label: 'Saldo',
        data: balances,
        backgroundColor: balanceFill,
        borderColor: balanceBorder,
        borderWidth: balanceBorderWidth,
        borderDash: [4, 4],
        borderRadius: 4,
        maxBarThickness: 40
      }
    ]
  }
})

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleColor: '#F9FAFB',
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
        color: '#6B7280',
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        }
      }
    },
    y: {
      grid: {
        // Emphasize the zero line so negative balance bars are readable.
        color: (ctx) => (ctx.tick.value === 0 ? '#9CA3AF' : '#F3F4F6'),
        lineWidth: (ctx) => (ctx.tick.value === 0 ? 1.5 : 1),
        drawBorder: false
      },
      border: {
        display: false,
        dash: [4, 4]
      },
      ticks: {
        color: '#6B7280',
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        },
        callback: (value) => {
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
