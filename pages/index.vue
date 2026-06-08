<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <main class="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <!-- Loading State -->
        <LoadingState v-if="loading" message="Carregando dados financeiros..." />

        <!-- Error State -->
        <ErrorState v-else-if="error" :message="error" />

        <!-- Dashboard Content -->
        <template v-else>
          <!-- 1. Header (in-column) -->
          <header class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div class="min-w-0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider">Dashboard</p>
              <h1 class="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">Visão geral</h1>
            </div>

            <div class="sm:ml-auto flex items-center gap-3">
              <!-- Month selector (visual; current month) -->
              <div
                class="inline-flex items-center h-11 rounded-full border border-border-base bg-background-card"
                role="group"
                aria-label="Mês de referência"
              >
                <button
                  type="button"
                  disabled
                  aria-label="Mês anterior"
                  title="Navegação de meses em breve"
                  class="px-3 h-full text-text-muted opacity-40 cursor-not-allowed"
                >‹</button>
                <span class="px-1 text-[14px] font-medium text-text-primary min-w-[64px] text-center">
                  {{ currentMonthName }}
                </span>
                <button
                  type="button"
                  disabled
                  aria-label="Próximo mês"
                  title="Navegação de meses em breve"
                  class="px-3 h-full text-text-muted opacity-40 cursor-not-allowed"
                >›</button>
              </div>

              <!-- Refresh -->
              <button
                type="button"
                :disabled="loading || refreshing"
                @click="refresh"
                class="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-border-base bg-background-card text-[14px] font-medium text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  :class="{ 'animate-spin': refreshing }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>
          </header>

          <div class="space-y-6">
            <!-- 2. Hero band: Saldo Disponível + Fatura do cartão -->
            <section class="grid grid-cols-1 md:grid-cols-[1.3fr_0.9fr] gap-4">
              <!-- Saldo Disponível (hero) -->
              <div class="bg-background-card border border-border-subtle rounded-xl">
                <LightStatCard
                  label="Saldo Disponível"
                  :value="monthlyStats.balance"
                  format="currency"
                  :value-color="monthlyStats.balance >= 0 ? 'positive' : 'negative'"
                  size="xl"
                  :trend="monthlyStats.trend.balance"
                  :secondary-stat="{
                    value: `${formatCurrency(monthlyStats.income)} entradas`,
                    label: `${formatCurrency(monthlyStats.expenses)} saídas`
                  }"
                />
              </div>

              <!-- Fatura do cartão -->
              <div class="bg-background-card border border-red-200 rounded-xl px-6 py-6 flex flex-col">
                <p class="text-[13px] font-medium text-text-muted uppercase tracking-wider">
                  Fatura do cartão · Gabriel
                </p>
                <p class="text-kpi-lg text-negative mt-2 whitespace-nowrap">
                  {{ formatCurrency(creditCardInvoice.total, { decimals: true }) }}
                </p>
                <p class="text-[13px] text-text-secondary mt-1">
                  {{ creditCardInvoice.count }} {{ creditCardInvoice.count === 1 ? 'lançamento' : 'lançamentos' }}
                  · vence em {{ dueMonthName }}
                </p>
                <NuxtLink
                  to="/transactions"
                  class="mt-auto pt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline self-start"
                >
                  ver fatura →
                </NuxtLink>
              </div>
            </section>

            <!-- 3. Insights -->
            <section v-if="smartInsights.length > 0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Insights do mês</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(insight, index) in smartInsights.slice(0, 2)"
                  :key="index"
                  class="bg-background-card border border-border-subtle rounded-xl p-5 flex items-start gap-3"
                >
                  <span
                    class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    :class="insightDotClass[insight.type]"
                    aria-hidden="true"
                  ></span>
                  <div class="min-w-0">
                    <p class="text-[15px] font-semibold text-text-primary">{{ insight.title }}</p>
                    <p class="text-[13px] text-text-secondary mt-0.5">
                      {{ insight.message }}
                      <span v-if="insight.value !== undefined"> · {{ formatCurrency(insight.value) }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- 4. KPIs: Gastado este mês + Receitas -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-background-card border border-border-subtle rounded-xl">
                <LightStatCard
                  label="Gastado este mês"
                  :value="monthlyStats.expenses"
                  format="currency"
                  value-color="negative"
                  size="lg"
                  :trend="monthlyStats.trend.expenses"
                  :invert-trend-colors="true"
                  :secondary-stat="{
                    value: `${formatCurrency(monthlyStats.dailyAverage)}/dia`,
                    label: `${monthlyStats.transactionCount} transações`
                  }"
                />
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl">
                <LightStatCard
                  label="Receitas"
                  :value="monthlyStats.income"
                  format="currency"
                  value-color="positive"
                  size="lg"
                  :trend="monthlyStats.trend.income"
                  :secondary-stat="{ value: '', label: 'entradas do mês' }"
                />
              </div>
            </section>

            <!-- 5. Fluxo de Caixa -->
            <section>
              <DashboardCashFlowChart :transactions="filteredTransactions" />
            </section>

            <!-- 6. Bottom band: Categorias + Todos os Gastos -->
            <section class="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 items-start">
              <!-- Categorias -->
              <div class="bg-background-card border border-border-subtle rounded-xl p-5">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Categorias</h2>
                  <span class="text-[11px] text-text-muted">{{ allCategories.length }}</span>
                </div>

                <div v-if="allCategories.length > 0" class="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                  <!-- Todas -->
                  <button
                    type="button"
                    @click="selectedCategory = null"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-150"
                    :class="selectedCategory === null ? 'bg-background-section' : 'hover:bg-background-section/60'"
                  >
                    <span class="text-[14px] font-medium text-text-primary">Todas</span>
                    <span class="text-[14px] font-semibold text-text-primary">{{ formatCurrency(totalExpenses) }}</span>
                  </button>

                  <!-- Category items -->
                  <button
                    v-for="(category, index) in allCategories"
                    :key="category.name"
                    type="button"
                    @click="selectedCategory = category.name"
                    class="w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-150"
                    :class="[
                      selectedCategory === category.name ? 'bg-background-section' : 'hover:bg-background-section/60',
                      category.name === 'Sem categoria' ? 'ring-1 ring-amber-200' : ''
                    ]"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: swatchColor(category.name, index) }"
                          aria-hidden="true"
                        ></span>
                        <span class="text-[14px] text-text-primary truncate">{{ category.name }}</span>
                        <span class="text-[12px] text-text-muted flex-shrink-0">{{ category.count }}</span>
                      </div>
                      <span class="text-[14px] font-semibold text-negative whitespace-nowrap">
                        {{ formatCurrency(category.total) }}
                      </span>
                    </div>
                    <!-- Proportion bar -->
                    <div class="mt-2 h-1.5 bg-background-hover rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500 ease-out"
                        :style="{
                          width: `${maxCategoryTotal > 0 ? (category.total / maxCategoryTotal) * 100 : 0}%`,
                          backgroundColor: swatchColor(category.name, index)
                        }"
                      ></div>
                    </div>
                  </button>
                </div>
                <div v-else class="p-8 text-center">
                  <p class="text-[13px] text-text-secondary">Nenhum gasto registrado</p>
                </div>
              </div>

              <!-- Todos os Gastos -->
              <div class="bg-background-card border border-border-subtle rounded-xl p-5">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">
                    {{ selectedCategory ? `Gastos · ${selectedCategory}` : 'Todos os Gastos' }}
                  </h2>
                  <span class="text-[11px] text-text-muted">
                    {{ displayedExpenses.length }} {{ displayedExpenses.length === 1 ? 'lançamento' : 'lançamentos' }}
                  </span>
                </div>

                <!-- Search -->
                <div class="relative mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    v-model="transactionQuery"
                    type="search"
                    aria-label="Buscar transações"
                    placeholder="buscar por descrição, valor…"
                    class="w-full h-11 pl-9 pr-3 rounded-lg bg-background-section border border-border-subtle text-[14px] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
                  />
                </div>

                <div v-if="displayedExpenses.length > 0" class="max-h-[420px] overflow-y-auto -mx-1 px-1">
                  <div
                    v-for="expense in displayedExpenses"
                    :key="expense.transactionId"
                    class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-section transition-colors duration-150"
                    :title="expense.description"
                  >
                    <span class="w-2 h-2 rounded-full bg-negative/50 flex-shrink-0" aria-hidden="true"></span>
                    <div class="min-w-0 flex-1">
                      <p class="text-[15px] font-medium text-text-primary truncate">{{ expense.description }}</p>
                      <p class="text-[13px] text-text-muted mt-0.5">
                        {{ formatDate(expense.date) }} · {{ expense.destination || 'Sem categoria' }}
                      </p>
                    </div>
                    <span class="text-[15px] font-semibold text-negative whitespace-nowrap">
                      – {{ formatCurrency(Math.abs(expense.amount)) }}
                    </span>
                    <span class="text-text-muted/60 flex-shrink-0" aria-hidden="true">›</span>
                  </div>
                </div>
                <div v-else class="p-8 text-center">
                  <p class="text-[13px] text-text-secondary">Nenhum gasto encontrado</p>
                </div>

                <NuxtLink
                  to="/transactions"
                  class="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
                >
                  ver todos →
                </NuxtLink>
              </div>
            </section>
          </div>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SmartInsight } from '~/composables/useDashboardAnalytics'

