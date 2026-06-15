<template>
  <Sidemenu>
    <div class="bg-background-page min-h-screen">
      <main class="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <LoadingState v-if="loading" message="Carregando parcelas..." />
        <ErrorState v-else-if="error" :message="error" />

        <template v-else>
          <!-- 1. Header -->
          <header class="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div class="min-w-0">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider">Parcelas Ativas</p>
              <h1 class="text-2xl font-semibold text-text-primary tracking-tight mt-0.5">O que já está comprometido</h1>
            </div>

            <div class="sm:ml-auto flex items-center gap-3">
              <!-- Month selector -->
              <div
                class="inline-flex items-center h-11 rounded-full border border-border-base bg-background-card"
                role="group"
                aria-label="Mês de referência"
              >
                <button
                  type="button"
                  aria-label="Mês anterior"
                  class="px-3 h-full text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-l-full"
                  @click="changeMonth(-1)"
                >‹</button>
                <span class="px-1 text-[14px] font-medium text-text-primary min-w-[88px] text-center">
                  {{ selectedMonthLong }}
                </span>
                <button
                  type="button"
                  aria-label="Próximo mês"
                  class="px-3 h-full text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-r-full"
                  @click="changeMonth(1)"
                >›</button>
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
            v-if="activeSeries.length === 0"
            icon="📅"
            title="Nenhuma parcela ativa"
            description="Você não tem parcelas ou financiamentos em aberto neste mês. Sua renda está livre de compromissos parcelados. 🎉"
          />

          <div v-else class="space-y-6">
            <!-- 2. Hero band -->
            <section class="grid grid-cols-1 md:grid-cols-[1.3fr_0.9fr] gap-4">
              <!-- Comprometido este mês -->
              <div class="bg-background-card border border-border-subtle rounded-xl px-6 py-6">
                <p class="text-[13px] font-normal text-text-muted">Comprometido este mês</p>
                <p class="text-kpi-xl text-negative leading-tight mt-2">{{ formatCurrency(committedThisMonth) }}</p>
                <p class="text-[13px] mt-2 flex items-center gap-1.5">
                  <span v-if="referenceIncome > 0" class="text-text-secondary">
                    {{ committedPct }}% da sua renda
                  </span>
                  <span v-else class="text-text-secondary">renda do mês indisponível</span>
                  <template v-if="referenceIncome > 0">
                    <span class="text-text-muted">·</span>
                    <span :class="['inline-flex items-center gap-1 font-medium', overLimit ? 'text-warning' : 'text-positive']">
                      <span class="w-1.5 h-1.5 rounded-full" :class="overLimit ? 'bg-warning' : 'bg-positive'" aria-hidden="true"></span>
                      {{ overLimit ? 'acima do saudável' : 'dentro do saudável' }}
                    </span>
                  </template>
                </p>
                <p class="text-[12px] text-text-muted mt-3">limite saudável: 30% da renda</p>
              </div>

              <!-- Saldo devedor total -->
              <div class="bg-background-card border border-red-200 rounded-xl px-6 py-6 flex flex-col">
                <p class="text-[13px] font-normal text-text-muted">Saldo devedor total</p>
                <p class="text-kpi-lg text-negative leading-tight mt-2 whitespace-nowrap">{{ formatCurrency(totalDebt) }}</p>
                <p class="text-[13px] text-text-secondary mt-1">soma de todas as parcelas a vencer</p>
                <p class="text-[13px] text-text-muted mt-auto pt-4">
                  quita em <span class="font-medium text-text-secondary">{{ endLabel }}</span>
                </p>
              </div>
            </section>

            <!-- 3. KPIs -->
            <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-background-card border border-border-subtle rounded-xl">
                <LightStatCard
                  label="Parcelas ativas"
                  :value="activeSeries.length"
                  format="number"
                  value-color="neutral"
                  size="lg"
                  :secondary-stat="{ value: '', label: `${activeSeries.length} série(s) em aberto` }"
                />
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl">
                <LightStatCard
                  label="Próximo alívio"
                  :value="nextReliefValue"
                  format="text"
                  :value-color="nextRelief ? 'positive' : 'default'"
                  size="lg"
                  :secondary-stat="{ value: '', label: nextRelief ? 'quando a próxima encerra' : 'nenhuma encerra em 12 meses' }"
                />
              </div>

              <div class="bg-background-card border border-border-subtle rounded-xl">
                <LightStatCard
                  label="Término previsto"
                  :value="endLabel"
                  format="text"
                  value-color="neutral"
                  size="lg"
                  :secondary-stat="{ value: '', label: 'última parcela a vencer' }"
                />
              </div>
            </section>

            <!-- 4. Commitment chart -->
            <section>
              <InstallmentsCommitmentChart
                :months="projection"
                :y-max="chartYMax"
                :limit="healthyLimit"
                :limit-label="limitLabel"
                :legend="legend"
              />
            </section>

            <!-- 5. Insight -->
            <section v-if="reliefInsight">
              <div class="bg-background-card border border-border-subtle rounded-xl p-5 flex items-start gap-3">
                <span class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-emerald-500" aria-hidden="true"></span>
                <div class="min-w-0">
                  <p class="text-[15px] font-semibold text-text-primary">{{ reliefInsight.title }}</p>
                  <p class="text-[13px] text-text-secondary mt-0.5">{{ reliefInsight.message }}</p>
                </div>
              </div>
            </section>

            <!-- 6. List -->
            <section class="bg-background-card border border-border-subtle rounded-xl p-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">Suas parcelas</h2>
                <div class="flex items-center gap-1.5" role="group" aria-label="Ordenar parcelas">
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
                <li v-for="series in sortedSeries" :key="series.key">
                  <button
                    type="button"
                    @click="openDetail(series)"
                    class="w-full flex flex-wrap items-center gap-x-4 gap-y-3 py-4 text-left rounded-lg hover:bg-background-section/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary px-2 -mx-2"
                  >
                    <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0 order-1" :style="{ backgroundColor: series.color }" aria-hidden="true"></span>

                    <div class="min-w-0 flex-1 order-2">
                      <p class="text-[15px] font-medium text-text-primary truncate">{{ series.name }}</p>
                      <p class="text-[13px] text-text-muted truncate">{{ series.category }}</p>
                    </div>

                    <!-- Progress: inline on desktop, full-width row on mobile -->
                    <div class="basis-full order-5 sm:basis-44 sm:flex-none sm:order-3">
                      <div class="h-1.5 bg-background-hover rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :style="{ width: `${series.pctPaid}%`, backgroundColor: series.color }"
                        ></div>
                      </div>
                      <p class="text-[12px] text-text-muted mt-1">
                        {{ series.paid }}/{{ series.total }} pagas · {{ series.remaining }} restantes
                      </p>
                    </div>

                    <div class="text-right order-3 ml-auto sm:ml-0 sm:order-4">
                      <p class="text-[15px] font-semibold text-negative whitespace-nowrap">{{ formatCurrency(series.amount) }}/mês</p>
                      <p class="text-[12px] text-text-muted whitespace-nowrap">faltam {{ formatCurrency(series.toPay) }}</p>
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

    <!-- Detail modal -->
    <div
      v-if="selectedParcela"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="`Detalhe da parcela ${selectedParcela.name}`"
      @keydown.esc="closeDetail"
    >
      <div class="absolute inset-0 bg-black/40" @click="closeDetail"></div>
      <div class="relative bg-background-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border-base shadow-xl p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: selectedParcela.color }" aria-hidden="true"></span>
            <div class="min-w-0">
              <h2 class="text-[17px] font-semibold text-text-primary truncate">{{ selectedParcela.name }}</h2>
              <p class="text-[13px] text-text-muted">{{ selectedParcela.category }} · {{ selectedParcela.origin }}</p>
            </div>
          </div>
          <button
            ref="closeBtn"
            type="button"
            @click="closeDetail"
            aria-label="Fechar"
            class="p-1.5 rounded-lg text-text-muted hover:bg-background-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="h-1.5 bg-background-hover rounded-full overflow-hidden mb-1">
          <div class="h-full rounded-full" :style="{ width: `${selectedParcela.pctPaid}%`, backgroundColor: selectedParcela.color }"></div>
        </div>
        <p class="text-[12px] text-text-muted mb-5">{{ selectedParcela.paid }} de {{ selectedParcela.total }} pagas · {{ selectedParcela.remaining }} restantes</p>

        <dl class="grid grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <dt class="text-[12px] text-text-muted">Valor por mês</dt>
            <dd class="text-[15px] font-semibold text-negative">{{ formatCurrency(selectedParcela.amount) }}</dd>
          </div>
          <div>
            <dt class="text-[12px] text-text-muted">Falta pagar</dt>
            <dd class="text-[15px] font-semibold text-negative">{{ formatCurrency(selectedParcela.toPay) }}</dd>
          </div>
          <div>
            <dt class="text-[12px] text-text-muted">Primeira parcela</dt>
            <dd class="text-[15px] text-text-primary">{{ monthYear(selectedParcela.firstMonth) }}</dd>
          </div>
          <div>
            <dt class="text-[12px] text-text-muted">Última parcela</dt>
            <dd class="text-[15px] text-text-primary">{{ monthYear(selectedParcela.lastMonth) }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

const {
  transactions: rawTransactions,
  loading,
  error,
  refreshing,
  refreshCache
} = useTransactions()

const { selectedPerson } = usePersonFilter()
const { processInstallments, parseInstallment, isInstallmentTransaction } = useInstallments()
const { fetchCacheStatus } = useCacheStatus()
const { formatCurrency, formatMonthName } = useFormatters()

// Expand installments into their full monthly schedule.
const transactions = computed(() => processInstallments(rawTransactions.value))

// --- Month helpers (string YYYY-MM keys — timezone-safe) ---
const toKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`
const addMonths = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return toKey(d.getFullYear(), d.getMonth())
}
// Absolute month index (year*12 + month) for arithmetic, and its inverse.
const monthToIdx = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return y * 12 + (m - 1)
}
const idxToKey = (idx: number) => toKey(Math.floor(idx / 12), idx % 12)
const shortMonth = (key: string) => {
  const m = Number(key.split('-')[1])
  return formatMonthName(m - 1, true)
}
const monthYear = (key: string) => {
  if (!key) return '—'
  const [y, m] = key.split('-')
  return `${formatMonthName(Number(m) - 1, true)}/${y}`
}

const now = new Date()
const currentMonthKey = toKey(now.getFullYear(), now.getMonth())
const selectedMonth = ref(currentMonthKey)
const changeMonth = (delta: number) => { selectedMonth.value = addMonths(selectedMonth.value, delta) }

const selectedMonthLong = computed(() => {
  const m = Number(selectedMonth.value.split('-')[1])
  return formatMonthName(m - 1)
})

// --- Person-filtered transactions ---
const personTransactions = computed(() => {
  if (selectedPerson.value === 'Ambos') return transactions.value
  return transactions.value.filter(t => t.person === selectedPerson.value)
})

const installmentTransactions = computed(() =>
  personTransactions.value.filter(t => isInstallmentTransaction(t))
)

// --- Category label from destination ---
const categoryOf = (destination: string): string => {
  const d = (destination || '').trim()
  if (!d || /installments\s*\/\s*financing/i.test(d)) return 'Parcelamento'
  return d
}

// Categorical palette — same color identifies a parcela in chart and list.
// Curated, harmonious, AA-friendly on white. When there are more active series
// than colors, fall back to evenly-spaced hues so every parcela stays distinct.
const PALETTE = [
  '#4F46E5', '#2563EB', '#0891B2', '#0D9488', '#059669', '#65A30D',
  '#CA8A04', '#EA580C', '#DB2777', '#9333EA', '#7C3AED', '#0369A1'
]
const colorFor = (index: number, count: number): string => {
  if (count <= PALETTE.length) return PALETTE[index]
  return `hsl(${Math.round((index / count) * 360)}, 60%, 45%)`
}

interface Series {
  key: string
  name: string
  category: string
  origin: string
  amount: number
  total: number
  paid: number
  remaining: number
  pctPaid: number
  toPay: number
  color: string
  startIdx: number
  firstMonth: string
  lastMonth: string
}

// Build raw series grouped by installment identity, relative to selectedMonth.
//
// Paid/remaining are derived by DATE ARITHMETIC from the installment number,
// not by counting how many distinct months the data carries. The source sheet
// often clusters every installment row on a single date (it isn't one row per
// month), so counting months wildly under-counts "paid" and keeps finished
// series looking active. Instead we anchor on the lowest-numbered installment
// (its number + month), back out the month installment #1 was due, then count
// elapsed months up to the reference month.
const rawSeries = computed<Series[]>(() => {
  const map = new Map<string, {
    key: string; name: string; category: string; origin: string; total: number
    rows: { cur: number; monthIdx: number; amount: number }[]
  }>()

  installmentTransactions.value.forEach(t => {
    const info = parseInstallment(t.description)
    if (!info) return
    const key = `${info.description}_${t.origin}_${info.total}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: info.description || t.description,
        category: categoryOf(t.destination),
        origin: t.origin,
        total: info.total,
        rows: []
      })
    }
    map.get(key)!.rows.push({
      cur: info.current,
      monthIdx: monthToIdx(t.date.substring(0, 7)),
      amount: Math.abs(t.amount)
    })
  })

  const refIdx = monthToIdx(selectedMonth.value)

  return Array.from(map.values()).map(s => {
    // Anchor on the lowest-numbered installment present and derive the month
    // installment #1 was due (startIdx). Its value is the monthly amount.
    const anchor = s.rows.reduce((a, b) => (b.cur < a.cur ? b : a))
    const startIdx = anchor.monthIdx - (anchor.cur - 1)
    const amount = anchor.amount

    // Elapsed installments before the reference month = paid; the reference
    // month's own installment still counts as "a vencer".
    const paid = Math.max(0, Math.min(refIdx - startIdx, s.total))
    const remaining = s.total - paid

    return {
      key: s.key,
      name: s.name,
      category: s.category,
      origin: s.origin,
      amount,
      total: s.total,
      paid,
      remaining,
      pctPaid: Math.round((paid / s.total) * 100),
      toPay: remaining * amount,
      color: '',
      startIdx,
      firstMonth: idxToKey(startIdx),
      lastMonth: idxToKey(startIdx + s.total - 1)
    }
  })
})

