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
            <!-- Saldo Disponível -->
            <LightStatCard
              label="Saldo Disponível"
              :value="monthlyStats.balance"
              format="currency"
              :value-color="monthlyStats.balance >= 0 ? 'positive' : 'negative'"
              size="lg"
              :trend="monthlyStats.trend.balance"
              :secondary-stat="{
                label: 'vs mês anterior',
                value: formatTrendText(monthlyStats.trend.balance)
              }"
            />

            <!-- Gastado este mês -->
            <LightStatCard
              label="Gastado este Mês"
              :value="monthlyStats.expenses"
              format="currency"
              value-color="negative"
              size="lg"
              :trend="monthlyStats.trend.expenses"
              :invert-trend-colors="true"
              :secondary-stat="{
                label: 'média diária',
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
                label: 'este mês',
                value: `${monthlyStats.transactionCount} transações`
              }"
            />
          </section>

          <!-- Two Column Grid: Chart + Categories -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Cash Flow Chart -->
            <DashboardCashFlowChart :transactions="filteredTransactions" />

            <!-- Top Categories -->
            <DashboardCategoryProgressList :categories="topCategories" :limit="5" />
          </section>

          <!-- Upcoming Bills - Full width -->
          <section v-if="upcomingExpenses.length > 0">
            <DashboardUpcomingBillsTable :bills="upcomingExpenses" :limit="8" />
          </section>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  getTopCategories,
  getUpcomingExpenses,
  getSmartInsights
} = useDashboardAnalytics()

const { formatCurrency, formatMonthName, formatPercentage } = useFormatters()

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
const topCategories = computed(() => getTopCategories([...filteredTransactions.value], 5))
const upcomingExpenses = computed(() => getUpcomingExpenses([...filteredTransactions.value]))
const smartInsights = computed(() => getSmartInsights([...filteredTransactions.value]))

// Methods
const refresh = async () => {
  try {
    // Refresh the cache and automatically reload transactions
    const result = await refreshCache()

    if (result.success) {
      console.log('Cache atualizado com sucesso:', result.message)
    } else {
      console.error('Erro ao atualizar cache:', result.error)
    }

    // Update cache status display
    await fetchCacheStatus()
  } catch (e) {
    console.error('Erro durante atualização:', e)
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

// No onMounted needed - useAsyncData fetches data on SSR automatically
</script>
