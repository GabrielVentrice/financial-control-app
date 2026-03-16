<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] min-h-screen">
      <!-- Header - Clean and minimal -->
      <header class="h-14 px-6 flex items-center justify-between bg-white">
        <div>
          <h1 class="text-[15px] font-medium text-[#111111]">Dashboard</h1>
          <p class="text-[13px] text-[#9CA3AF]">{{ getCurrentMonthName() }}</p>
        </div>
        <button
          @click="refresh"
          :disabled="loading || refreshing"
          class="p-2 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-gray-50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Atualizar dados"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando dados financeiros..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Smart Insights - Demoted to muted caption lines -->
          <div v-if="smartInsights.length > 0" class="space-y-0">
            <LightInsightCard
              v-for="(insight, index) in smartInsights.slice(0, 2)"
              :key="index"
              :type="insight.type"
              :title="insight.title"
              :message="insight.message"
              :value="insight.value"
            />
          </div>

          <!-- Hero KPIs - Borderless, breathing -->
          <section class="grid grid-cols-1 md:grid-cols-3">
            <!-- Saldo Disponivel -->
            <LightStatCard
              label="Saldo Disponivel"
              :value="monthlyStats.balance"
              format="currency"
              :value-color="monthlyStats.balance >= 0 ? 'positive' : 'negative'"
              size="lg"
              :trend="monthlyStats.trend.balance"
              :secondary-stat="{
                label: '',
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
                label: '',
                value: formatCurrency(monthlyStats.dailyAverage) + '/dia'
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
                label: '',
                value: `${monthlyStats.transactionCount} transacoes`
              }"
            />
          </section>

          <!-- Cash Flow Chart - No card wrapper, directly on page -->
          <section class="mt-6">
            <DashboardCashFlowChart :transactions="filteredTransactions" />
          </section>

          <!-- Categories + Expenses List -->
          <section class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
            <!-- Categories List - Left column -->
            <div class="overflow-hidden">
              <div class="px-1 py-3">
                <h3 class="text-[13px] font-medium text-[#9CA3AF]">Categorias</h3>
              </div>
              <div v-if="allCategories.length > 0" class="space-y-0.5 max-h-[500px] overflow-y-auto">
                <!-- "Todas" option -->
                <button
                  @click="selectedCategory = null"
                  class="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors duration-150"
                  :class="selectedCategory === null
                    ? 'text-[#111111]'
                    : 'text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F5F5F5]'"
                >
                  <span class="text-[13px]" :class="selectedCategory === null ? 'font-semibold' : 'font-normal'">Todas</span>
                  <span class="text-[13px]" :class="selectedCategory === null ? 'font-medium text-[#374151]' : 'text-[#9CA3AF]'">
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
                    ? 'text-[#111111]'
                    : 'text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F5F5F5]'"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-[13px] truncate" :class="selectedCategory === category.name ? 'font-semibold' : 'font-normal'">{{ category.name }}</span>
                    <span class="text-[11px] text-[#9CA3AF]">
                      {{ category.count }}
                    </span>
                  </div>
                  <span class="text-[13px] whitespace-nowrap ml-2" :class="selectedCategory === category.name ? 'font-medium text-[#374151]' : 'text-[#9CA3AF]'">
                    {{ formatCurrency(category.total) }}
                  </span>
                </button>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-[13px] text-[#9CA3AF]">Nenhum gasto registrado</p>
              </div>
            </div>

            <!-- Expenses List - Right column, whitespace separation -->
            <div class="overflow-hidden">
              <div class="px-1 py-3 flex items-center justify-between">
                <h3 class="text-[13px] font-medium text-[#9CA3AF]">
                  {{ selectedCategory ? `Gastos - ${selectedCategory}` : 'Todos os Gastos' }}
                </h3>
                <span class="text-[11px] text-[#9CA3AF]">
                  {{ displayedExpenses.length }} {{ displayedExpenses.length === 1 ? 'transacao' : 'transacoes' }}
                </span>
              </div>
              <div v-if="displayedExpenses.length > 0" class="max-h-[500px] overflow-y-auto">
                <div
                  v-for="expense in displayedExpenses"
                  :key="expense.transactionId"
                  class="px-3 py-5 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors duration-150 rounded-md"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-[15px] font-medium text-[#374151] truncate">{{ expense.description }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[13px] text-[#9CA3AF]">{{ formatDate(expense.date) }}</span>
                      <span class="text-[13px] text-[#9CA3AF]">{{ expense.destination || 'Sem categoria' }}</span>
                    </div>
                  </div>
                  <span class="text-[15px] font-semibold text-[#111111] whitespace-nowrap ml-4">
                    {{ formatCurrency(Math.abs(expense.amount)) }}
                  </span>
                </div>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-[13px] text-[#9CA3AF]">Nenhum gasto encontrado</p>
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
