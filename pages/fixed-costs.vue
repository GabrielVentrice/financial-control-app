<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] min-h-screen">
      <!-- Header -->
      <header class="h-14 px-6 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-10">
        <div>
          <h1 class="text-lg font-semibold text-[#111111] tracking-tight">Custos Fixos</h1>
          <p class="text-[13px] text-gray-500">{{ selectedPerson }}</p>
        </div>
        <button
          @click="refreshData"
          :disabled="loading || refreshing"
          class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Atualizar dados"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      <!-- Categories Info -->
      <div v-if="FIXED_COST_CATEGORIES.length > 0" class="px-6 py-3 bg-white">
        <details class="text-[13px]">
          <summary class="cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
            {{ FIXED_COST_CATEGORIES.length }} categorias configuradas
          </summary>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="category in FIXED_COST_CATEGORIES"
              :key="category"
              class="px-2 py-1 bg-gray-50 text-gray-500 text-[11px] rounded"
            >
              {{ category }}
            </span>
          </div>
        </details>
      </div>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando custos fixos..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards -->
          <section class="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-100">
            <LightStatCard
              label="Mes Atual"
              :value="currentMonthTotal"
              format="currency"
              value-color="warning"
              size="lg"
              :secondary-stat="{ label: formatCurrentMonthCompact(), value: '' }"
            />

            <LightStatCard
              label="Media Mensal"
              :value="averageMonthlyTotal"
              format="currency"
              value-color="neutral"
              size="lg"
              :secondary-stat="{ label: '6 meses', value: '' }"
            />

            <LightStatCard
              label="Categorias Ativas"
              :value="activeCategoriesCount"
              format="number"
              value-color="neutral"
              size="lg"
              :secondary-stat="{ label: 'Com gastos', value: '' }"
            />
          </section>

          <!-- Chart + Table -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Chart -->
            <div class="px-6 py-5">
              <div class="mb-5">
                <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Evolucao dos Custos Fixos</h2>
                <p class="text-[13px] text-gray-500 mt-1">Ultimos 6 meses</p>
              </div>
              <div class="h-64">
                <Bar
                  v-if="chartData"
                  :data="chartData"
                  :options="chartOptions"
                />
              </div>
            </div>

            <!-- Detailed Table -->
            <div class="overflow-hidden flex flex-col" style="max-height: 400px;">
              <div class="px-1 py-3 flex-shrink-0">
                <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhamento</h2>
                <p class="text-[13px] text-gray-500 mt-1">Valores mensais</p>
              </div>

              <!-- Desktop Table -->
              <div class="hidden lg:block overflow-x-auto overflow-y-auto flex-1">
              <table class="min-w-full">
                <thead>
                  <tr>
                    <th class="px-4 py-3 text-left text-[11px] font-normal text-gray-500 sticky left-0 bg-[#FAFBFC] z-10">
                      Categoria
                    </th>
                    <th
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-4 py-3 text-right text-[11px] font-normal text-gray-500 whitespace-nowrap"
                    >
                      {{ month }}
                    </th>
                    <th class="px-4 py-3 text-right text-[11px] font-normal text-gray-500 whitespace-nowrap">
                      Total
                    </th>
                    <th class="px-4 py-3 text-right text-[11px] font-normal text-gray-500 whitespace-nowrap">
                      Media
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="category in categoryBreakdown"
                    :key="category.name"
                    class="hover:bg-gray-50/80 transition-colors"
                  >
                    <td class="px-4 py-5 whitespace-nowrap sticky left-0 bg-[#FAFBFC]">
                      <span class="text-[13px] font-normal text-gray-700">{{ category.name }}</span>
                    </td>
                    <td
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-4 py-5 whitespace-nowrap text-right text-[13px]"
                      :class="getCellClass(category.monthlyTotals[month])"
                    >
                      {{ formatCurrencyCompact(category.monthlyTotals[month] || 0) }}
                    </td>
                    <td class="px-4 py-5 whitespace-nowrap text-right text-[15px] font-medium text-[#111111]">
                      {{ formatCurrencyCompact(category.total) }}
                    </td>
                    <td class="px-4 py-5 whitespace-nowrap text-right text-[13px] text-gray-500">
                      {{ formatCurrencyCompact(category.average) }}
                    </td>
                  </tr>

                  <!-- Total Row -->
                  <tr class="font-normal border-t border-gray-200">
                    <td class="px-4 py-5 whitespace-nowrap sticky left-0 bg-[#FAFBFC] text-[13px] text-gray-700 font-medium">
                      TOTAL
                    </td>
                    <td
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-4 py-5 whitespace-nowrap text-right text-[13px] text-gray-700"
                    >
                      {{ formatCurrencyCompact(getMonthTotal(month)) }}
                    </td>
                    <td class="px-4 py-5 whitespace-nowrap text-right text-kpi-sm text-[#111111]">
                      {{ formatCurrencyCompact(grandTotal) }}
                    </td>
                    <td class="px-4 py-5 whitespace-nowrap text-right text-[15px] font-medium text-[#111111]">
                      {{ formatCurrencyCompact(averageMonthlyTotal) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

              <!-- Mobile Cards -->
              <div class="lg:hidden overflow-y-auto flex-1">
              <div
                v-for="category in categoryBreakdown"
                :key="category.name"
                class="p-3 space-y-2"
              >
                <div class="flex items-start justify-between">
                  <div class="min-w-0 flex-1">
                    <h3 class="text-[13px] font-medium text-gray-700 truncate">{{ category.name }}</h3>
                    <div class="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>Total: {{ formatCurrencyCompact(category.total) }}</span>
                      <span>Media: {{ formatCurrencyCompact(category.average) }}</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div
                    v-for="(month, index) in monthLabels"
                    :key="month"
                    class="flex justify-between p-1.5 bg-gray-50 rounded"
                  >
                    <span class="text-gray-500">{{ month }}:</span>
                    <span
                      :class="getCellClass(category.monthlyTotals[last6Months[index]])"
                      class="font-medium"
                    >
                      {{ formatCurrencyCompact(category.monthlyTotals[last6Months[index]] || 0) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Mobile Total -->
              <div class="p-3 space-y-2">
                <h3 class="text-[13px] font-semibold text-gray-700">TOTAL GERAL</h3>
                <div class="grid grid-cols-2 gap-3 text-[12px]">
                  <div class="text-right">
                    <span class="text-gray-500">Total: </span>
                    <span class="font-semibold text-[#111111]">{{ formatCurrencyCompact(grandTotal) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-gray-500">Media: </span>
                    <span class="font-semibold text-[#111111]">{{ formatCurrencyCompact(averageMonthlyTotal) }}</span>
                  </div>
                </div>
              </div>
            </div>

              <!-- Empty State -->
              <EmptyState
                v-if="categoryBreakdown.length === 0"
                icon="💰"
                title="Nenhum custo fixo encontrado"
                description="Nao ha custos fixos registrados nos ultimos 6 meses para as categorias configuradas."
              />
            </div>
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
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
  type ChartOptions
} from 'chart.js'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Composables - transactions fetched automatically via SSR
const {
  transactions: rawTransactions,
  loading,
  error,
  refreshing,
  refreshCache
} = useTransactions()

const { selectedPerson } = usePersonFilter()
const { processInstallments } = useInstallments()
const { fetchCacheStatus } = useCacheStatus()

// Process installments to expand them across months
const transactions = computed(() => processInstallments(rawTransactions.value))

// ===== CONFIGURAÇÃO: Categorias de Custos Fixos =====
const FIXED_COST_CATEGORIES = [
  'Installments/Financing',
  'Rent',
  'Financing',
  'Subscriptions/Softwares',
  'Utilities',
  'Business & Taxes',
  'Investments',
  'Insurance',
  'Medical'
]

// Helper function to check if a category is a fixed cost
const isFixedCostCategory = (categoryName: string): boolean => {
  const lowerCaseName = categoryName.toLowerCase()
  return FIXED_COST_CATEGORIES.some(fixed =>
    lowerCaseName.includes(fixed.toLowerCase())
  )
}

// Generate last 6 months including current month
const getLast6Months = () => {
  const months = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }

  return months
}

const last6Months = getLast6Months()

// Format month for display
const formatMonthLabel = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const monthLabels = computed(() => last6Months.map(formatMonthLabel))

// Filter transactions by person
const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      return transaction.person === selectedPerson.value
    })
  }

  return filtered
})

