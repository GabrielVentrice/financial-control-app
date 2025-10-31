<template>
  <Sidemenu>
    <div class="bg-background-page text-text-primary min-h-screen">
      <!-- Compact Header -->
      <header class="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border-base">
        <div class="flex items-baseline gap-3">
          <h1 class="text-[18px] font-medium tracking-tight">Dashboard</h1>
          <span class="text-[12px] text-text-muted">{{ getCurrentMonthName() }}</span>
          <span class="px-2 py-0.5 text-[11px] font-medium bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
            {{ selectedPerson }}
          </span>
        </div>
        <BaseButton size="sm" variant="secondary" @click="refresh" :loading="loading">
          Atualizar
        </BaseButton>
      </header>

      <!-- Content -->
      <main class="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-6 space-y-5">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- Smart Insights (Compact, High Priority Only) -->
          <section v-if="smartInsights.length > 0" class="space-y-2">
            <InsightCard
              v-for="(insight, index) in smartInsights.slice(0, 3)"
              :key="index"
              :type="insight.type"
              :title="insight.title"
              :message="insight.message"
              :value="insight.value"
            />
          </section>

          <!-- Main Stats Grid - DENSE 5 columns -->
          <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <!-- Balance -->
            <DenseStatCard
              label="Saldo"
              :value="monthlyStats.balance"
              format="currency"
              :value-color="monthlyStats.balance >= 0 ? 'success' : 'danger'"
              :trend="monthlyStats.trend.balance"
              :secondary-stat="{ label: 'Transações', value: monthlyStats.transactionCount }"
            />

            <!-- Income -->
            <DenseStatCard
              label="Receitas"
              :value="monthlyStats.income"
              format="currency"
              value-color="success"
              :trend="monthlyStats.trend.income"
              :secondary-stat="{ label: 'vs Média', value: formatTrendValue(monthlyStats.comparison.incomeVsAvg) }"
            />

            <!-- Expenses -->
            <DenseStatCard
              label="Despesas"
              :value="monthlyStats.expenses"
              format="currency"
              value-color="danger"
              :trend="monthlyStats.trend.expenses"
              :invert-trend-colors="true"
              :secondary-stat="{ label: 'vs Média', value: formatTrendValue(monthlyStats.comparison.expensesVsAvg) }"
            >
              <template #bottom>
                <div class="flex items-center justify-between text-[10px] text-text-muted">
                  <span>6 meses</span>
                  <MiniSparkline
                    :data="historicalExpenses.last6Months"
                    :height="16"
                    :bar-width="3"
                    color="danger"
                  />
                </div>
              </template>
            </DenseStatCard>

            <!-- Daily Average -->
            <DenseStatCard
              label="Média Diária"
              :value="monthlyStats.dailyAverage"
              format="currency"
              value-color="info"
              :secondary-stat="{ label: 'Dia', value: getCurrentDay() }"
            />

            <!-- Forecast -->
            <DenseStatCard
              label="Projeção"
              :value="forecast.projectedBalance"
              format="currency"
              :value-color="forecast.projectedBalance >= 0 ? 'success' : 'warning'"
              :secondary-stat="{ label: 'Fim do mês', value: '' }"
            />
          </section>

          <!-- Two Column Layout: Categories + Activity -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <!-- Top Categories - Flat Design -->
            <div class="lg:col-span-2 border-l-2 border-l-accent-primary pl-4 py-2">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-[14px] font-medium">Top Categorias</h2>
                <NuxtLink to="/categories" class="text-[11px] text-accent-primary hover:underline">
                  Ver todas →
                </NuxtLink>
              </div>

              <div v-if="topCategories.length > 0" class="space-y-3">
                <div
                  v-for="category in topCategories"
                  :key="category.name"
                  class="flex items-center gap-3"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2 mb-1">
                      <span class="text-[13px] text-text-primary truncate">{{ category.name }}</span>
                      <span class="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                        {{ formatCurrency(category.total) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 bg-background-section rounded-full h-1">
                        <div
                          class="bg-accent-primary h-1 rounded-full transition-all"
                          :style="{ width: category.percentage + '%' }"
                        />
                      </div>
                      <span class="text-[10px] text-text-muted whitespace-nowrap">
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

            <!-- Quick Links & Filter - Flat Design -->
            <div class="space-y-4">
              <!-- Filter Badge -->
              <div class="border-l-2 border-l-accent-info pl-3 py-2">
                <p class="text-[11px] text-text-muted mb-1.5 uppercase tracking-wide">Filtro Ativo</p>
                <div class="flex items-center justify-between">
                  <span class="text-[15px] font-medium text-text-primary">{{ selectedPerson }}</span>
                  <span class="text-[11px] text-text-muted">{{ monthlyStats.transactionCount }} transações</span>
                </div>
              </div>

              <!-- Quick Links -->
              <div class="border-l-2 border-l-border-base pl-3 py-2 space-y-1.5">
                <p class="text-[11px] text-text-muted mb-2 uppercase tracking-wide">Navegação Rápida</p>
                <NuxtLink
                  to="/transactions"
                  class="flex items-center justify-between px-2 py-1.5 hover:bg-background-hover rounded text-[13px] transition-colors"
                >
                  <span class="text-text-primary">Transações</span>
                  <span class="text-[18px]">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/categories"
                  class="flex items-center justify-between px-2 py-1.5 hover:bg-background-hover rounded text-[13px] transition-colors"
                >
                  <span class="text-text-primary">Categorias</span>
                  <span class="text-[18px]">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/installments"
                  class="flex items-center justify-between px-2 py-1.5 hover:bg-background-hover rounded text-[13px] transition-colors"
                >
                  <span class="text-text-primary">Parcelas</span>
                  <span class="text-[18px]">→</span>
                </NuxtLink>
                <NuxtLink
                  to="/budget"
                  class="flex items-center justify-between px-2 py-1.5 hover:bg-background-hover rounded text-[13px] transition-colors"
                >
                  <span class="text-text-primary">Orçamento</span>
                  <span class="text-[18px]">→</span>
                </NuxtLink>
              </div>
            </div>
          </section>

          <!-- Upcoming Expenses - Flat Design -->
          <section v-if="upcomingExpenses.length > 0" class="border-l-2 border-l-accent-danger pl-4 py-2">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-[14px] font-medium">Próximas Despesas</h2>
              <span class="text-[11px] text-text-muted">{{ upcomingExpenses.length }} itens</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="expense in upcomingExpenses.slice(0, 8)"
                :key="expense.transactionId"
                class="flex items-start justify-between gap-2 pb-2 border-b border-border-base"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] text-text-primary truncate font-medium">{{ expense.description }}</p>
                  <p class="text-[10px] text-text-muted mt-0.5">{{ formatDate(expense.date) }}</p>
                </div>
                <span class="text-[12px] font-semibold text-accent-danger whitespace-nowrap">
                  {{ formatCurrency(Math.abs(expense.amount)) }}
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

// Dashboard Analytics - Now with rich historical data
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatTrendValue = (value: number) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(0)}%`
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