const {
  transactions,
  loading,
  error,
  refreshCache,
  refreshing
} = useTransactions()

const { selectedPerson } = usePersonFilter()

const { fetchCacheStatus } = useCacheStatus()

const {
  getCurrentMonthStats,
  getAllCategories,
  getCurrentMonthExpenses,
  getSmartInsights,
  getCreditCardInvoice
} = useDashboardAnalytics()

const { formatCurrency, formatMonthName, formatDate } = useFormatters()

const selectedCategory = ref<string | null>(null)
const transactionQuery = ref('')

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => transaction.person === selectedPerson.value)
  }

  return filtered
})

const monthlyStats = computed(() => getCurrentMonthStats([...filteredTransactions.value]))
const allCategories = computed(() => getAllCategories([...filteredTransactions.value]))
const smartInsights = computed(() => getSmartInsights([...filteredTransactions.value]))

// Credit card invoice for Gabriel's card (billing cycle, not calendar month).
// Uses ALL transactions (not the person filter) and selects by card origin.
const creditCardInvoice = computed(() => getCreditCardInvoice([...transactions.value]))
const dueMonthName = computed(() => formatMonthName(creditCardInvoice.value.dueMonth))

const totalExpenses = computed(() => allCategories.value.reduce((sum, cat) => sum + cat.total, 0))
const maxCategoryTotal = computed(() => allCategories.value.reduce((max, cat) => Math.max(max, cat.total), 0))

