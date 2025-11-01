<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] text-gray-800 min-h-screen">
      <!-- Header - Clean, sem bordas pesadas -->
      <header class="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-baseline gap-4">
          <h1 class="text-2xl font-normal tracking-tight text-gray-800">Parcelas</h1>
          <span class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-10 space-y-12">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando parcelas..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards - 3 COLUNAS Light Design -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <LightStatCard
              label="Ativas"
              :value="activeInstallments.length"
              format="number"
              value-color="info"
              size="lg"
              :secondary-stat="{ label: 'Futuras', value: '' }"
            />

            <LightStatCard
              label="Mês Atual"
              :value="currentMonthTotal"
              format="currency"
              value-color="primary"
              size="lg"
              :secondary-stat="{ label: formatMonthYear(currentMonth), value: '' }"
            />

            <LightStatCard
              label="Média Mensal"
              :value="averageMonthlyTotal"
              format="currency"
              value-color="success"
              size="lg"
              :secondary-stat="{ label: '13 meses', value: '' }"
            />
          </section>

          <!-- Chart - Light Design -->
          <section class="space-y-5">
            <h2 class="text-lg font-normal text-gray-700">Parcelas por Mês</h2>
            <p class="text-sm text-gray-400">6 meses atrás → 6 meses à frente</p>
            <div class="h-64">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </section>

          <!-- Active Installments List - Light Design -->
          <section class="space-y-5">
            <h2 class="text-lg font-normal text-gray-700">Parcelas Ativas ({{ activeInstallments.length }})</h2>
            <EmptyState
              v-if="activeInstallments.length === 0"
              icon="📅"
              title="Nenhuma parcela ativa"
              description="Você não possui parcelas ou financiamentos ativos no momento."
            />
            <div v-else class="space-y-6">
              <div
                v-for="installment in activeInstallments"
                :key="installment.key"
                class="bg-gray-50/50 rounded-2xl px-8 py-7 hover:bg-gray-50 transition-colors"
              >
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-normal text-gray-800 text-base mb-3 truncate">{{ installment.description }}</h3>
                    <div class="flex flex-wrap gap-6 text-sm text-gray-500">
                      <span>
                        <span class="text-gray-400">Origem:</span> {{ installment.origin }}
                      </span>
                      <span>
                        <span class="text-gray-400">Valor:</span> {{ formatCurrencyCompact(installment.amount) }}/mês
                      </span>
                    </div>
                  </div>
                  <div class="text-left lg:text-right lg:ml-4">
                    <div class="text-3xl font-light text-blue-500">
                      {{ installment.paid }}/{{ installment.total }}
                    </div>
                    <div class="text-sm text-gray-400 mt-1">
                      {{ installment.remaining }} restantes
                    </div>
                    <div class="mt-3">
                      <div class="w-full lg:w-32 bg-gray-100 rounded-full h-[2px]">
                        <div
                          class="bg-gradient-to-r from-blue-400 to-blue-500 h-[2px] rounded-full transition-all"
                          :style="{ width: `${(installment.paid / installment.total) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-400">Primeira:</span>
                    <span class="font-normal text-gray-700 ml-2">{{ formatDateCompact(installment.firstDate) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Última:</span>
                    <span class="font-normal text-gray-700 ml-2">{{ formatDateCompact(installment.lastDate) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Monthly Breakdown - Light Design -->
          <section class="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div class="px-6 py-4 border-b border-gray-100">
              <h2 class="text-lg font-normal text-gray-700">Detalhamento Mensal</h2>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gray-50/50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Mês
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Qtd. Parcelas
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="month in monthlyBreakdown"
                    :key="month.monthKey"
                    class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    :class="{ 'bg-gray-50': month.monthKey === currentMonth }"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-3">
                        <span
                          v-if="month.monthKey === currentMonth"
                          class="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-600"
                        >
                          Atual
                        </span>
                        <span class="text-sm font-normal text-gray-700">{{ formatMonthYearCompact(month.monthKey) }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-500">
                        {{ month.count }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-base font-light text-gray-800">
                        {{ formatCurrencyCompact(month.total) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="lg:hidden divide-y divide-gray-100">
              <div
                v-for="month in monthlyBreakdown"
                :key="month.monthKey"
                class="p-5 space-y-3"
                :class="{ 'bg-gray-50': month.monthKey === currentMonth }"
              >
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3">
                    <span
                      v-if="month.monthKey === currentMonth"
                      class="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-600"
                    >
                      Atual
                    </span>
                    <span class="text-sm font-normal text-gray-700">{{ formatMonthYearCompact(month.monthKey) }}</span>
                  </div>
                  <div class="text-base font-light text-gray-800">
                    {{ formatCurrencyCompact(month.total) }}
                  </div>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-400">Parcelas:</span>
                  <span class="text-gray-500">
                    {{ month.count }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
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
const { selectedPerson } = usePersonFilter()
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
      return transaction.person === selectedPerson.value
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
            ? 'rgba(59, 130, 246, 0.8)'  // Current month - blue-500
            : m.monthKey < currentMonth
              ? 'rgba(156, 163, 175, 0.5)' // Past months - gray-400
              : 'rgba(96, 165, 250, 0.5)'  // Future months - blue-400
        ),
        borderColor: monthlyBreakdown.value.map(m =>
          m.monthKey === currentMonth
            ? 'rgb(59, 130, 246)'
            : m.monthKey < currentMonth
              ? 'rgb(156, 163, 175)'
              : 'rgb(96, 165, 250)'
        ),
        borderWidth: 1
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
      backgroundColor: '#1F1F1F',
      titleColor: '#F3F3F3',
      bodyColor: '#B0B0B0',
      borderColor: '#2E2E2E',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => {
          const value = context.parsed.y
          return `Total: ${formatCurrency(value)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#B0B0B0',
        font: {
          size: 13
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#2E2E2E',
        drawBorder: false,
      },
      ticks: {
        color: '#B0B0B0',
        font: {
          size: 13
        },
        callback: (value: any) => {
          return 'R$ ' + value.toLocaleString('pt-BR')
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

const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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

const formatDateCompact = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
  } catch {
    return dateString
  }
}

const formatMonthYear = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

const formatMonthYearCompact = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
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
