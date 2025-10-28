<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-800">Análise de Parcelas</h1>
        <p class="text-gray-600 mt-1">Visualize parcelas passadas e futuras por período</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="px-8 py-4">
      <div class="bg-white rounded-lg shadow px-6 py-3">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">Pessoa:</span>
            <span class="px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
              {{ selectedPerson }}
            </span>
          </div>

          <button
            @click="refreshData"
            :disabled="loading"
            class="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
          >
            {{ loading ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-8 py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-600">Carregando dados...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="px-8 py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-800 font-medium">Erro ao carregar dados</p>
        <p class="text-red-600 text-sm mt-2">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="px-8 pb-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Parcelas Ativas</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ activeInstallments.length }}</p>
          <p class="text-xs text-gray-500 mt-1">Com parcelas futuras</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Total Mês Atual</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatCurrency(currentMonthTotal) }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ formatMonthYear(currentMonth) }}</p>
        </div>
        <div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Média Mensal</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(averageMonthlyTotal) }}</p>
          <p class="text-xs text-white opacity-80 mt-1">Últimos 13 meses</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Parcelas por Mês (6 meses atrás → 6 meses à frente)</h2>
        <div class="h-96">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Active Installments List -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Parcelas Ativas ({{ activeInstallments.length }})</h2>
        <div v-if="activeInstallments.length === 0" class="text-center py-8 text-gray-500">
          <p>Nenhuma parcela ativa encontrada</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="installment in activeInstallments"
            :key="installment.key"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 text-lg">{{ installment.description }}</h3>
                <div class="mt-2 flex flex-wrap gap-4 text-sm">
                  <span class="text-gray-600">
                    <span class="font-medium">Origem:</span> {{ installment.origin }}
                  </span>
                  <span class="text-gray-600">
                    <span class="font-medium">Valor:</span> {{ formatCurrency(installment.amount) }}/mês
                  </span>
                </div>
              </div>
              <div class="text-right ml-4">
                <div class="text-2xl font-bold text-primary-600">
                  {{ installment.paid }}/{{ installment.total }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ installment.remaining }} restantes
                </div>
                <div class="mt-2">
                  <div class="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-primary-600 h-2 rounded-full transition-all"
                      :style="{ width: `${(installment.paid / installment.total) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div class="bg-gray-50 rounded p-2">
                <span class="text-gray-600">Primeira parcela:</span>
                <span class="font-medium text-gray-900 ml-1">{{ formatDate(installment.firstDate) }}</span>
              </div>
              <div class="bg-gray-50 rounded p-2">
                <span class="text-gray-600">Última parcela:</span>
                <span class="font-medium text-gray-900 ml-1">{{ formatDate(installment.lastDate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Breakdown -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Detalhamento Mensal</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mês
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qtd. Parcelas
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="month in monthlyBreakdown"
                :key="month.monthKey"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'bg-primary-50': month.monthKey === currentMonth }"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      v-if="month.monthKey === currentMonth"
                      class="mr-2 px-2 py-1 text-xs font-semibold rounded-full bg-primary-600 text-white"
                    >
                      Atual
                    </span>
                    <span class="text-sm font-medium text-gray-900">{{ formatMonthYear(month.monthKey) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {{ month.count }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-lg font-bold text-primary-600">
                    {{ formatCurrency(month.total) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { Transaction } from '~/types/transaction'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Composables
const { selectedPerson, identifyPerson } = usePersonFilter()
const { processInstallments, parseInstallment, isInstallmentTransaction } = useInstallments()

// State
const rawTransactions = ref<Transaction[]>([])
const transactions = ref<Transaction[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const currentMonth = getCurrentMonth()

// Compute date range (6 months back to 6 months ahead)
const getMonthRange = () => {
  const months: string[] = []
  const now = new Date()

  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push(monthKey)
  }

  return months
}

const monthRange = getMonthRange()

// Filter installment transactions
const installmentTransactions = computed(() => {
  let filtered = transactions.value.filter(t => isInstallmentTransaction(t))

  // Filter by person
  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      const person = identifyPerson(transaction.origin)
      return person === selectedPerson.value
    })
  }

  return filtered
})

// Group installments by series
interface InstallmentSeries {
  key: string
  description: string
  origin: string
  amount: number
  total: number
  paid: number
  remaining: number
  firstDate: string
  lastDate: string
  transactions: Transaction[]
}

const installmentSeries = computed(() => {
  const seriesMap = new Map<string, InstallmentSeries>()

  installmentTransactions.value.forEach(transaction => {
    const installmentInfo = parseInstallment(transaction.description)
    if (!installmentInfo) return

    const key = `${installmentInfo.description}_${transaction.origin}_${installmentInfo.total}`

    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        key,
        description: installmentInfo.description,
        origin: transaction.origin,
        amount: transaction.amount,
        total: installmentInfo.total,
        paid: 0,
        remaining: installmentInfo.total,
        firstDate: transaction.date,
        lastDate: transaction.date,
        transactions: []
      })
    }

    const series = seriesMap.get(key)!
    series.transactions.push(transaction)

    // Update first and last dates
    if (transaction.date < series.firstDate) {
      series.firstDate = transaction.date
    }
    if (transaction.date > series.lastDate) {
      series.lastDate = transaction.date
    }

    // Count paid installments (those in the past or current month)
    const transactionMonth = transaction.date.substring(0, 7)
    if (transactionMonth <= currentMonth) {
      series.paid++
    }
  })

  // Update remaining count
  seriesMap.forEach(series => {
    series.remaining = series.total - series.paid
  })

  return Array.from(seriesMap.values())
})

// Active installments (those with future payments)
const activeInstallments = computed(() => {
  return installmentSeries.value
    .filter(series => series.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)
})

// Monthly breakdown
interface MonthlyData {
  monthKey: string
  count: number
  total: number
}

const monthlyBreakdown = computed(() => {
  const monthlyMap = new Map<string, MonthlyData>()

  // Initialize all months in range
  monthRange.forEach(monthKey => {
    monthlyMap.set(monthKey, {
      monthKey,
      count: 0,
      total: 0
    })
  })

  // Aggregate installment data
  installmentTransactions.value.forEach(transaction => {
    const monthKey = transaction.date.substring(0, 7)

    if (monthlyMap.has(monthKey)) {
      const data = monthlyMap.get(monthKey)!
      data.count++
      data.total += transaction.amount
    }
  })

  return Array.from(monthlyMap.values())
})

// Current month total
const currentMonthTotal = computed(() => {
  const currentData = monthlyBreakdown.value.find(m => m.monthKey === currentMonth)
  return currentData?.total || 0
})

// Average monthly total
const averageMonthlyTotal = computed(() => {
  const total = monthlyBreakdown.value.reduce((sum, m) => sum + m.total, 0)
  return total / monthlyBreakdown.value.length
})

// Chart data
const chartData = computed(() => {
  return {
    labels: monthlyBreakdown.value.map(m => formatMonthYear(m.monthKey)),
    datasets: [
      {
        label: 'Total de Parcelas',
        data: monthlyBreakdown.value.map(m => m.total),
        backgroundColor: monthlyBreakdown.value.map(m =>
          m.monthKey === currentMonth
            ? 'rgba(37, 99, 235, 0.8)'  // Current month - darker blue
            : m.monthKey < currentMonth
              ? 'rgba(156, 163, 175, 0.6)' // Past months - gray
              : 'rgba(59, 130, 246, 0.5)'  // Future months - light blue
        ),
        borderColor: monthlyBreakdown.value.map(m =>
          m.monthKey === currentMonth
            ? 'rgb(29, 78, 216)'
            : m.monthKey < currentMonth
              ? 'rgb(107, 114, 128)'
              : 'rgb(37, 99, 235)'
        ),
        borderWidth: 2
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const value = context.parsed.y
          return `Total: ${formatCurrency(value)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => {
          return `R$ ${value.toLocaleString('pt-BR')}`
        }
      }
    }
  }
}

// Formatting functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

const formatMonthYear = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

// Data loading
const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<Transaction[]>('/api/transactions')
    rawTransactions.value = response

    // Process installments to expand them across months
    const processed = processInstallments(response)
    transactions.value = processed
  } catch (e) {
    error.value = 'Não foi possível carregar os dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>