// Filter only fixed cost transactions
const fixedCostTransactions = computed(() => {
  return filteredTransactions.value.filter(t => {
    const category = t.destination || 'Sem Categoria'
    return isFixedCostCategory(category)
  })
})

// Get transactions for a specific month
const getMonthTransactions = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-')
  return fixedCostTransactions.value.filter(t => {
    const date = new Date(t.date)
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1
  })
}

// Calculate monthly totals
const monthlyTotals = computed(() => {
  const totals: Record<string, number> = {}

  last6Months.forEach(month => {
    const monthTransactions = getMonthTransactions(month)
    totals[month] = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
  })

  return totals
})

// Current month data
const currentMonthTotal = computed(() => {
  const currentMonth = last6Months[last6Months.length - 1]
  return monthlyTotals.value[currentMonth] || 0
})

const currentMonthLabel = computed(() => {
  const currentMonth = last6Months[last6Months.length - 1]
  const [year, month] = currentMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

// Average monthly total
const averageMonthlyTotal = computed(() => {
  const total = Object.values(monthlyTotals.value).reduce((sum, val) => sum + val, 0)
  return total / last6Months.length
})

// Grand total
const grandTotal = computed(() => {
  return Object.values(monthlyTotals.value).reduce((sum, val) => sum + val, 0)
})

// Active categories (categories with expenses in the period)
const activeCategoriesCount = computed(() => {
  const categories = new Set<string>()
  fixedCostTransactions.value.forEach(t => {
    const category = t.destination || 'Sem Categoria'
    categories.add(category)
  })
  return categories.size
})

// Category breakdown
interface CategoryBreakdown {
  name: string
  monthlyTotals: Record<string, number>
  total: number
  average: number
}

const categoryBreakdown = computed(() => {
  const categoryMap = new Map<string, CategoryBreakdown>()

  fixedCostTransactions.value.forEach(transaction => {
    const category = transaction.destination || 'Sem Categoria'
    const date = new Date(transaction.date)
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!last6Months.includes(yearMonth)) return

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        name: category,
        monthlyTotals: {},
        total: 0,
        average: 0
      })
    }

    const data = categoryMap.get(category)!
    data.monthlyTotals[yearMonth] = (data.monthlyTotals[yearMonth] || 0) + transaction.amount
    data.total += transaction.amount
  })

  const result: CategoryBreakdown[] = []
  categoryMap.forEach(data => {
    data.average = data.total / last6Months.length
    result.push(data)
  })

  return result.sort((a, b) => b.total - a.total)
})

