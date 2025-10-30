<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <header class="h-[72px] px-10 flex items-center justify-between border-b border-border-base">
        <div>
          <h1 class="text-22 font-medium tracking-tight">Análise de Parcelas</h1>
          <p class="text-13 text-text-secondary mt-0.5 leading-normal">Visualize parcelas passadas e futuras por período</p>
        </div>
        <button
          @click="refreshData"
          :disabled="loading"
          class="px-[18px] py-[10px] bg-accent-primary hover:bg-accent-primary-hover text-text-inverse rounded-md transition-all duration-200 ease-out font-medium text-15 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>

      <!-- Filter Info -->
      <div class="px-10 py-4 border-b border-border-base">
        <div class="flex items-center gap-2 text-13">
          <span class="font-medium text-text-secondary">Pessoa:</span>
          <span class="px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-md font-semibold border border-accent-primary/20">
            {{ selectedPerson }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-[1280px] px-10 py-8 space-y-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
          <p class="mt-4 text-text-secondary text-15">Carregando dados...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="border-l-[3px] border-l-accent-danger bg-background-card border border-border-base p-5 rounded-lg">
          <h4 class="text-text-primary font-medium text-15">Erro ao carregar dados</h4>
          <p class="text-text-secondary text-13 mt-1 leading-normal">{{ error }}</p>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Parcelas Ativas
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-info tracking-tight">
                {{ activeInstallments.length }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Com parcelas futuras</p>
            </div>
            <div class="bg-background-card border border-border-base rounded-lg px-6 py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Total Mês Atual
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-primary tracking-tight">
                {{ formatCurrency(currentMonthTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">{{ formatMonthYear(currentMonth) }}</p>
            </div>
            <div class="bg-background-card border border-accent-success/20 rounded-lg px-6 py-5 space-y-3 border-l-[3px] border-l-accent-success">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Média Mensal
              </p>
              <p class="text-[32px] font-normal font-serif text-accent-success tracking-tight">
                {{ formatCurrency(averageMonthlyTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Últimos 13 meses</p>
            </div>
          </section>

          <!-- Chart -->
          <section class="bg-background-card border border-border-base rounded-lg p-6">
            <h2 class="text-16 font-medium text-text-primary mb-6 tracking-tight">Parcelas por Mês (6 meses atrás → 6 meses à frente)</h2>
            <div class="h-96">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </section>

          <!-- Active Installments List -->
          <section class="bg-background-card border border-border-base rounded-lg p-6">
            <h2 class="text-16 font-medium text-text-primary mb-6 tracking-tight">Parcelas Ativas ({{ activeInstallments.length }})</h2>
            <div v-if="activeInstallments.length === 0" class="text-center py-12">
              <p class="text-text-secondary text-15">Nenhuma parcela ativa encontrada</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="installment in activeInstallments"
                :key="installment.key"
                class="border border-border-base rounded-lg p-5 hover:bg-background-hover transition-all duration-150 ease-out bg-background-section"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-medium text-text-primary text-16 mb-2 tracking-tight">{{ installment.description }}</h3>
                    <div class="flex flex-wrap gap-4 text-13">
                      <span class="text-text-secondary">
                        <span class="font-medium">Origem:</span> {{ installment.origin }}
                      </span>
                      <span class="text-text-secondary">
                        <span class="font-medium">Valor:</span> {{ formatCurrency(installment.amount) }}/mês
                      </span>
                    </div>
                  </div>
                  <div class="text-right ml-6">
                    <div class="text-[24px] font-normal font-serif text-accent-primary">
                      {{ installment.paid }}/{{ installment.total }}
                    </div>
                    <div class="text-13 text-text-muted mt-1">
                      {{ installment.remaining }} restantes
                    </div>
                    <div class="mt-3">
                      <div class="w-32 bg-background-page rounded-full h-2 border border-border-base">
                        <div
                          class="bg-accent-primary h-2 rounded-full transition-all duration-300 ease-out"
                          :style="{ width: `${(installment.paid / installment.total) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3 text-13">
                  <div class="bg-background-page rounded-md p-3 border border-border-base">
                    <span class="text-text-secondary">Primeira parcela:</span>
                    <span class="font-medium text-text-primary ml-2">{{ formatDate(installment.firstDate) }}</span>
                  </div>
                  <div class="bg-background-page rounded-md p-3 border border-border-base">
                    <span class="text-text-secondary">Última parcela:</span>
                    <span class="font-medium text-text-primary ml-2">{{ formatDate(installment.lastDate) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Monthly Breakdown -->
          <section class="bg-background-card border border-border-base rounded-lg overflow-hidden">
            <div class="px-6 py-4 bg-background-section border-b border-border-base">
              <h2 class="text-16 font-medium text-text-primary tracking-tight">Detalhamento Mensal</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-border-base">
                <thead class="bg-background-section">
                  <tr>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Mês
                    </th>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Qtd. Parcelas
                    </th>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-background-card divide-y divide-border-base">
                  <tr
                    v-for="month in monthlyBreakdown"
                    :key="month.monthKey"
                    class="hover:bg-background-hover transition-all duration-150 ease-out"
                    :class="{ 'bg-background-section': month.monthKey === currentMonth }"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-3">
                        <span
                          v-if="month.monthKey === currentMonth"
                          class="px-2 py-1 text-[11px] font-semibold rounded-md bg-accent-primary text-text-inverse uppercase tracking-wide"
                        >
                          Atual
                        </span>
                        <span class="text-15 font-medium text-text-primary">{{ formatMonthYear(month.monthKey) }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-3 py-1.5 inline-flex text-13 font-semibold rounded-md bg-accent-info/10 text-accent-info border border-accent-info/20">
                        {{ month.count }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-16 font-semibold text-accent-primary">
                        {{ formatCurrency(month.total) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
