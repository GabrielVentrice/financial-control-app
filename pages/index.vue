<template>
  <Sidemenu>
    <div class="bg-gray-50 min-h-screen">
      <!-- Header - Clean and minimal -->
      <header class="h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold text-gray-900">Dashboard</h1>
          <span class="text-sm text-gray-500">{{ getCurrentMonthName() }}</span>
        </div>
        <BaseButton size="sm" variant="ghost" @click="refresh" :loading="loading || refreshing">
          {{ refreshing ? 'Atualizando...' : 'Atualizar' }}
        </BaseButton>
      </header>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando dados financeiros..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Smart Insights - Top priority alerts -->
          <section v-if="smartInsights.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LightInsightCard
              v-for="(insight, index) in smartInsights.slice(0, 2)"
              :key="index"
              :type="insight.type"
              :title="insight.title"
              :message="insight.message"
              :value="insight.value"
            />
          </section>

          <!-- Hero KPIs - 3 main cards answering "Como estou?" -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Saldo Disponivel -->
            <LightStatCard
              label="Saldo Disponivel"
              :value="monthlyStats.balance"
              format="currency"
              :value-color="monthlyStats.balance >= 0 ? 'positive' : 'negative'"
              size="lg"
              :trend="monthlyStats.trend.balance"
              :secondary-stat="{
                label: 'vs mes anterior',
                value: formatTrendText(monthlyStats.trend.balance)
              }"
            />

            <!-- Gastado este mes -->
            <LightStatCard
              label="Gastado este Mes"
              :value="monthlyStats.expenses"
              format="currency"
              value-color="negative"
              size="lg"
              :trend="monthlyStats.trend.expenses"
              :invert-trend-colors="true"
              :secondary-stat="{
                label: 'media diaria',
                value: formatCurrency(monthlyStats.dailyAverage)
              }"
            />

            <!-- Receitas -->
            <LightStatCard
              label="Receitas"
              :value="monthlyStats.income"
              format="currency"
              value-color="positive"
              size="lg"
              :trend="monthlyStats.trend.income"
              :secondary-stat="{
                label: 'este mes',
                value: `${monthlyStats.transactionCount} transacoes`
              }"
            />
          </section>

          <!-- Cash Flow Chart - Full width -->
          <section>
            <DashboardCashFlowChart :transactions="filteredTransactions" />
          </section>

          <!-- Categories + Expenses List -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Categories List - Left column -->
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-1">
              <div class="px-4 py-3 border-b border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900">Categorias</h3>
              </div>
              <div v-if="allCategories.length > 0" class="p-2 space-y-0.5 max-h-[500px] overflow-y-auto">
                <!-- "Todas" option -->
                <button
                  @click="selectedCategory = null"
                  class="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors duration-150"
                  :class="selectedCategory === null
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'"
                >
                  <span class="text-sm font-medium">Todas</span>
                  <span class="text-xs font-medium" :class="selectedCategory === null ? 'text-blue-500' : 'text-gray-400'">
                    {{ formatCurrency(totalExpenses) }}
                  </span>
                </button>
                <!-- Category items -->
                <button
                  v-for="category in allCategories"
                  :key="category.name"
                  @click="selectedCategory = category.name"
                  class="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors duration-150"
                  :class="selectedCategory === category.name
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm font-medium truncate">{{ category.name }}</span>
                    <span class="text-xs shrink-0" :class="selectedCategory === category.name ? 'text-blue-400' : 'text-gray-400'">
                      {{ category.count }}
                    </span>
                  </div>
                  <span class="text-xs font-medium whitespace-nowrap ml-2" :class="selectedCategory === category.name ? 'text-blue-500' : 'text-gray-500'">
                    {{ formatCurrency(category.total) }}
                  </span>
                </button>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-sm text-gray-500">Nenhum gasto registrado</p>
              </div>
            </div>

            <!-- Expenses List - Right column -->
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-2">
              <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">
                  {{ selectedCategory ? `Gastos - ${selectedCategory}` : 'Todos os Gastos' }}
                </h3>
                <span class="text-xs text-gray-500">
                  {{ displayedExpenses.length }} {{ displayedExpenses.length === 1 ? 'transacao' : 'transacoes' }}
                </span>
              </div>
              <div v-if="displayedExpenses.length > 0" class="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                <div
                  v-for="expense in displayedExpenses"
                  :key="expense.transactionId"
                  class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ expense.description }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-xs text-gray-500">{{ formatDate(expense.date) }}</span>
                      <span class="text-xs text-gray-300">|</span>
                      <span class="text-xs text-gray-500">{{ expense.destination || 'Sem categoria' }}</span>
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-red-600 whitespace-nowrap ml-4">
                    {{ formatCurrency(Math.abs(expense.amount)) }}
                  </span>
                </div>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-sm text-gray-500">Nenhum gasto encontrado</p>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Composables - transactions now fetched automatically via SSR
const {
  transactions,
  loading,
  error,
  refreshCache,
  refreshing
} = useTransactions()

const { selectedPerson } = usePersonFilter()

const {
  fetchCacheStatus
} = useCacheStatus()

const {
  getCurrentMonthStats,
  getAllCategories,
  getCurrentMonthExpenses,
  getSmartInsights
} = useDashboardAnalytics()

const { formatCurrency, formatMonthName, formatPercentage, formatDate } = useFormatters()

// State
const selectedCategory = ref<string | null>(null)

// Computed - Filter transactions by person
const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      return transaction.person === selectedPerson.value
    })
  }

  return filtered
})

// Dashboard Analytics
const monthlyStats = computed(() => getCurrentMonthStats([...filteredTransactions.value]))
const allCategories = computed(() => getAllCategories([...filteredTransactions.value]))
const smartInsights = computed(() => getSmartInsights([...filteredTransactions.value]))

const totalExpenses = computed(() => {
  return allCategories.value.reduce((sum, cat) => sum + cat.total, 0)
})

const currentMonthExpenses = computed(() => getCurrentMonthExpenses([...filteredTransactions.value]))

const displayedExpenses = computed(() => {
  if (!selectedCategory.value) return currentMonthExpenses.value
  return currentMonthExpenses.value.filter(t => {
    const category = t.destination || 'Sem categoria'
    return category === selectedCategory.value
  })
})

// Methods
const refresh = async () => {
  try {
    const result = await refreshCache()

    if (result.success) {
      console.log('Cache atualizado com sucesso:', result.message)
    } else {
      console.error('Erro ao atualizar cache:', result.error)
    }

    await fetchCacheStatus()
  } catch (e) {
    console.error('Erro durante atualizacao:', e)
  }
}

const getCurrentMonthName = () => {
  const now = new Date()
  return formatMonthName(now.getMonth())
}

const formatTrendText = (trend: number): string => {
  const abs = Math.abs(trend)
  const sign = trend >= 0 ? '+' : '-'
  return `${sign}${formatPercentage(abs, 1)}`
}
</script>
