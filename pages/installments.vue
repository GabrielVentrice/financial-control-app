<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Compact Header with inline filter -->
      <header class="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="flex items-baseline gap-3">
          <h1 class="text-[18px] font-medium tracking-tight">Parcelas</h1>
          <span class="px-2 py-0.5 text-[11px] font-medium bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-5 space-y-4">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando parcelas..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards - DENSE -->
          <section class="grid grid-cols-3 gap-3">
            <DenseStatCard
              label="Ativas"
              :value="activeInstallments.length"
              format="number"
              value-color="info"
              :secondary-stat="{ label: 'Futuras', value: '' }"
            />

            <DenseStatCard
              label="Mês Atual"
              :value="currentMonthTotal"
              format="currency"
              value-color="primary"
              :secondary-stat="{ label: formatMonthYear(currentMonth), value: '' }"
            />

            <DenseStatCard
              label="Média"
              :value="averageMonthlyTotal"
              format="currency"
              value-color="success"
              :secondary-stat="{ label: '13 meses', value: '' }"
            />
          </section>

          <!-- Chart - FLAT -->
          <section class="border-l-2 border-l-accent-primary pl-4 py-2">
            <h2 class="text-[14px] font-medium text-text-primary mb-3 tracking-tight">Parcelas por Mês</h2>
            <p class="text-[11px] text-text-muted mb-3">6 meses atrás → 6 meses à frente</p>
            <div class="h-64">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </section>

          <!-- Active Installments List - FLAT -->
          <section class="border-l-2 border-l-accent-info pl-4 py-2">
            <h2 class="text-[14px] font-medium text-text-primary mb-3 tracking-tight">Parcelas Ativas ({{ activeInstallments.length }})</h2>
            <EmptyState
              v-if="activeInstallments.length === 0"
              icon="📅"
              title="Nenhuma parcela ativa"
              description="Você não possui parcelas ou financiamentos ativos no momento."
            />
            <div v-else class="space-y-2.5">
              <div
                v-for="installment in activeInstallments"
                :key="installment.key"
                class="border border-border-base rounded-lg p-3 hover:bg-background-hover transition-colors bg-background-section"
              >
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-text-primary text-[13px] mb-1.5 tracking-tight truncate">{{ installment.description }}</h3>
                    <div class="flex flex-wrap gap-3 text-[11px]">
                      <span class="text-text-secondary">
                        <span class="font-medium">Origem:</span> {{ installment.origin }}
                      </span>
                      <span class="text-text-secondary">
                        <span class="font-medium">Valor:</span> {{ formatCurrencyCompact(installment.amount) }}/mês
                      </span>
                    </div>
                  </div>
                  <div class="text-left lg:text-right lg:ml-4">
                    <div class="text-[18px] font-normal font-serif text-accent-primary">
                      {{ installment.paid }}/{{ installment.total }}
                    </div>
                    <div class="text-[11px] text-text-muted mt-0.5">
                      {{ installment.remaining }} restantes
                    </div>
                    <div class="mt-2">
                      <div class="w-full lg:w-28 bg-background-page rounded-full h-1 border border-border-base">
                        <div
                          class="bg-accent-primary h-1 rounded-full transition-all"
                          :style="{ width: `${(installment.paid / installment.total) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div class="bg-background-page rounded p-2 border border-border-base">
                    <span class="text-text-secondary">Primeira:</span>
                    <span class="font-medium text-text-primary ml-1">{{ formatDateCompact(installment.firstDate) }}</span>
                  </div>
                  <div class="bg-background-page rounded p-2 border border-border-base">
                    <span class="text-text-secondary">Última:</span>
                    <span class="font-medium text-text-primary ml-1">{{ formatDateCompact(installment.lastDate) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Monthly Breakdown - FLAT -->
          <section class="border-t border-border-base overflow-hidden">
            <div class="px-4 py-2.5 bg-background-section border-b border-border-base">
              <h2 class="text-[14px] font-medium text-text-primary tracking-tight">Detalhamento Mensal</h2>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="min-w-full divide-y divide-border-base">
                <thead class="bg-background-section">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Mês
                    </th>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Qtd. Parcelas
                    </th>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-background-card divide-y divide-border-base">
                  <tr
                    v-for="month in monthlyBreakdown"
                    :key="month.monthKey"
                    class="hover:bg-background-hover transition-colors"
                    :class="{ 'bg-background-section': month.monthKey === currentMonth }"
                  >
                    <td class="px-4 py-2.5 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <span
                          v-if="month.monthKey === currentMonth"
                          class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent-primary text-text-inverse uppercase tracking-wide"
                        >
                          Atual
                        </span>
                        <span class="text-[13px] font-medium text-text-primary">{{ formatMonthYearCompact(month.monthKey) }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap">
                      <span class="px-2 py-1 inline-flex text-[11px] font-semibold rounded bg-accent-info/10 text-accent-info border border-accent-info/20">
                        {{ month.count }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap">
                      <div class="text-[13px] font-semibold text-accent-primary">
                        {{ formatCurrencyCompact(month.total) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="lg:hidden divide-y divide-border-base">
              <div
                v-for="month in monthlyBreakdown"
                :key="month.monthKey"
                class="p-3 space-y-2"
                :class="{ 'bg-background-section': month.monthKey === currentMonth }"
              >
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="month.monthKey === currentMonth"
                      class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent-primary text-text-inverse uppercase tracking-wide"
                    >
                      Atual
                    </span>
                    <span class="text-[13px] font-medium text-text-primary">{{ formatMonthYearCompact(month.monthKey) }}</span>
                  </div>
                  <div class="text-[13px] font-semibold text-accent-primary">
                    {{ formatCurrencyCompact(month.total) }}
                  </div>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-text-secondary">Parcelas:</span>
                  <span class="px-2 py-0.5 bg-accent-info/10 text-accent-info rounded font-semibold border border-accent-info/20">
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
