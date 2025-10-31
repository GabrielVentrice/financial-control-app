<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Compact Header with inline filter -->
      <header class="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="flex items-baseline gap-3">
          <h1 class="text-[18px] font-medium tracking-tight">Custos Fixos</h1>
          <span class="px-2 py-0.5 text-[11px] font-medium bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refreshData" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Categories Info - COMPACT -->
      <div v-if="FIXED_COST_CATEGORIES.length > 0" class="px-6 lg:px-10 py-3 border-b border-border-base">
        <details class="text-[11px]">
          <summary class="cursor-pointer text-text-primary font-medium hover:text-accent-primary transition-colors">
            📌 {{ FIXED_COST_CATEGORIES.length }} categorias configuradas
          </summary>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="category in FIXED_COST_CATEGORIES"
              :key="category"
              class="px-1.5 py-0.5 bg-accent-warning/10 text-accent-warning text-[10px] rounded border border-accent-warning/20 font-medium uppercase tracking-wide"
            >
              {{ category }}
            </span>
          </div>
        </details>
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-5 space-y-4">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando custos fixos..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards - DENSE -->
          <section class="grid grid-cols-3 gap-3">
            <DenseStatCard
              label="Mês Atual"
              :value="currentMonthTotal"
              format="currency"
              value-color="warning"
              :secondary-stat="{ label: formatCurrentMonthCompact(), value: '' }"
            />

            <DenseStatCard
              label="Média"
              :value="averageMonthlyTotal"
              format="currency"
              value-color="info"
              :secondary-stat="{ label: '6 meses', value: '' }"
            />

            <DenseStatCard
              label="Categorias"
              :value="activeCategoriesCount"
              format="number"
              value-color="primary"
              :secondary-stat="{ label: 'Ativas', value: '' }"
            />
          </section>

          <!-- Chart - FLAT -->
          <section class="border-l-2 border-l-accent-warning pl-4 py-2">
            <h2 class="text-[14px] font-medium text-text-primary mb-3 tracking-tight">Evolução dos Custos Fixos</h2>
            <div class="h-64">
              <Bar
                v-if="chartData"
                :data="chartData"
                :options="chartOptions"
              />
            </div>
          </section>

          <!-- Detailed Table - FLAT -->
          <section class="border-t border-border-base overflow-hidden">
            <div class="px-4 py-2.5 bg-background-section border-b border-border-base">
              <h2 class="text-[14px] font-medium text-text-primary tracking-tight">Detalhamento por Categoria</h2>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="min-w-full divide-y divide-border-base">
                <thead class="bg-background-section">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-[11px] font-medium text-text-secondary uppercase tracking-wide sticky left-0 bg-background-section z-10">
                      Categoria
                    </th>
                    <th
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-4 py-2.5 text-right text-[11px] font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap"
                    >
                      {{ month }}
                    </th>
                    <th class="px-4 py-2.5 text-right text-[11px] font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap bg-background-hover">
                      Total
                    </th>
                    <th class="px-4 py-2.5 text-right text-[11px] font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap bg-background-hover">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-background-card divide-y divide-border-base">
                  <tr
                    v-for="category in categoryBreakdown"
                    :key="category.name"
                    class="hover:bg-background-hover transition-colors"
                  >
                    <td class="px-4 py-2.5 whitespace-nowrap sticky left-0 bg-background-card">
                      <div class="flex items-center gap-2">
                        <span class="text-[14px]">{{ getCategoryIcon(category.name) }}</span>
                        <span class="text-[13px] font-medium text-text-primary">{{ category.name }}</span>
                      </div>
                    </td>
                    <td
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-4 py-2.5 whitespace-nowrap text-right text-[13px]"
                      :class="getCellClass(category.monthlyTotals[month])"
                    >
                      {{ formatCurrencyCompact(category.monthlyTotals[month] || 0) }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-right font-semibold text-[13px] text-text-primary bg-background-section">
                      {{ formatCurrencyCompact(category.total) }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-right text-[13px] text-text-secondary bg-background-section">
                      {{ formatCurrencyCompact(category.average) }}
                    </td>
                  </tr>

                  <!-- Total Row -->
                  <tr class="bg-background-hover font-semibold">
                    <td class="px-4 py-2.5 whitespace-nowrap sticky left-0 bg-background-hover text-[13px] text-text-primary">
                      TOTAL
                    </td>
                    <td
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-4 py-2.5 whitespace-nowrap text-right text-[13px] text-text-primary"
                    >
                      {{ formatCurrencyCompact(getMonthTotal(month)) }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-right text-[13px] text-accent-primary bg-background-section">
                      {{ formatCurrencyCompact(grandTotal) }}
                    </td>
                    <td class="px-4 py-2.5 whitespace-nowrap text-right text-[13px] text-accent-primary bg-background-section">
                      {{ formatCurrencyCompact(averageMonthlyTotal) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards - COMPACT -->
            <div class="lg:hidden divide-y divide-border-base">
              <div
                v-for="category in categoryBreakdown"
                :key="category.name"
                class="p-3 space-y-2"
              >
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="text-[14px]">{{ getCategoryIcon(category.name) }}</span>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-[13px] font-medium text-text-primary truncate">{{ category.name }}</h3>
                      <div class="flex items-center gap-2 text-[11px] text-text-muted">
                        <span>Total: {{ formatCurrencyCompact(category.total) }}</span>
                        <span>Média: {{ formatCurrencyCompact(category.average) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Monthly Values -->
                <div class="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div
                    v-for="(month, index) in monthLabels"
                    :key="month"
                    class="flex justify-between p-1.5 bg-background-section rounded"
                  >
                    <span class="text-text-secondary">{{ month }}:</span>
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
              <div class="p-3 bg-background-hover space-y-2">
                <h3 class="text-[13px] font-semibold text-text-primary">TOTAL GERAL</h3>
                <div class="grid grid-cols-2 gap-3 text-[12px]">
                  <div class="text-right">
                    <span class="text-text-secondary">Total: </span>
                    <span class="font-semibold text-accent-primary">{{ formatCurrencyCompact(grandTotal) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-text-secondary">Média: </span>
                    <span class="font-semibold text-accent-primary">{{ formatCurrencyCompact(averageMonthlyTotal) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="categoryBreakdown.length === 0"
              icon="💰"
              title="Nenhum custo fixo encontrado"
              description="Não há custos fixos registrados nos últimos 6 meses para as categorias configuradas."
            />
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
  Legend,
  type ChartOptions
} from 'chart.js'
import type { Transaction } from '~/types/transaction'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Composables
const { selectedPerson } = usePersonFilter()
const { processInstallments } = useInstallments()

// State
const rawTransactions = ref<Transaction[]>([])
const transactions = ref<Transaction[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

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
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 2,
        borderRadius: 4
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
      backgroundColor: '#1F1F1F',
      titleColor: '#F3F3F3',
      bodyColor: '#B0B0B0',
      borderColor: '#2E2E2E',
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
        color: '#B0B0B0',
        font: {
          size: 13
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#2E2E2E'
      },
      ticks: {
        color: '#B0B0B0',
        font: {
          size: 13
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

const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase()

  if (name.includes('installment') || name.includes('financing') || name.includes('parcela')) {
    return '📅'
  }
  if (name.includes('rent') || name.includes('aluguel')) {
    return '🏠'
  }
  if (name.includes('subscription') || name.includes('software') || name.includes('assinatura')) {
    return '💻'
  }
  if (name.includes('utilities') || name.includes('utility') || name.includes('água') ||
      name.includes('luz') || name.includes('gas') || name.includes('internet')) {
    return '📄'
  }
  if (name.includes('business') || name.includes('tax') || name.includes('imposto')) {
    return '💼'
  }
  if (name.includes('investment') || name.includes('investimento')) {
    return '📈'
  }
  if (name.includes('insurance') || name.includes('seguro')) {
    return '🛡️'
  }

  return '💰'
}

const getCellClass = (value: number | undefined) => {
  if (!value || value === 0) {
    return 'text-text-muted'
  }
  return 'text-text-primary font-medium'
}

const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<Transaction[]>('/api/transactions')
    rawTransactions.value = response

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
