<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Header -->
      <PageHeader
        title="Histórico de Custos Fixos"
        subtitle="Análise dos últimos 6 meses de custos fixos"
      >
        <template #actions>
          <BaseButton @click="refreshData" :loading="loading">
            Atualizar
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Filter Info -->
      <div class="px-6 lg:px-10 py-6 border-b border-border-base">
        <div class="flex items-center gap-2 text-13 mb-4">
          <span class="font-medium text-text-secondary whitespace-nowrap">Pessoa:</span>
          <span class="px-2 sm:px-3 py-1 sm:py-1.5 bg-accent-primary/10 text-accent-primary rounded-md font-semibold border border-accent-primary/20 text-12 sm:text-13">
            {{ selectedPerson }}
          </span>
        </div>

        <!-- Fixed Cost Categories Info -->
        <div v-if="FIXED_COST_CATEGORIES.length > 0" class="border-l-[3px] border-l-accent-warning bg-background-card border border-border-base p-3 sm:p-4 rounded-lg">
          <details class="text-13">
            <summary class="cursor-pointer text-text-primary font-medium hover:text-accent-primary transition-colors">
              📌 {{ FIXED_COST_CATEGORIES.length }} categoria(s) configurada(s) como custo fixo
            </summary>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="category in FIXED_COST_CATEGORIES"
                :key="category"
                class="px-2 py-1 bg-accent-warning/10 text-accent-warning text-[10px] sm:text-[11px] rounded-md border border-accent-warning/20 font-medium uppercase tracking-wide"
              >
                {{ category }}
              </span>
            </div>
            <p class="mt-3 text-[10px] sm:text-[11px] text-text-muted leading-normal">
              Para modificar, edite FIXED_COST_CATEGORIES em pages/fixed-costs.vue
            </p>
          </details>
        </div>
      </div>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8 space-y-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando custos fixos..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards -->
          <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="bg-background-card border border-accent-warning/20 rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3 border-l-[3px] border-l-accent-warning sm:col-span-2 lg:col-span-1">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Custo Fixo Atual
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-warning tracking-tight break-all">
                {{ formatCurrency(currentMonthTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">{{ currentMonthLabel }}</p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Média Mensal
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-info tracking-tight break-all">
                {{ formatCurrency(averageMonthlyTotal) }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Últimos 6 meses</p>
            </div>

            <div class="bg-background-card border border-border-base rounded-lg px-4 sm:px-6 py-4 sm:py-5 space-y-3">
              <p class="text-text-secondary text-13 font-medium uppercase tracking-wide">
                Categorias Ativas
              </p>
              <p class="text-[24px] sm:text-[28px] lg:text-[32px] font-normal font-serif text-accent-primary tracking-tight">
                {{ activeCategoriesCount }}
              </p>
              <p class="text-text-muted text-13 leading-normal">Com gastos no período</p>
            </div>
          </section>

          <!-- Chart -->
          <section class="bg-background-card border border-border-base rounded-lg p-4 sm:p-6">
            <h2 class="text-15 sm:text-16 font-medium text-text-primary mb-4 sm:mb-6 tracking-tight">Evolução dos Custos Fixos</h2>
            <div class="h-64 sm:h-72 lg:h-80">
              <Bar
                v-if="chartData"
                :data="chartData"
                :options="chartOptions"
              />
            </div>
          </section>

          <!-- Detailed Table -->
          <section class="bg-background-card border border-border-base rounded-lg overflow-hidden">
            <div class="px-4 sm:px-6 py-3 sm:py-4 bg-background-section border-b border-border-base">
              <h2 class="text-15 sm:text-16 font-medium text-text-primary tracking-tight">Detalhamento por Categoria</h2>
              <p class="text-13 text-text-secondary mt-1 leading-normal hidden sm:block">Gastos mensais por categoria de custo fixo</p>
            </div>

            <!-- Desktop Table -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="min-w-full divide-y divide-border-base">
                <thead class="bg-background-section">
                  <tr>
                    <th class="px-6 py-4 text-left text-13 font-medium text-text-secondary uppercase tracking-wide sticky left-0 bg-background-section z-10">
                      Categoria
                    </th>
                    <th
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-6 py-4 text-right text-13 font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap"
                    >
                      {{ month }}
                    </th>
                    <th class="px-6 py-4 text-right text-13 font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap bg-background-hover">
                      Total
                    </th>
                    <th class="px-6 py-4 text-right text-13 font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap bg-background-hover">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-background-card divide-y divide-border-base">
                  <tr
                    v-for="category in categoryBreakdown"
                    :key="category.name"
                    class="hover:bg-background-hover transition-all duration-150 ease-out"
                  >
                    <td class="px-6 py-4 whitespace-nowrap sticky left-0 bg-background-card">
                      <div class="flex items-center gap-3">
                        <span class="text-xl">{{ getCategoryIcon(category.name) }}</span>
                        <span class="text-15 font-medium text-text-primary">{{ category.name }}</span>
                      </div>
                    </td>
                    <td
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-6 py-4 whitespace-nowrap text-right text-15"
                      :class="getCellClass(category.monthlyTotals[month])"
                    >
                      {{ formatCurrency(category.monthlyTotals[month] || 0) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right font-semibold text-15 text-text-primary bg-background-section">
                      {{ formatCurrency(category.total) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-15 text-text-secondary bg-background-section">
                      {{ formatCurrency(category.average) }}
                    </td>
                  </tr>

                  <!-- Total Row -->
                  <tr class="bg-background-hover font-semibold">
                    <td class="px-6 py-4 whitespace-nowrap sticky left-0 bg-background-hover text-15 text-text-primary">
                      TOTAL
                    </td>
                    <td
                      v-for="month in monthLabels"
                      :key="month"
                      class="px-6 py-4 whitespace-nowrap text-right text-15 text-text-primary"
                    >
                      {{ formatCurrency(getMonthTotal(month)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-15 text-accent-primary bg-background-section">
                      {{ formatCurrency(grandTotal) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-15 text-accent-primary bg-background-section">
                      {{ formatCurrency(averageMonthlyTotal) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="lg:hidden divide-y divide-border-base">
              <div
                v-for="category in categoryBreakdown"
                :key="category.name"
                class="p-4 space-y-3"
              >
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <span class="text-lg">{{ getCategoryIcon(category.name) }}</span>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-15 font-medium text-text-primary truncate">{{ category.name }}</h3>
                      <div class="flex items-center gap-3 text-13 text-text-muted">
                        <span>Total: {{ formatCurrency(category.total) }}</span>
                        <span>Média: {{ formatCurrency(category.average) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Monthly Values -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-13">
                  <div
                    v-for="(month, index) in monthLabels"
                    :key="month"
                    class="flex justify-between p-2 bg-background-section rounded-md"
                  >
                    <span class="text-text-secondary">{{ month }}:</span>
                    <span
                      :class="getCellClass(category.monthlyTotals[last6Months[index]])"
                      class="font-medium"
                    >
                      {{ formatCurrency(category.monthlyTotals[last6Months[index]] || 0) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Mobile Total -->
              <div class="p-4 bg-background-hover space-y-3">
                <h3 class="text-15 font-semibold text-text-primary">TOTAL GERAL</h3>
                <div class="grid grid-cols-2 gap-4 text-14">
                  <div class="text-right">
                    <span class="text-text-secondary">Total: </span>
                    <span class="font-semibold text-accent-primary">{{ formatCurrency(grandTotal) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-text-secondary">Média: </span>
                    <span class="font-semibold text-accent-primary">{{ formatCurrency(averageMonthlyTotal) }}</span>
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
