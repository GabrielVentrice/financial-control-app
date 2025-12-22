<template>
  <Sidemenu>
    <div class="bg-gray-50 min-h-screen">
      <!-- Header - Fixed height, consistent -->
      <header class="h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold text-gray-900">Dashboard</h1>
          <span class="text-sm text-gray-500">{{ getCurrentMonthName() }}</span>
          <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="ghost" @click="refresh" :loading="loading || refreshing">
          {{ refreshing ? 'Atualizando...' : 'Atualizar' }}
        </BaseButton>
      </header>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Smart Insights - Alert style, max 2 side by side -->
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

          <!-- Main KPIs Grid - 4 columns desktop, 2 mobile -->
          <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Receitas -->
            <LightStatCard
              label="Receitas"
              :value="monthlyStats.income"
              format="currency"
              value-color="positive"
              size="md"
              :trend="monthlyStats.trend.income"
            />

            <!-- Despesas -->
            <LightStatCard
              label="Despesas"
              :value="monthlyStats.expenses"
              format="currency"
              value-color="negative"
              size="md"
              :trend="monthlyStats.trend.expenses"
              :invert-trend-colors="true"
            />

            <!-- Saldo -->
            <LightStatCard
              label="Saldo"
              :value="monthlyStats.balance"
              format="currency"
              :value-color="monthlyStats.balance >= 0 ? 'positive' : 'negative'"
              size="md"
              :trend="monthlyStats.trend.balance"
            />

            <!-- Transações -->
            <LightStatCard
              label="Transações"
              :value="monthlyStats.transactionCount"
              format="number"
              value-color="neutral"
              size="md"
            />
          </section>

          <!-- Two Column Layout: Categories + Quick Links -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Top Categories - Clean card with border -->
            <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">Top Categorias</h3>
                <NuxtLink to="/categories" class="text-sm text-accent hover:text-accent/80 transition-colors">
                  Ver todas →
                </NuxtLink>
              </div>

              <div v-if="topCategories.length > 0" class="p-4 space-y-4">
                <div
                  v-for="category in topCategories"
                  :key="category.name"
                  class="flex items-center gap-3"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2 mb-1.5">
                      <span class="text-sm font-medium text-gray-900 truncate">{{ category.name }}</span>
                      <span class="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {{ formatCurrencyCompact(category.total) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          class="bg-neutral h-2 rounded-full transition-all"
                          :style="{ width: category.percentage + '%' }"
                        />
                      </div>
                      <span class="text-xs text-gray-500 whitespace-nowrap w-10 text-right">
                        {{ category.percentage.toFixed(0) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="p-4">
                <EmptyState
                  icon="📊"
                  title="Nenhum gasto"
                  description="Sem categorias de gasto este mês"
                />
              </div>
            </div>

            <!-- Quick Links - Compact card -->
            <div class="space-y-4">
              <!-- Filter Badge -->
              <div class="bg-white rounded-lg border border-gray-200 p-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Filtro Ativo</p>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-900">{{ selectedPerson }}</span>
                  <span class="text-xs text-gray-500">{{ monthlyStats.transactionCount }} transações</span>
                </div>
              </div>

              <!-- Quick Links -->
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-200">
                  <p class="text-xs font-semibold text-gray-900 uppercase tracking-wide">Navegação</p>
                </div>
                <div class="p-2">
                  <NuxtLink
                    to="/transactions"
                    class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors"
                  >
                    <span class="text-gray-700">Transações</span>
                    <span class="text-gray-400">→</span>
                  </NuxtLink>
                  <NuxtLink
                    to="/categories"
                    class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors"
                  >
                    <span class="text-gray-700">Categorias</span>
                    <span class="text-gray-400">→</span>
                  </NuxtLink>
                  <NuxtLink
                    to="/installments"
                    class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors"
                  >
                    <span class="text-gray-700">Parcelas</span>
                    <span class="text-gray-400">→</span>
                  </NuxtLink>
                  <NuxtLink
                    to="/budget"
                    class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors"
                  >
                    <span class="text-gray-700">Orçamento</span>
                    <span class="text-gray-400">→</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </section>

          <!-- Upcoming Expenses - Clean table style -->
          <section v-if="upcomingExpenses.length > 0" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Próximas Despesas</h3>
              <span class="text-xs text-gray-500">{{ upcomingExpenses.length }} itens</span>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="expense in upcomingExpenses.slice(0, 6)"
                  :key="expense.transactionId"
                  class="flex items-start justify-between gap-3 p-3 border border-gray-100 rounded hover:border-gray-200 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ expense.description }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(expense.date) }}</p>
                  </div>
                  <span class="text-sm font-semibold text-negative whitespace-nowrap">
                    {{ formatCurrencyCompact(Math.abs(expense.amount)) }}
                  </span>
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
import { ref, computed, onMounted } from 'vue'

// Composables
const {
  transactions,
  loading,
  error,
  fetchTransactions,
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
  getMonthlyForecast,
  getHistoricalExpenses,
  getSmartInsights
} = useDashboardAnalytics()

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
const forecast = computed(() => getMonthlyForecast([...filteredTransactions.value]))
const historicalExpenses = computed(() => getHistoricalExpenses([...filteredTransactions.value]))
const smartInsights = computed(() => getSmartInsights([...filteredTransactions.value]))

// Methods
const refresh = async () => {
  try {
    // First, refresh the cache (fetch fresh data from Google Sheets)
    const result = await refreshCache()

    if (result.success) {
      console.log('Cache atualizado com sucesso:', result.message)
    } else {
      console.error('Erro ao atualizar cache:', result.error)
    }

    // Then, fetch transactions (will read from fresh cache)
    await fetchTransactions()

    // Update cache status display
    await fetchCacheStatus()
  } catch (e) {
    console.error('Erro durante atualização:', e)
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return dateString
  }
}

const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const getCurrentMonthName = () => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[new Date().getMonth()]
}

const getCurrentDay = () => {
  return new Date().getDate().toString()
}

// Lifecycle
onMounted(() => {
  fetchTransactions()
})
</script>