// Get total for a specific month (formatted label)
const getMonthTotal = (monthLabel: string) => {
  const index = monthLabels.value.indexOf(monthLabel)
  if (index === -1) return 0
  const yearMonth = last6Months[index]
  return monthlyTotals.value[yearMonth] || 0
}

// Chart data
const chartData = computed(() => {
  return {
    labels: monthLabels.value,
    datasets: [
      {
        label: 'Custo Fixo Mensal',
        data: last6Months.map(month => monthlyTotals.value[month] || 0),
        backgroundColor: 'rgba(251, 191, 36, 0.6)',
        borderColor: 'rgba(251, 191, 36, 0.8)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  }
})

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleColor: '#F9FAFB',
      bodyColor: '#9CA3AF',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context) => {
          const value = context.parsed.y
          return `Custo: ${formatCurrency(value || 0)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#F3F4F6'
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        },
        callback: (value) => {
          return 'R$ ' + (value as number).toLocaleString('pt-BR')
        }
      }
    }
  }
}

// Methods
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

const formatCurrentMonthCompact = () => {
  const currentMonth = last6Months[last6Months.length - 1]
  const [year, month] = currentMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const getCellClass = (value: number | undefined) => {
  if (!value || value === 0) {
    return 'text-gray-500'
  }
  return 'text-gray-700 font-normal'
}

// Refresh cache and reload data
const refreshData = async () => {
  try {
    const result = await refreshCache()

    if (result.success) {
      console.log('Cache atualizado:', result.message)
    }

    await fetchCacheStatus()
  } catch (e) {
    console.error('Error refreshing data:', e)
  }
}
</script>