const currentMonthExpenses = computed(() => getCurrentMonthExpenses([...filteredTransactions.value]))

const displayedExpenses = computed(() => {
  let list = currentMonthExpenses.value

  if (selectedCategory.value) {
    list = list.filter(t => (t.destination || 'Sem categoria') === selectedCategory.value)
  }

  const q = transactionQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t => {
      const desc = (t.description || '').toLowerCase()
      const cat = (t.destination || 'Sem categoria').toLowerCase()
      const amount = Math.abs(t.amount).toString()
      const amountBr = formatCurrency(Math.abs(t.amount)).toLowerCase()
      return desc.includes(q) || cat.includes(q) || amount.includes(q) || amountBr.includes(q)
    })
  }

  return list
})

const currentMonthName = computed(() => formatMonthName(new Date().getMonth()))

const insightDotClass: Record<SmartInsight['type'], string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500'
}

// Category swatches: a small on-palette set, amber reserved for "Sem categoria".
const SWATCH_PALETTE = ['#4F46E5', '#2563EB', '#059669', '#0891B2', '#7C3AED', '#DB2777', '#0D9488', '#CA8A04']
const swatchColor = (name: string, index: number): string => {
  if (name === 'Sem categoria') return '#D97706'
  return SWATCH_PALETTE[index % SWATCH_PALETTE.length]
}

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
    console.error('Erro durante atualização:', e)
  }
}
</script>
