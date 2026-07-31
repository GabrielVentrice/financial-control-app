<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <main class="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <LoadingState v-if="loading" message="Carregando custos fixos..." />
        <ErrorState v-else-if="error" :message="error" />

        <template v-else>
          <!-- 1. Header -->
          <header class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div class="min-w-0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider">Custos Fixos</p>
              <h1 class="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">O que se repete todo mês</h1>
            </div>

            <div class="sm:ml-auto flex items-start gap-3">
              <MonthSelector v-model="selectedMonth" />
              <SyncButton />
            </div>
          </header>

          <EmptyState
            v-if="categoryBreakdown.length === 0"
            icon="💰"
            title="Nenhum custo fixo encontrado"
            description="Não há custos fixos registrados nos últimos 6 meses para as categorias configuradas."
          />

          <div v-else class="space-y-6">
            <!-- 2. Hero band -->
            <section class="grid grid-cols-1 md:grid-cols-[1.3fr_0.9fr] gap-4">
              <div class="bg-background-card border border-border-subtle rounded-xl px-6 py-6">
                <p class="text-[13px] font-normal text-text-muted">Custo fixo em {{ selectedMonthLong }}</p>
                <p class="text-kpi-xl text-negative leading-tight mt-2">{{ formatCurrency(currentMonthTotal) }}</p>
                <p class="text-[13px] mt-2 flex flex-wrap items-center gap-x-1.5">
                  <span v-if="vsAverage" :class="['inline-flex items-center gap-1 font-medium', vsAverage.cls]">
                    <span aria-hidden="true">{{ vsAverage.arrow }}</span>{{ vsAverage.label }}
                  </span>
                  <span v-if="vsAverage" class="text-text-muted">vs. média de 6 meses</span>
                </p>
                <p class="text-[13px] text-text-muted mt-1">
                  {{ activeCategoriesCount }} {{ activeCategoriesCount === 1 ? 'categoria ativa' : 'categorias ativas' }}
                </p>
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl px-6 py-6 flex flex-col">
                <p class="text-[13px] font-normal text-text-muted">Média mensal</p>
                <p class="text-kpi-lg text-text-primary leading-tight mt-2 whitespace-nowrap">
                  {{ formatCurrency(averageMonthlyTotal) }}
                </p>
                <p class="text-[13px] text-text-secondary mt-1">últimos 6 meses</p>
                <p class="text-[13px] text-text-muted mt-auto pt-4">
                  total no período <span class="font-medium text-text-secondary">{{ formatCurrency(grandTotal) }}</span>
                </p>
              </div>
            </section>

            <!-- 3. Evolution -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Evolução</h2>
                <span class="text-[11px] text-text-muted">6 meses</span>
              </div>

              <div
                class="flex items-end gap-2 h-48"
                role="img"
                :aria-label="`Evolução dos custos fixos: ${chartAltText}`"
              >
                <div v-for="m in months" :key="m.key" class="flex-1 flex flex-col items-center gap-2 h-full">
                  <div class="flex-1 w-full flex items-end">
                    <div
                      class="w-full rounded-t-md transition-all duration-500"
                      :class="m.key === selectedMonth ? 'bg-accent-primary' : 'bg-accent-primary/25'"
                      :style="{ height: `${barHeight(m.total)}%` }"
                      :title="`${m.label}: ${formatCurrency(m.total)}`"
                    ></div>
                  </div>
                  <p class="text-[11px] tabular-nums" :class="m.key === selectedMonth ? 'text-text-primary font-medium' : 'text-text-muted'">
                    {{ m.label }}
                  </p>
                </div>
              </div>
            </section>

            <!-- 4. Breakdown -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Por categoria</h2>
                <details class="text-[12px]">
                  <summary class="cursor-pointer text-text-muted hover:text-text-secondary transition-colors">
                    {{ FIXED_COST_CATEGORIES.length }} categorias configuradas
                  </summary>
                  <div class="mt-3 flex flex-wrap gap-2 max-w-md">
                    <span
                      v-for="category in FIXED_COST_CATEGORIES"
                      :key="category"
                      class="px-2 py-1 bg-background-section text-text-muted text-[11px] rounded"
                    >{{ category }}</span>
                  </div>
                </details>
              </div>

              <ul class="divide-y divide-border-subtle">
                <li
                  v-for="category in categoryBreakdown"
                  :key="category.name"
                  class="flex flex-wrap items-center gap-x-4 gap-y-2 py-4"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-[15px] font-medium text-text-primary truncate">{{ category.name }}</p>
                    <p class="text-[13px] text-text-muted mt-0.5">
                      média {{ formatCurrency(category.average) }}/mês
                    </p>
                    <div class="mt-2 h-1.5 bg-background-hover rounded-full overflow-hidden max-w-xs">
                      <div
                        class="h-full rounded-full bg-accent-primary/60"
                        :style="{ width: `${categoryBarPct(category.total)}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Per-month sparkline of values -->
                  <div class="hidden sm:flex items-center gap-3">
                    <div v-for="m in months" :key="m.key" class="text-right w-16">
                      <p class="text-[10px] text-text-muted">{{ m.label }}</p>
                      <p
                        class="text-[12px] tabular-nums"
                        :class="category.monthlyTotals[m.key] ? 'text-text-secondary' : 'text-text-muted/50'"
                      >
                        {{ formatCurrency(category.monthlyTotals[m.key] || 0) }}
                      </p>
                    </div>
                  </div>

                  <div class="text-right ml-auto sm:ml-0 w-24">
                    <p class="text-[15px] font-semibold text-negative whitespace-nowrap">
                      {{ formatCurrency(category.monthlyTotals[selectedMonth] || 0) }}
                    </p>
                    <p class="text-[12px] text-text-muted whitespace-nowrap">{{ selectedMonthShort }}</p>
                  </div>
                </li>

                <li class="flex items-center gap-4 py-4 border-t border-border-base">
                  <p class="text-[13px] font-medium text-text-secondary uppercase tracking-wider flex-1">Total</p>
                  <div class="hidden sm:flex items-center gap-3">
                    <div v-for="m in months" :key="m.key" class="text-right w-16">
                      <p class="text-[12px] tabular-nums text-text-secondary">{{ formatCurrency(m.total) }}</p>
                    </div>
                  </div>
                  <div class="text-right ml-auto sm:ml-0 w-24">
                    <p class="text-[15px] font-semibold text-text-primary whitespace-nowrap">
                      {{ formatCurrency(currentMonthTotal) }}
                    </p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </template>
      </main>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  monthKeyOf,
  currentMonthKey,
  addMonthsToKey,
  monthIndexOfKey,
} from '~/shared/dates'
import { isRealExpense, categoryNameOf, expenseAmount } from '~/shared/expenseRules'

