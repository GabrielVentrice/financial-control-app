<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <main class="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <LoadingState v-if="loading" message="Carregando gastos..." />
        <ErrorState v-else-if="error" :message="error" />

        <template v-else>
          <!-- 1. Header -->
          <header class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div class="min-w-0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider">Gastos por Categoria</p>
              <h1 class="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">Para onde foi o dinheiro</h1>
            </div>

            <div class="sm:ml-auto flex items-center gap-3">
              <div class="inline-flex items-center h-11 rounded-full border border-border-base bg-background-card" role="group" aria-label="Mês de referência">
                <button type="button" aria-label="Mês anterior" class="px-3 h-full text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-l-full" @click="changeMonth(-1)">‹</button>
                <span class="px-1 text-[14px] font-medium text-text-primary min-w-[88px] text-center">{{ selectedMonthLong }}</span>
                <button type="button" aria-label="Próximo mês" class="px-3 h-full text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-r-full" @click="changeMonth(1)">›</button>
              </div>

              <button
                type="button"
                :disabled="loading || refreshing"
                @click="refreshData"
                class="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-border-base bg-background-card text-[14px] font-medium text-text-secondary hover:bg-background-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>
          </header>

          <!-- Empty state -->
          <EmptyState
            v-if="categories.length === 0"
            icon="📊"
            title="Nenhum gasto neste mês"
            description="Não há gastos registrados no período selecionado. Tente outro mês."
          />

          <div v-else class="space-y-6">
            <!-- 2. Hero band -->
            <section class="grid grid-cols-1 md:grid-cols-[1.3fr_0.9fr] gap-4">
              <div class="bg-background-card border border-border-subtle rounded-xl px-6 py-6">
                <p class="text-[13px] font-normal text-text-muted">Total gasto este mês</p>
                <p class="text-kpi-xl text-negative leading-tight mt-2">{{ formatCurrency(total) }}</p>
                <p class="text-[13px] mt-2 flex flex-wrap items-center gap-x-1.5">
                  <span v-if="totalTrend" :class="['inline-flex items-center gap-1 font-medium', totalTrend.cls]">
                    <span aria-hidden="true">{{ totalTrend.arrow }}</span>{{ totalTrend.label }}
                  </span>
                  <span v-if="totalTrend" class="text-text-muted">vs. mês anterior</span>
                </p>
                <p class="text-[13px] text-text-muted mt-1">{{ totalTransactions }} transações em {{ categories.length }} categorias</p>
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl px-6 py-6 flex flex-col">
                <p class="text-[13px] font-normal text-text-muted">Maior categoria</p>
                <div v-if="biggest" class="flex items-center gap-3 mt-2">
                  <CategoriesCategoryChip :name="biggest.name" :color="biggest.color" size="md" />
                  <div class="min-w-0">
                    <p class="text-[15px] font-semibold text-text-primary truncate">{{ biggest.name }}</p>
                    <p class="text-[13px] text-text-muted">{{ pct(biggest) }}% do total</p>
                  </div>
                </div>
                <p class="text-kpi-md text-negative mt-auto pt-3">{{ formatCurrency(biggest?.current || 0) }}</p>
              </div>
            </section>

            <!-- 3. Distribution card with view toggle -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Distribuição</h2>
                <div class="inline-flex p-1 rounded-full bg-background-section" role="tablist" aria-label="Visão">
                  <button
                    v-for="opt in viewOptions"
                    :key="opt.value"
                    type="button"
                    role="tab"
                    :aria-selected="view === opt.value"
                    @click="view = opt.value"
                    class="px-4 h-11 rounded-full text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    :class="view === opt.value ? 'bg-background-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- Donut view -->
              <div v-if="view === 'donut'" class="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
                <div class="justify-self-center">
                  <CategoriesCategoryDonut
                    :segments="donutSegments"
                    :total="total"
                    :center-value="formatCurrency(total, { compact: true })"
                    :highlight-key="hovered"
                    @hover="hovered = $event"
                  />
                </div>
                <ul class="space-y-1 w-full">
                  <li
                    v-for="cat in donutSegments"
                    :key="cat.key"
                    class="flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors"
                    :class="hovered === cat.key ? 'bg-background-section' : ''"
                    @mouseenter="hovered = cat.key"
                    @mouseleave="hovered = null"
                  >
                    <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ backgroundColor: cat.color }" aria-hidden="true"></span>
                    <span class="text-[14px] text-text-primary truncate flex-1 min-w-0">{{ cat.name }}</span>
                    <span class="text-[14px] font-semibold text-text-primary tabular-nums">{{ pct(cat) }}%</span>
                    <span class="text-[13px] text-text-muted tabular-nums w-20 text-right">{{ formatCurrency(cat.current) }}</span>
                  </li>
                </ul>
              </div>

              <!-- Compare view -->
              <div v-else class="space-y-4">
                <div class="flex items-center justify-end gap-4 text-[11px] text-text-muted">
                  <span class="flex items-center gap-1.5"><span class="w-3 h-2 rounded-sm bg-text-muted/70"></span>atual</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-2 rounded-sm border border-dashed border-text-muted"></span>mês anterior</span>
                </div>
                <div v-for="cat in compareList" :key="cat.key" class="flex items-center gap-3">
                  <CategoriesCategoryChip :name="cat.name" :color="cat.color" size="sm" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                      <span class="text-[14px] text-text-primary truncate">{{ cat.name }}</span>
                      <span class="text-[13px] font-semibold text-text-primary tabular-nums">{{ formatCurrency(cat.current) }}</span>
                    </div>
                    <div class="space-y-1">
                      <div class="h-2 rounded-full" :style="{ width: `${barPct(cat.current)}%`, backgroundColor: cat.color, minWidth: cat.current > 0 ? '2px' : '0' }"></div>
                      <div class="h-2 rounded-full border border-dashed" :style="{ width: `${barPct(cat.previous)}%`, borderColor: cat.color, backgroundColor: `${cat.color}1A`, minWidth: cat.previous > 0 ? '2px' : '0' }"></div>
                    </div>
                  </div>
                  <span class="text-[12px] font-medium tabular-nums w-14 text-right flex-shrink-0" :class="deltaInfo(cat).cls">
                    <span aria-hidden="true">{{ deltaInfo(cat).arrow }}</span>{{ deltaInfo(cat).label }}
                  </span>
                </div>
              </div>
            </section>

            <!-- 4. Insight -->
            <section v-if="insight">
              <div class="bg-background-card border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                <span class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-amber-500" aria-hidden="true"></span>
                <div class="min-w-0">
                  <p class="text-[15px] font-semibold text-text-primary">{{ insight.title }}</p>
                  <p class="text-[13px] text-text-secondary mt-0.5">{{ insight.message }}</p>
                </div>
              </div>
            </section>

            <!-- 5. All categories list -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Todas as categorias</h2>
                <div class="flex items-center gap-1.5" role="group" aria-label="Ordenar categorias">
                  <button
                    v-for="opt in sortOptions"
                    :key="opt.value"
                    type="button"
                    @click="sortBy = opt.value"
                    :aria-pressed="sortBy === opt.value"
                    class="px-3.5 h-11 rounded-full text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    :class="sortBy === opt.value ? 'bg-background-section text-text-primary border border-border-base' : 'text-text-muted hover:bg-background-section/60 border border-transparent'"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <ul class="divide-y divide-border-subtle">
                <li v-for="cat in sortedCategories" :key="cat.key">
                  <button
                    type="button"
                    @click="openDetail(cat)"
                    class="w-full flex flex-wrap items-center gap-x-4 gap-y-3 py-4 text-left rounded-lg hover:bg-background-section/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary px-2 -mx-2"
                  >
                    <CategoriesCategoryChip :name="cat.name" :color="cat.color" size="sm" class="order-1" />

                    <div class="min-w-0 flex-1 order-2 basis-full sm:basis-auto">
                      <div class="flex items-center justify-between gap-2 sm:block">
                        <p class="text-[15px] font-medium text-text-primary truncate">{{ cat.name }}</p>
                      </div>
                      <p class="text-[13px] text-text-muted mt-0.5">{{ cat.count }} {{ cat.count === 1 ? 'transação' : 'transações' }} · {{ pct(cat) }}% do mês</p>
                      <div class="mt-2 h-1.5 bg-background-hover rounded-full overflow-hidden">
                        <div class="h-full rounded-full" :style="{ width: `${barPct(cat.current)}%`, backgroundColor: cat.color }"></div>
                      </div>
                    </div>

                    <span class="hidden sm:inline-flex items-center gap-1 text-[12px] font-medium tabular-nums order-3 w-16 justify-end" :class="deltaInfo(cat).cls">
                      <span aria-hidden="true">{{ deltaInfo(cat).arrow }}</span>{{ deltaInfo(cat).label }}
                    </span>

                    <div class="text-right order-3 sm:order-4 ml-auto sm:ml-0">
                      <p class="text-[15px] font-semibold text-negative whitespace-nowrap">{{ formatCurrency(cat.current) }}</p>
                      <p class="text-[12px] text-text-muted whitespace-nowrap">mês passado {{ formatCurrency(cat.previous) }}</p>
                    </div>

                    <span class="text-text-muted/60 flex-shrink-0 order-4 sm:order-5" aria-hidden="true">›</span>
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </template>
      </main>
    </div>

    <!-- Drill-down modal: transactions of a category -->
    <div
      v-if="selectedCategory"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="`Transações de ${selectedCategory.name}`"
      @keydown.esc="closeDetail"
    >
      <div class="absolute inset-0 bg-black/40" @click="closeDetail"></div>
      <div class="relative bg-background-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border-base shadow-xl flex flex-col max-h-[85vh]">
        <div class="flex items-start justify-between gap-4 p-6 pb-4 border-b border-border-subtle">
          <div class="flex items-center gap-3 min-w-0">
            <CategoriesCategoryChip :name="selectedCategory.name" :color="selectedCategory.color" size="md" />
            <div class="min-w-0">
              <h2 class="text-[17px] font-semibold text-text-primary truncate">{{ selectedCategory.name }}</h2>
              <p class="text-[13px] text-text-muted">{{ selectedCategory.count }} transações · {{ formatCurrency(selectedCategory.current) }} em {{ selectedMonthLong }}</p>
            </div>
          </div>
          <button ref="closeBtn" type="button" @click="closeDetail" aria-label="Fechar" class="p-1.5 rounded-lg text-text-muted hover:bg-background-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="overflow-y-auto p-2">
          <div
            v-for="t in selectedCategory.transactions"
            :key="t.transactionId"
            class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-section"
          >
            <div class="min-w-0 flex-1">
              <p class="text-[14px] text-text-primary truncate">{{ t.description }}</p>
              <p class="text-[12px] text-text-muted mt-0.5">{{ formatDate(t.date, 'medium') }} · {{ t.origin }}</p>
            </div>
            <span class="text-[14px] font-semibold text-negative whitespace-nowrap">{{ formatCurrency(Math.abs(t.amount)) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { Transaction } from '~/types/transaction'

const { transactions: rawTransactions, loading, error, refreshing, refreshCache } = useTransactions()
const { selectedPerson } = usePersonFilter()
const { processInstallments } = useInstallments()
const { fetchCacheStatus } = useCacheStatus()
const { formatCurrency, formatMonthName, formatDate } = useFormatters()

const transactions = computed(() => processInstallments(rawTransactions.value))

// --- Month helpers (string YYYY-MM keys, timezone-safe) ---
const toKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`
const addMonths = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return toKey(d.getFullYear(), d.getMonth())
}
const now = new Date()
const selectedMonth = ref(toKey(now.getFullYear(), now.getMonth()))
const changeMonth = (delta: number) => { selectedMonth.value = addMonths(selectedMonth.value, delta) }
const selectedMonthLong = computed(() => formatMonthName(Number(selectedMonth.value.split('-')[1]) - 1))

// --- Person-filtered transactions ---
const personTransactions = computed(() => {
  if (selectedPerson.value === 'Ambos') return transactions.value
  return transactions.value.filter(t => t.person === selectedPerson.value)
})

// Destinations that are accounts/cards/adjustments are not spending categories.
const EXCLUDED = new Set([
  'adjustment',
  'credit account juliana', 'credit account gabriel',
  'bank account juliana', 'bank account gabriel',
  'credit card juliana', 'credit card gabriel'
])
const categoryNameOf = (t: Transaction) => (t.destination || '').trim() || 'Sem categoria'
const isSpending = (t: Transaction) => !EXCLUDED.has((t.destination || '').trim().toLowerCase())

// --- Categorical color (deterministic by name; amber for "Sem categoria") ---
const PALETTE = ['#4F46E5', '#2563EB', '#0891B2', '#0D9488', '#059669', '#65A30D', '#CA8A04', '#EA580C', '#DB2777', '#9333EA', '#7C3AED', '#0369A1']
const categoryColor = (name: string): string => {
  if (/sem categoria/i.test(name)) return '#D97706'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

// Aggregate spending by category for a given month key.
const aggregateMonth = (monthKey: string) => {
  const map = new Map<string, { total: number; count: number; transactions: Transaction[] }>()
  personTransactions.value
    .filter(t => t.date.substring(0, 7) === monthKey && isSpending(t))
    .forEach(t => {
      const name = categoryNameOf(t)
      const e = map.get(name) || { total: 0, count: 0, transactions: [] }
      e.total += t.amount
      e.count += 1
      e.transactions.push(t)
      map.set(name, e)
    })
  return map
}

interface Category {
  key: string
  name: string
  color: string
  current: number
  previous: number
  count: number
  transactions: Transaction[]
}

// Merge current + previous month into one model per category.
const categories = computed<Category[]>(() => {
  const cur = aggregateMonth(selectedMonth.value)
  const prev = aggregateMonth(addMonths(selectedMonth.value, -1))
  const names = new Set<string>([...cur.keys(), ...prev.keys()])

  return Array.from(names)
    .map(name => {
      const c = cur.get(name)
      return {
        key: name,
        name,
        color: categoryColor(name),
        current: c?.total || 0,
        previous: prev.get(name)?.total || 0,
        count: c?.count || 0,
        transactions: (c?.transactions || []).sort((a, b) => (a.date < b.date ? 1 : -1))
      }
    })
    // Keep categories that have spending in the current month (the screen is about "this month").
    .filter(c => c.current > 0)
})

const total = computed(() => categories.value.reduce((s, c) => s + c.current, 0))
const previousTotal = computed(() => categories.value.reduce((s, c) => s + c.previous, 0))
const totalTransactions = computed(() => categories.value.reduce((s, c) => s + c.count, 0))

const pct = (cat: Category) => (total.value > 0 ? Math.round((cat.current / total.value) * 100) : 0)

const totalTrend = computed(() => {
  if (previousTotal.value <= 0) return null
  const p = Math.round(((total.value - previousTotal.value) / previousTotal.value) * 100)
  if (p > 0) return { label: `${p}%`, arrow: '↑', cls: 'text-negative' }
  if (p < 0) return { label: `${Math.abs(p)}%`, arrow: '↓', cls: 'text-positive' }
  return { label: '0%', arrow: '', cls: 'text-text-muted' }
})

const biggest = computed(() => categories.value.slice().sort((a, b) => b.current - a.current)[0] || null)

// Bar scale: largest current-or-previous value across categories.
const barScale = computed(() =>
  Math.max(1, ...categories.value.map(c => Math.max(c.current, c.previous)))
)
const barPct = (v: number) => Math.round((v / barScale.value) * 100)

// Trend chip per category (rising expense = red, falling = green, new = amber).
const deltaInfo = (cat: Category) => {
  if (cat.previous === 0 && cat.current > 0) return { kind: 'new', label: 'novo', arrow: '', cls: 'text-warning' }
  if (cat.previous === 0) return { kind: 'flat', label: '—', arrow: '', cls: 'text-text-muted' }
  const p = Math.round(((cat.current - cat.previous) / cat.previous) * 100)
  if (p > 0) return { kind: 'up', label: `+${p}%`, arrow: '↑', cls: 'text-negative' }
  if (p < 0) return { kind: 'down', label: `${p}%`, arrow: '↓', cls: 'text-positive' }
  return { kind: 'flat', label: '—', arrow: '', cls: 'text-text-muted' }
}

// --- Distribution / donut ---
const donutSegments = computed(() =>
  categories.value
    .slice()
    .sort((a, b) => b.current - a.current)
    .map(c => ({ key: c.key, name: c.name, color: c.color, value: c.current }))
)
const hovered = ref<string | null>(null)

// --- Compare view (sorted by current spend) ---
const compareList = computed(() => categories.value.slice().sort((a, b) => b.current - a.current))

// --- View toggle ---
type ViewKey = 'donut' | 'compare'
const view = ref<ViewKey>('donut')
const viewOptions: { value: ViewKey; label: string }[] = [
  { value: 'donut', label: 'Distribuição' },
  { value: 'compare', label: 'vs. mês anterior' }
]

// --- Insight: biggest absolute rise vs previous month ---
const insight = computed(() => {
  const risers = categories.value
    .filter(c => c.current > c.previous && c.previous > 0)
    .map(c => ({ c, abs: c.current - c.previous, pct: Math.round(((c.current - c.previous) / c.previous) * 100) }))
    .sort((a, b) => b.abs - a.abs)
  const top = risers[0]
  if (!top || top.pct < 15) return null
  return {
    title: `${top.c.name} subiu ${top.pct}% vs. mês passado`,
    message: `De ${formatCurrency(top.c.previous)} para ${formatCurrency(top.c.current)} (+${formatCurrency(top.abs)}). Toque na categoria para ver as transações.`
  }
})

// --- Sorting (list) ---
type SortKey = 'valor' | 'alta'
const sortBy = ref<SortKey>('valor')
const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'valor', label: 'Maior gasto' },
  { value: 'alta', label: 'Maior alta' }
]
const riseRank = (c: Category) => {
  if (c.previous === 0) return c.current > 0 ? Number.POSITIVE_INFINITY : 0
  return (c.current - c.previous) / c.previous
}
const sortedCategories = computed(() => {
  const list = categories.value.slice()
  if (sortBy.value === 'alta') return list.sort((a, b) => riseRank(b) - riseRank(a))
  return list.sort((a, b) => b.current - a.current)
})

// --- Drill-down modal ---
const selectedCategory = ref<Category | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const openDetail = async (cat: Category) => {
  selectedCategory.value = cat
  await nextTick()
  closeBtn.value?.focus()
}
const closeDetail = () => { selectedCategory.value = null }

// --- Refresh ---
const refreshData = async () => {
  try {
    await refreshCache()
    await fetchCacheStatus()
  } catch (e) {
    console.error('Erro ao atualizar categorias:', e)
  }
}
</script>
