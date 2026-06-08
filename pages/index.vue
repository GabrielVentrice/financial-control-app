<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <!-- Header - sticky with bottom border -->
      <PageHeader title="Dashboard" :subtitle="getCurrentMonthName()">
        <template #actions>
          <RefreshButton :disabled="loading || refreshing" :spinning="refreshing" @click="refresh" />
        </template>
      </PageHeader>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando dados financeiros..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Smart Insights -->
          <div v-if="smartInsights.length > 0" class="space-y-0 mb-6">
            <LightInsightCard
              v-for="(insight, index) in smartInsights.slice(0, 2)"
              :key="index"
              :type="insight.type"
              :title="insight.title"
              :message="insight.message"
              :value="insight.value"
            />
          </div>

          <!-- Hero KPIs - divide-x for visual separation -->
          <section class="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-100">
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

          <!-- Cash Flow Chart - contained card, larger gap from KPIs -->
          <section class="mt-10">
            <DashboardCashFlowChart :transactions="filteredTransactions" />
          </section>

          <!-- Categories + Expenses List - wider ratio, larger gap -->
          <section class="mt-10 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
            <!-- Categories List -->
            <div class="overflow-hidden">
              <div class="px-1 py-3">
                <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Categorias</h2>
              </div>
              <div v-if="allCategories.length > 0" class="space-y-0.5 max-h-[500px] overflow-y-auto">
                <!-- "Todas" option -->
                <button
                  @click="selectedCategory = null"
                  class="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors duration-150"
                  :class="selectedCategory === null
                    ? 'text-[#111111] bg-gray-50 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'"
                >
                  <span class="text-[13px]">Todas</span>
                  <span class="text-[13px]" :class="selectedCategory === null ? 'text-gray-700' : 'text-gray-500'">
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
                    ? 'text-[#111111] bg-gray-50 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-[13px] truncate">{{ category.name }}</span>
                    <span class="text-[11px] text-gray-400">
                      {{ category.count }}
                    </span>
                  </div>
                  <span class="text-[13px] whitespace-nowrap ml-2" :class="selectedCategory === category.name ? 'text-gray-700' : 'text-gray-500'">
                    {{ formatCurrency(category.total) }}
                  </span>
                </button>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-[13px] text-gray-500">Nenhum gasto registrado</p>
              </div>
            </div>

            <!-- Expenses List -->
            <div class="overflow-hidden">
              <div class="px-1 py-3 flex items-center justify-between">
                <h2 class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ selectedCategory ? `Gastos - ${selectedCategory}` : 'Todos os Gastos' }}
                </h2>
                <span class="text-[11px] text-gray-500">
                  {{ displayedExpenses.length }} {{ displayedExpenses.length === 1 ? 'transacao' : 'transacoes' }}
                </span>
              </div>
              <div v-if="displayedExpenses.length > 0" class="max-h-[500px] overflow-y-auto">
                <div
                  v-for="expense in displayedExpenses"
                  :key="expense.transactionId"
                  class="px-3 py-3 flex items-center justify-between hover:bg-gray-50/80 transition-colors duration-150 rounded-lg cursor-default"
                  :title="expense.description"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-[15px] font-medium text-gray-700 truncate">{{ expense.description }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[13px] text-gray-500">{{ formatDate(expense.date) }}</span>
                      <span class="text-[13px] text-gray-500">{{ expense.destination || 'Sem categoria' }}</span>
                    </div>
                  </div>
                  <span class="text-[15px] font-semibold text-[#111111] whitespace-nowrap ml-4">
                    {{ formatCurrency(Math.abs(expense.amount)) }}
                  </span>
                </div>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-[13px] text-gray-500">Nenhum gasto encontrado</p>
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

const selectedCategory = ref<string | null>(null)

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => {
      return transaction.person === selectedPerson.value
    })
  }

  return filtered
})

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