// The server already expands installments across months (/api/transactions),
// so this page consumes the schedule as-is.
const { transactions, loading, error } = useTransactions()
const { selectedPerson } = usePersonFilter()
const { formatCurrency, formatMonthName } = useFormatters()

// ===== CONFIGURAÇÃO: Categorias de Custos Fixos =====
const FIXED_COST_CATEGORIES = [
  'Installments/Financing',
  'Rent',
  'Financing',
  'Subscriptions/Softwares',
  'Utilities',
  'Business & Taxes',
  'Investments',
  'Insurance',
  'Medical'
]

const isFixedCostCategory = (categoryName: string): boolean => {
  const lowerCaseName = categoryName.toLowerCase()
  return FIXED_COST_CATEGORIES.some(fixed => lowerCaseName.includes(fixed.toLowerCase()))
}

const selectedMonth = ref(currentMonthKey())
const selectedMonthLong = computed(() => formatMonthName(monthIndexOfKey(selectedMonth.value)))
const selectedMonthShort = computed(() => formatMonthName(monthIndexOfKey(selectedMonth.value), true))

/** The six months ending on the selected one, as "YYYY-MM" keys. */
const monthKeys = computed(() =>
  [-5, -4, -3, -2, -1, 0].map(offset => addMonthsToKey(selectedMonth.value, offset))
)

