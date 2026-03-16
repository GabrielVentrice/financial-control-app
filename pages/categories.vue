<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] min-h-screen">
      <!-- Header -->
      <header class="h-14 px-6 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-10">
        <div>
          <h1 class="text-lg font-semibold text-[#111111] tracking-tight">Categorias</h1>
          <p class="text-[13px] text-gray-500">{{ selectedPerson }}</p>
        </div>
        <button
          @click="refreshCacheAndData"
          :disabled="loading || refreshing"
          class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Atualizar dados"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      <!-- Month Filter -->
      <div class="px-6 py-4 bg-white">
        <div class="max-w-7xl mx-auto flex items-center gap-4">
          <input
            v-model="selectedMonth"
            type="month"
            class="px-3 py-2 bg-white text-gray-700 text-[13px] rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
          <span class="text-[13px] text-gray-500 ml-2">{{ formattedMonth }}</span>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Content -->
        <template v-else>
          <!-- Summary Cards -->
          <section>
            <div class="grid grid-cols-2 divide-x divide-gray-100">
              <LightStatCard
                label="Fixos"
                :value="custosFixosTotal"
                format="currency"
                value-color="neutral"
                size="sm"
                :secondary-stat="{ label: custosFixosCategoriesCount + ' categorias', value: '' }"
              />

              <LightStatCard
                label="Comprometidos"
                :value="gastosComprometidosTotal"
                format="currency"
                value-color="warning"
                size="sm"
                :secondary-stat="{ label: gastosComprometidosCategoriesCount + ' categorias', value: '' }"
              />
            </div>
          </section>

          <!-- Total Budget Progress Bar -->
          <section v-if="totalBudget > 0" class="bg-white rounded-xl p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Orcamento Total</h2>
                  <p class="text-[13px] text-gray-500 mt-0.5">{{ categoriesWithBudget.length }} categorias orcadas</p>
                </div>
                <div class="text-right">
                  <p class="text-kpi-md text-[#111111]">
                    {{ formatCurrencyCompact(totalUsed) }}
                  </p>
                  <p class="text-[13px] text-gray-500">
                    de {{ formatCurrencyCompact(totalBudget) }}
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between text-[13px]">
                  <span class="text-gray-500">Progresso geral</span>
                  <span class="font-semibold" :class="getBudgetTextColor(totalBudgetPercentage)">
                    {{ totalBudgetPercentage.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="getBudgetProgressColor(totalBudgetPercentage)"
                    :style="{ width: `${Math.min(totalBudgetPercentage, 100)}%` }"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[13px]">
                  <span class="text-gray-500">Restante:</span>
                  <span class="font-semibold" :class="totalBudgetRemaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                    {{ formatCurrencyCompact(totalBudgetRemaining) }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Categories List -->
          <section>
            <div class="mb-4">
              <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos por Categoria</h2>
              <p class="text-[13px] text-gray-500 mt-0.5">{{ categories.length }} categorias</p>
            </div>

            <!-- Empty State -->
            <EmptyState
              v-if="categories.length === 0"
              icon="📊"
              title="Nenhuma transacao"
              description="Selecione outro periodo."
            />

            <!-- Categories Grid - Flat cards, no emoji, no border -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="category in categories"
                :key="category.name"
                class="rounded-xl cursor-pointer hover:bg-gray-50/80 transition-colors"
                @click="toggleCategory(category.name)"
              >
                <!-- MOBILE VERSION -->
                <div class="md:hidden p-4">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-[15px] font-semibold text-gray-700 truncate">{{ category.name }}</p>
                    </div>
                    <div class="text-right ml-3">
                      <template v-if="category.budget">
                        <p class="text-kpi-sm" :class="category.budget.remaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                          {{ formatCurrencyCompact(category.budget.remaining) }}
                        </p>
                      </template>
                      <template v-else>
                        <p class="text-kpi-sm text-[#111111]">
                          {{ formatCurrencyCompact(category.total) }}
                        </p>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- DESKTOP VERSION - Flat, text-led -->
                <div class="hidden md:block p-5">
                  <!-- Category Header - no emoji, no chevron -->
                  <div class="mb-3">
                    <p class="text-[15px] font-semibold text-gray-700">{{ category.name }}</p>
                    <p class="text-[13px] text-gray-500 mt-0.5">{{ category.count }} transacoes</p>
                  </div>

                  <!-- Amount -->
                  <div class="mb-3">
                    <template v-if="category.budget">
                      <p class="text-kpi-md" :class="category.budget.remaining >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                        {{ formatCurrencyCompact(category.budget.remaining) }}
                      </p>
                      <p class="text-[13px] text-gray-500 mt-1">
                        {{ formatCurrencyCompact(category.total) }} gastos de {{ formatCurrencyCompact(category.budget.total) }}
                      </p>
                    </template>
                    <template v-else>
                      <p class="text-kpi-md text-[#111111]">
                        {{ formatCurrencyCompact(category.total) }}
                      </p>
                    </template>
                  </div>

                  <!-- Budget Progress -->
                  <template v-if="category.budget">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-gray-500">Utilizado</span>
                        <span class="font-semibold" :class="getBudgetTextColor(category.budget.percentageUsed)">
                          {{ category.budget.percentageUsed.toFixed(0) }}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          class="h-1.5 rounded-full transition-all"
                          :class="getBudgetProgressColor(category.budget.percentageUsed)"
                          :style="{ width: `${Math.min(category.budget.percentageUsed, 100)}%` }"
                        ></div>
                      </div>
                    </div>
                  </template>

                  <!-- Expanded Transactions -->
                  <div v-if="expandedCategory === category.name" class="mt-4 pt-4 border-t border-gray-100">
                    <h4 class="text-[11px] font-medium text-gray-500 mb-3">
                      Transacoes ({{ getCategoryTransactions(category.name).length }})
                    </h4>
                    <div class="space-y-0 max-h-48 overflow-y-auto">
                      <div
                        v-for="transaction in getCategoryTransactions(category.name)"
                        :key="transaction.transactionId"
                        class="py-3"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1 min-w-0">
                            <p class="text-[13px] text-gray-700 truncate">{{ transaction.description }}</p>
                            <div class="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                              <span>{{ formatDateCompact(transaction.date) }}</span>
                              <span>·</span>
                              <span class="truncate">{{ transaction.origin }}</span>
                            </div>
                          </div>
                          <p class="text-[13px] font-semibold text-[#111111] whitespace-nowrap">
                            {{ formatCurrencyCompact(transaction.amount) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
import { ref, computed, watch } from 'vue'
import type { CategoriesResponse } from '~/types/transaction'
import type { CacheRefreshResponse } from '~/types/cache'

// Composables
const { selectedPerson } = usePersonFilter()
const { fetchCacheStatus } = useCacheStatus()

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// Local state
const selectedMonth = ref(getCurrentMonth())
const expandedCategory = ref<string | null>(null)
const refreshing = ref(false)

// Build query object for API
const queryObject = computed(() => {
  const query: Record<string, string> = {}

  if (selectedPerson.value !== 'Ambos') {
    query.person = selectedPerson.value
  }

  const [year, month] = selectedMonth.value.split('-')
  const startDate = `${year}-${month}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

  query.startDate = startDate
  query.endDate = endDate
  query.includeTransactions = 'true'

  return query
})

// Use useAsyncData for SSR support
const {
  data: categoriesData,
  status,
  error: fetchError,
  refresh: refreshData
} = useAsyncData<CategoriesResponse>(
  'categories',
  () => $fetch<CategoriesResponse>('/api/categories', { query: queryObject.value }),
  {
    default: () => null,
    watch: [queryObject],
    immediate: true
  }
)

// Computed states
const loading = computed(() => status.value === 'pending')
const error = computed(() => fetchError.value?.message || null)

// Custom category order
const CATEGORY_ORDER = [
  'Food',
  'Supermarket',
  'Transportation',
  'Entertainment',
  'Subscriptions/Softwares',
  'Home & Maintenance',
  'Medical',
  'Personal care',
  'Pets',
  'Variable Expenses',
  'Clothing',
  'Education',
  'Utilities',
  'Gifts & Donations',
  'Taxes Due',
  'Business & Taxes',
  'Financing',
  'Insurance',
  'Rent',
  'Kids',
  'Cleaning Services'
]

// Computed
const categories = computed(() => {
  const cats = categoriesData.value?.categories || []

  return [...cats].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.name)
    const bIndex = CATEGORY_ORDER.indexOf(b.name)

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    return a.name.localeCompare(b.name)
  })
})
const totalAmount = computed(() => categoriesData.value?.totals.total || 0)
const totalTransactions = computed(() => categories.value.reduce((sum, cat) => sum + cat.count, 0))

const variableCostsTotal = computed(() => categoriesData.value?.totals.variableCosts || 0)
const custosFixosTotal = computed(() => categoriesData.value?.totals.fixedCosts || 0)
const gastosComprometidosTotal = computed(() => categoriesData.value?.totals.committedExpenses || 0)

const custosFixosCategoriesCount = computed(() => categoriesData.value?.totals.categoryCounts.fixedCosts || 0)
const gastosComprometidosCategoriesCount = computed(() => categoriesData.value?.totals.categoryCounts.committedExpenses || 0)

const formattedMonth = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
})

// Total Budget calculations
const categoriesWithBudget = computed(() => categories.value.filter(cat => cat.budget))

const totalBudget = computed(() => {
  return categoriesWithBudget.value.reduce((sum, cat) => sum + (cat.budget?.total || 0), 0)
})

const totalUsed = computed(() => {
  return categoriesWithBudget.value.reduce((sum, cat) => sum + cat.total, 0)
})

const totalBudgetPercentage = computed(() => {
  if (totalBudget.value === 0) return 0
  return (totalUsed.value / totalBudget.value) * 100
})

const totalBudgetRemaining = computed(() => {
  return totalBudget.value - totalUsed.value
})

// Methods
const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatDateCompact = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return dateString
  }
}

const toggleCategory = (categoryName: string) => {
  expandedCategory.value = expandedCategory.value === categoryName ? null : categoryName
}

const getCategoryTransactions = (categoryName: string) => {
  const category = categories.value.find(cat => cat.name === categoryName)
  return category?.transactions || []
}

const getBudgetProgressColor = (percentageUsed: number): string => {
  if (percentageUsed >= 100) return 'bg-gradient-to-r from-rose-400 to-rose-500'
  if (percentageUsed >= 90) return 'bg-gradient-to-r from-amber-400 to-amber-500'
  if (percentageUsed >= 75) return 'bg-gradient-to-r from-blue-400 to-blue-500'
  return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
}

const getBudgetTextColor = (percentageUsed: number): string => {
  if (percentageUsed >= 100) return 'text-rose-400'
  if (percentageUsed >= 90) return 'text-amber-500'
  if (percentageUsed >= 75) return 'text-blue-500'
  return 'text-emerald-500'
}

// Refresh cache and reload data
const refreshCacheAndData = async () => {
  refreshing.value = true

  try {
    const cacheResponse = await $fetch<CacheRefreshResponse>('/api/cache/refresh', {
      method: 'POST'
    })

    if (cacheResponse.success) {
      console.log('Cache atualizado:', cacheResponse.message)
    }

    await refreshData()
    await fetchCacheStatus()
  } catch (e: any) {
    console.error('Erro ao atualizar:', e)
  } finally {
    refreshing.value = false
  }
}
</script>
