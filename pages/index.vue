<template>
  <Sidemenu>
    <div class="bg-[#FAFBFC] text-gray-800 min-h-screen">
      <!-- Header - Clean, h-16 -->
      <header class="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-baseline gap-4">
          <h1 class="text-2xl font-normal tracking-tight text-gray-800">Dashboard</h1>
          <span class="text-sm text-gray-400">{{ getCurrentMonthName() }}</span>
          <span class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refresh" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-8 space-y-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Smart Insights - Compacto, máximo 2 insights lado a lado -->
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

          <!-- Main Stats Grid - 3 COLUNAS Light Design -->
          <section>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Receitas -->
              <LightStatCard
                label="Receitas"
                :value="monthlyStats.income"
                format="currency"
                value-color="success"
                size="lg"
                :trend="monthlyStats.trend.income"
              />

              <!-- Despesas -->
              <LightStatCard
                label="Despesas"
                :value="monthlyStats.expenses"
                format="currency"
                value-color="danger"
                size="lg"
                :trend="monthlyStats.trend.expenses"
                :invert-trend-colors="true"
              >
                <template #bottom>
                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <span>Últimos 6 meses</span>
                    <MiniSparkline
                      :data="historicalExpenses.last6Months"
                      :height="16"
                      :bar-width="3"
                      color="danger"
                    />
                  </div>
                </template>
              </LightStatCard>

              <!-- Saldo -->
              <LightStatCard
                label="Saldo"
                :value="monthlyStats.balance"
                format="currency"
                :value-color="monthlyStats.balance >= 0 ? 'success' : 'danger'"
                size="lg"
                :trend="monthlyStats.trend.balance"
              />
            </div>

            <!-- Secondary Stats - 2 COLUNAS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <!-- Média Diária -->
              <LightStatCard
                label="Média Diária"
                :value="monthlyStats.dailyAverage"
                format="currency"
                value-color="info"
                size="md"
                :secondary-stat="{ label: 'Dia ' + getCurrentDay(), value: '' }"
              />

              <!-- Projeção -->
              <LightStatCard
                label="Projeção"
                :value="forecast.projectedBalance"
                format="currency"
                :value-color="forecast.projectedBalance >= 0 ? 'success' : 'warning'"
                size="md"
                :secondary-stat="{ label: 'Fim do mês', value: '' }"
              />
            </div>
          </section>

          <!-- Two Column Layout: Categories + Activity -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Top Categories - SEM BORDAS coloridas, mais espaçoso -->
            <div class="lg:col-span-2 bg-gray-50/50 rounded-xl px-6 py-5">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-normal text-gray-700">Top Categorias</h2>
                <NuxtLink to="/categories" class="text-sm text-blue-500 hover:text-blue-600 transition-colors">
                  Ver todas →
                </NuxtLink>
              </div>

              <div v-if="topCategories.length > 0" class="space-y-4">
                <div
                  v-for="category in topCategories"
                  :key="category.name"
                  class="flex items-center gap-4"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2 mb-2">
                      <span class="text-sm text-gray-700 font-normal truncate">{{ category.name }}</span>
                      <span class="text-lg font-light text-gray-800 whitespace-nowrap">
                        {{ formatCurrencyCompact(category.total) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-gray-100 rounded-full h-[3px]">
                        <div
                          class="bg-gradient-to-r from-blue-400 to-blue-500 h-[3px] rounded-full transition-all"
                          :style="{ width: category.percentage + '%' }"
                        />
                      </div>
                      <span class="text-xs text-gray-400 whitespace-nowrap">
                        {{ category.percentage.toFixed(0) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <EmptyState
                v-else
                icon="📊"
                title="Nenhum gasto"
                description="Sem categorias de gasto este mês"
              />
            </div>

            <!-- Quick Links - SEM BORDAS coloridas -->
            <div class="space-y-4">
              <!-- Filter Badge -->
              <div class="bg-gray-50/50 rounded-xl px-5 py-4">
                <p class="text-xs text-gray-400 mb-3 uppercase tracking-wide">Filtro Ativo</p>
                <div class="flex items-center justify-between">
                  <span class="text-base font-normal text-gray-700">{{ selectedPerson }}</span>
                  <span class="text-sm text-gray-400">{{ monthlyStats.transactionCount }} transações</span>
                </div>
              </div>

              <!-- Quick Links -->
              <div class="bg-gray-50/50 rounded-xl px-5 py-4 space-y-1">
                <p class="text-xs text-gray-400 mb-4 uppercase tracking-wide">Navegação Rápida</p>
                <NuxtLink
                  to="/transactions"
                  class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  <span class="text-gray-700 font-normal">Transações</span>
                  <span class="text-gray-400">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/categories"
                  class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  <span class="text-gray-700 font-normal">Categorias</span>
                  <span class="text-gray-400">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/installments"
                  class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  <span class="text-gray-700 font-normal">Parcelas</span>
                  <span class="text-gray-400">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/budget"
                  class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  <span class="text-gray-700 font-normal">Orçamento</span>
                  <span class="text-gray-400">→</span>
                </NuxtLink>
              </div>
            </div>
          </section>

          <!-- Upcoming Expenses - SEM BORDAS coloridas -->
          <section v-if="upcomingExpenses.length > 0" class="bg-gray-50/50 rounded-xl px-6 py-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-normal text-gray-700">Próximas Despesas</h2>
              <span class="text-sm text-gray-400">{{ upcomingExpenses.length }} itens</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="expense in upcomingExpenses.slice(0, 8)"
                :key="expense.transactionId"
                class="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 last:border-0"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 font-normal truncate">{{ expense.description }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDate(expense.date) }}</p>
                </div>
                <span class="text-base font-light text-rose-400 whitespace-nowrap">
                  {{ formatCurrencyCompact(Math.abs(expense.amount)) }}
                </span>
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
} = useTransactions()

const { selectedPerson } = usePersonFilter()

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
  await fetchTransactions()
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