// Active series (still have payments left), with stable color assignment.
const activeSeries = computed<Series[]>(() => {
  const active = rawSeries.value.filter(s => s.remaining > 0)
  const ordered = [...active].sort((a, b) => (a.key < b.key ? -1 : 1))
  ordered.forEach((s, i) => { s.color = colorFor(i, ordered.length) })
  return active
})

// --- Reference month income (with fallback to a recent month) ---
const monthIncome = (monthKey: string): number => {
  return personTransactions.value
    .filter(t => t.date.substring(0, 7) === monthKey)
    .filter(t => (t.destination || '').toLowerCase().includes('bank account'))
    .filter(t => (t.destination || '').toLowerCase() !== 'adjustment')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

const referenceIncome = computed(() => {
  const direct = monthIncome(selectedMonth.value)
  if (direct > 0) return direct
  // Fall back to the most recent month with income within the last 6 months.
  for (let i = 1; i <= 6; i++) {
    const v = monthIncome(addMonths(selectedMonth.value, -i))
    if (v > 0) return v
  }
  return 0
})

// --- Derived metrics ---
// A series bills in a given month only if that month is within its schedule
// [startIdx, startIdx + total). committedThisMonth = projection[0].
const committedThisMonth = computed(() =>
  projection.value[0]?.total ?? 0
)

const committedPct = computed(() =>
  referenceIncome.value > 0 ? Math.round((committedThisMonth.value / referenceIncome.value) * 100) : 0
)

const healthyLimit = computed(() => referenceIncome.value * 0.3)
const overLimit = computed(() => referenceIncome.value > 0 && committedThisMonth.value > healthyLimit.value)

const limitLabel = computed(() => {
  if (healthyLimit.value <= 0) return ''
  return `limite saudável · ${formatCurrency(healthyLimit.value, { compact: true })} (30%)`
})

const totalDebt = computed(() =>
  activeSeries.value.reduce((sum, s) => sum + s.toPay, 0)
)

// 12-month projection from the reference month. A series contributes to the
// month at offset i only if that month falls within its schedule.
const projection = computed(() => {
  const refIdx = monthToIdx(selectedMonth.value)
  const months = []
  for (let i = 0; i < 12; i++) {
    const dueIdx = refIdx + i
    const key = idxToKey(dueIdx)
    const segments = activeSeries.value
      .filter(s => dueIdx >= s.startIdx && dueIdx < s.startIdx + s.total)
      .map(s => ({ key: s.key, name: s.name, color: s.color, value: s.amount }))
    const total = segments.reduce((sum, seg) => sum + seg.value, 0)
    months.push({
      key,
      label: shortMonth(key),
      total,
      isCurrent: i === 0,
      isFuture: i > 0,
      segments
    })
  }
  return months
})

const chartYMax = computed(() => {
  const maxBar = Math.max(0, ...projection.value.map(m => m.total))
  const ceiling = Math.max(maxBar, healthyLimit.value)
  return ceiling > 0 ? ceiling * 1.15 : 1
})

const legend = computed(() =>
  activeSeries.value.map(s => ({ key: s.key, name: s.name, color: s.color }))
)

// Término previsto = last month any active parcela still has a payment.
const endLabel = computed(() => {
  if (!activeSeries.value.length) return '—'
  const maxLastIdx = Math.max(...activeSeries.value.map(s => s.startIdx + s.total - 1))
  return monthYear(idxToKey(maxLastIdx))
})

// Próximo alívio = first future month where a parcela ends and frees up money.
// A series' last payment is at startIdx + total - 1; it frees the month after.
const nextRelief = computed(() => {
  if (!activeSeries.value.length) return null
  const refIdx = monthToIdx(selectedMonth.value)
  const frees = activeSeries.value.map(s => s.startIdx + s.total - refIdx) // offset where it frees up
  const candidates = frees.filter(o => o >= 1 && o <= 12)
  if (!candidates.length) return null
  const reliefOffset = Math.min(...candidates)
  const freed = activeSeries.value
    .filter(s => s.startIdx + s.total - refIdx === reliefOffset)
    .reduce((sum, s) => sum + s.amount, 0)
  return { monthKey: idxToKey(refIdx + reliefOffset), freed }
})

const nextReliefValue = computed(() =>
  nextRelief.value
    ? `${shortMonth(nextRelief.value.monthKey)} · −${formatCurrency(nextRelief.value.freed)}`
    : '—'
)

// Insight: how much frees up over the projection horizon.
const reliefInsight = computed(() => {
  if (!nextRelief.value) return null
  const refIdx = monthToIdx(selectedMonth.value)
  // Series whose last payment lands within the next 12 months.
  const endingWithin = activeSeries.value.filter(s => s.startIdx + s.total - 1 - refIdx <= 11)
  if (!endingWithin.length) return null
  const freedTotal = endingWithin.reduce((sum, s) => sum + s.amount, 0)
  const lastEndKey = idxToKey(Math.max(...endingWithin.map(s => s.startIdx + s.total - 1)))
  return {
    title: `A partir de ${shortMonth(nextRelief.value.monthKey)} sobra mais no bolso`,
    message: `${endingWithin.length} parcela(s) encerram até ${monthYear(lastEndKey)}, liberando ${formatCurrency(freedTotal)}/mês.`
  }
})

// --- Sorting ---
type SortKey = 'valor' | 'termina' | 'aPagar'
const sortBy = ref<SortKey>('valor')
const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'valor', label: 'Maior parcela' },
  { value: 'termina', label: 'Termina antes' },
  { value: 'aPagar', label: 'A pagar' }
]

const sortedSeries = computed(() => {
  const list = [...activeSeries.value]
  switch (sortBy.value) {
    case 'termina':
      return list.sort((a, b) => a.remaining - b.remaining)
    case 'aPagar':
      return list.sort((a, b) => b.toPay - a.toPay)
    case 'valor':
    default:
      return list.sort((a, b) => b.amount - a.amount)
  }
})

// --- Detail modal ---
const selectedParcela = ref<Series | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const openDetail = async (series: Series) => {
  selectedParcela.value = series
  await nextTick()
  closeBtn.value?.focus()
}
const closeDetail = () => { selectedParcela.value = null }

// --- Refresh ---
const refreshData = async () => {
  try {
    await refreshCache()
    await fetchCacheStatus()
  } catch (e) {
    console.error('Erro ao atualizar parcelas:', e)
  }
}
</script>
