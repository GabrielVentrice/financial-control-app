<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-800">Histórico de Custos Fixos</h1>
        <p class="text-gray-600 mt-1">Análise dos últimos 6 meses de custos fixos</p>
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

      <!-- Fixed Cost Categories Info -->
      <div v-if="FIXED_COST_CATEGORIES.length > 0" class="mt-3 px-6 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <details class="text-sm">
          <summary class="cursor-pointer text-orange-800 font-medium hover:text-orange-900">
            📌 {{ FIXED_COST_CATEGORIES.length }} categoria(s) configurada(s) como custo fixo
          </summary>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="category in FIXED_COST_CATEGORIES"
              :key="category"
              class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-300"
            >
              {{ category }}
            </span>
          </div>
          <p class="mt-2 text-xs text-orange-700">
            Para modificar, edite FIXED_COST_CATEGORIES em pages/fixed-costs.vue
          </p>
        </details>
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
    <div v-else class="px-8 pb-8 space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg shadow-lg p-6">
          <p class="text-white text-sm font-medium uppercase tracking-wide opacity-90">Custo Fixo Atual</p>
          <p class="text-4xl font-bold text-white mt-2">{{ formatCurrency(currentMonthTotal) }}</p>
          <p class="text-orange-100 text-xs mt-2">{{ currentMonthLabel }}</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Média Mensal</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatCurrency(averageMonthlyTotal) }}</p>
          <p class="text-gray-500 text-xs mt-2">Últimos 6 meses</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <p class="text-gray-600 text-sm font-medium uppercase tracking-wide">Categorias Ativas</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ activeCategoriesCount }}</p>
          <p class="text-gray-500 text-xs mt-2">Com gastos no período</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Evolução dos Custos Fixos</h2>
        <div class="h-80">
          <Bar
            v-if="chartData"
            :data="chartData"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- Detailed Table -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">Detalhamento por Categoria</h2>
          <p class="text-sm text-gray-600 mt-1">Gastos mensais por categoria de custo fixo</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">
                  Categoria
                </th>
                <th
                  v-for="month in monthLabels"
                  :key="month"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {{ month }}
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-200">
                  Total
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-200">
                  Média
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="category in categoryBreakdown"
                :key="category.name"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ getCategoryIcon(category.name) }}</span>
                    <span class="text-sm font-medium text-gray-900">{{ category.name }}</span>
                  </div>
                </td>
                <td
                  v-for="month in monthLabels"
                  :key="month"
                  class="px-6 py-4 whitespace-nowrap text-right text-sm"
                  :class="getCellClass(category.monthlyTotals[month])"
                >
                  {{ formatCurrency(category.monthlyTotals[month] || 0) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right font-semibold text-sm text-gray-900 bg-gray-50">
                  {{ formatCurrency(category.total) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 bg-gray-50">
                  {{ formatCurrency(category.average) }}
                </td>
              </tr>

              <!-- Total Row -->
              <tr class="bg-gray-100 font-bold">
                <td class="px-6 py-4 whitespace-nowrap sticky left-0 bg-gray-100 text-sm text-gray-900">
                  TOTAL
                </td>
                <td
                  v-for="month in monthLabels"
                  :key="month"
                  class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900"
                >
                  {{ formatCurrency(getMonthTotal(month)) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 bg-gray-200">
                  {{ formatCurrency(grandTotal) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 bg-gray-200">
                  {{ formatCurrency(averageMonthlyTotal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="categoryBreakdown.length === 0" class="text-center py-12">
          <p class="text-gray-500">Nenhum custo fixo encontrado nos últimos 6 meses</p>
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
  Legend,
  type ChartOptions
} from 'chart.js'
import type { Transaction } from '~/types/transaction'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Composables
const { selectedPerson, identifyPerson } = usePersonFilter()
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
      const person = identifyPerson(transaction.origin)
      return person === selectedPerson.value
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
      callbacks: {
        label: (context) => {
          return `Custo: ${formatCurrency(context.parsed.y)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value as number)
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
    return 'text-gray-400'
  }
  return 'text-gray-900 font-medium'
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
