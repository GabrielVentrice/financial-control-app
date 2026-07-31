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

            <div class="sm:ml-auto flex items-start gap-3">
              <MonthSelector v-model="selectedMonth" />
              <SyncButton />
            </div>
          </header>

          <!-- Empty month: the sheet may simply not be synced yet -->
          <div
            v-if="isMonthEmpty"
            class="mb-6 bg-background-card border border-amber-200 rounded-xl p-5 flex items-start gap-3"
          >
            <span class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-amber-500" aria-hidden="true"></span>
            <div class="min-w-0">
              <p class="text-[15px] font-semibold text-text-primary">
                Nenhum lançamento sincronizado em {{ selectedMonthLong }}
              </p>
              <p class="text-[13px] text-text-secondary mt-0.5">
                <template v-if="projectedOnlyTotal > 0">
                  Os {{ formatCurrency(projectedOnlyTotal) }} abaixo são
                  <strong class="font-medium">parcelas projetadas</strong>, não gastos realizados.
                </template>
                Os dados vêm do Postgres, que espelha a planilha — clique em Atualizar para sincronizar.
              </p>
            </div>
          </div>

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
                  Fatura do cartão · {{ invoiceOwner }}
                </p>
                <p class="text-kpi-lg text-negative mt-2 whitespace-nowrap">
                  {{ formatCurrency(creditCardInvoice.total, { decimals: true }) }}
                </p>
                <p class="text-[13px] text-text-secondary mt-1">
                  {{ creditCardInvoice.count }} {{ creditCardInvoice.count === 1 ? 'lançamento' : 'lançamentos' }}
                  · vence em {{ dueMonthName }}
                </p>
                <NuxtLink
                  :to="{ path: '/transactions', query: { origin: invoiceCardOrigin } }"
                  class="mt-auto pt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline self-start"
                >
                  ver fatura →
                </NuxtLink>
              </div>
            </section>

            <!-- 3. Insights -->
            <section v-if="smartInsights.length > 0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Insights de {{ selectedMonthLong }}</p>
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
                  :label="`Gastado em ${selectedMonthLong}`"
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
import { currentMonthKey, monthIndexOfKey, monthKeyOf } from '~/shared/dates'

const { transactions, loading, error } = useTransactions()

const { selectedPerson } = usePersonFilter()

const {
  getCurrentMonthStats,
  getAllCategories,
  getMonthExpenses,
  getSmartInsights,
  getCreditCardInvoice
} = useDashboardAnalytics()

const { formatCurrency, formatMonthName, formatDate } = useFormatters()

const selectedMonth = ref(currentMonthKey())
const selectedMonthLong = computed(() => formatMonthName(monthIndexOfKey(selectedMonth.value)))

const selectedCategory = ref<string | null>(null)
const transactionQuery = ref('')

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (selectedPerson.value !== 'Ambos') {
    filtered = filtered.filter(transaction => transaction.person === selectedPerson.value)
  }

  return filtered
})

const monthlyStats = computed(() => getCurrentMonthStats(filteredTransactions.value, selectedMonth.value))
const allCategories = computed(() => getAllCategories(filteredTransactions.value, selectedMonth.value))
const smartInsights = computed(() => getSmartInsights(filteredTransactions.value, selectedMonth.value))

// A month can look busy while holding nothing but projected installments —
// that is exactly what an un-synced month looks like, so treat it as empty and
// say so, instead of presenting a forecast as if it had already happened.
const realMonthRows = computed(() =>
  filteredTransactions.value.filter(t => monthKeyOf(t.date) === selectedMonth.value && !t.projected)
)
const isMonthEmpty = computed(() => realMonthRows.value.length === 0)
const projectedOnlyTotal = computed(() => (isMonthEmpty.value ? monthlyStats.value.expenses : 0))

// Credit card invoice follows the billing cycle, not the calendar month, so it
// isn't tied to the month selector. It does follow the person filter: with
// "Ambos" there is no single card to show, so we fall back to Gabriel's.
const invoiceCardOrigin = computed(() =>
  selectedPerson.value === 'Juliana' ? 'Credit Card Juliana' : 'Credit Card Gabriel'
)
const invoiceOwner = computed(() => (selectedPerson.value === 'Juliana' ? 'Juliana' : 'Gabriel'))
const creditCardInvoice = computed(() =>
  getCreditCardInvoice(transactions.value, { cardOrigin: invoiceCardOrigin.value })
)
const dueMonthName = computed(() => formatMonthName(creditCardInvoice.value.dueMonth))

const totalExpenses = computed(() => allCategories.value.reduce((sum, cat) => sum + cat.total, 0))
const maxCategoryTotal = computed(() => allCategories.value.reduce((max, cat) => Math.max(max, cat.total), 0))

const currentMonthExpenses = computed(() => getMonthExpenses(filteredTransactions.value, selectedMonth.value))

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
</script>