const filteredTransactions = computed(() => {
  if (selectedPerson.value === 'Ambos') return transactions.value
  return transactions.value.filter(t => t.person === selectedPerson.value)
})

const fixedCostTransactions = computed(() =>
  filteredTransactions.value.filter(t => isRealExpense(t) && isFixedCostCategory(categoryNameOf(t)))
)

/**
 * Monthly totals, bucketed by the "YYYY-MM" slice of the date string.
 *
 * This page used to bucket with `new Date(t.date).getMonth()`, which parses the
 * plain calendar day as UTC midnight and rolls back a day in UTC-3 — so every
 * day-01 charge (rent above all) was counted in the previous month.
 */
const monthlyTotals = computed(() => {
  const totals: Record<string, number> = {}
  for (const key of monthKeys.value) totals[key] = 0

  for (const t of fixedCostTransactions.value) {
    const key = monthKeyOf(t.date)
    if (key in totals) totals[key] += expenseAmount(t)
  }

  return totals
})

const months = computed(() =>
  monthKeys.value.map(key => ({
    key,
    label: formatMonthName(monthIndexOfKey(key), true),
    total: monthlyTotals.value[key] || 0,
  }))
)

const currentMonthTotal = computed(() => monthlyTotals.value[selectedMonth.value] || 0)
const grandTotal = computed(() => months.value.reduce((sum, m) => sum + m.total, 0))
const averageMonthlyTotal = computed(() => grandTotal.value / monthKeys.value.length)

const vsAverage = computed(() => {
  if (averageMonthlyTotal.value <= 0) return null
  const pct = Math.round(((currentMonthTotal.value - averageMonthlyTotal.value) / averageMonthlyTotal.value) * 100)
  if (pct > 0) return { label: `${pct}%`, arrow: '↑', cls: 'text-negative' }
  if (pct < 0) return { label: `${Math.abs(pct)}%`, arrow: '↓', cls: 'text-positive' }
  return { label: '0%', arrow: '', cls: 'text-text-muted' }
})

interface CategoryBreakdown {
  name: string
  monthlyTotals: Record<string, number>
  total: number
  average: number
}

const categoryBreakdown = computed<CategoryBreakdown[]>(() => {
  const categoryMap = new Map<string, CategoryBreakdown>()

  for (const t of fixedCostTransactions.value) {
    const key = monthKeyOf(t.date)
    if (!monthKeys.value.includes(key)) continue

    const name = categoryNameOf(t)
    if (!categoryMap.has(name)) {
      categoryMap.set(name, { name, monthlyTotals: {}, total: 0, average: 0 })
    }

    const data = categoryMap.get(name)!
    data.monthlyTotals[key] = (data.monthlyTotals[key] || 0) + expenseAmount(t)
    data.total += expenseAmount(t)
  }

  return Array.from(categoryMap.values())
    .map(data => ({ ...data, average: data.total / monthKeys.value.length }))
    .sort((a, b) => b.total - a.total)
})

const activeCategoriesCount = computed(
  () => categoryBreakdown.value.filter(c => (c.monthlyTotals[selectedMonth.value] || 0) > 0).length
)

const chartMax = computed(() => Math.max(1, ...months.value.map(m => m.total)))
const barHeight = (value: number) => Math.max(value > 0 ? 2 : 0, (value / chartMax.value) * 100)

const categoryMax = computed(() => Math.max(1, ...categoryBreakdown.value.map(c => c.total)))
const categoryBarPct = (value: number) => Math.round((value / categoryMax.value) * 100)

const chartAltText = computed(() =>
  months.value.map(m => `${m.label} ${formatCurrency(m.total)}`).join(', ')
)
</script>
