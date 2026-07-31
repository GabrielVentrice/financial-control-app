<template>
  <Sidemenu>
    <main class="min-h-screen max-w-app px-30 pt-26 pb-34 max-lg:px-5 flex flex-col gap-26">
      <div class="flex flex-wrap items-center justify-end gap-3">
        <MonthSelector v-model="selectedMonth" />
        <SyncButton />
      </div>

      <ErrorState v-if="error" :message="error" />

      <template v-else>
        <!-- ═══ HERO ═══ -->
        <section class="grid grid-cols-[1.35fr_1fr] max-xl:grid-cols-2 max-lg:grid-cols-1 gap-30 max-lg:gap-18 pb-26 border-b border-[color:var(--border)]">
          <!-- Total do mês -->
          <div class="flex flex-col gap-[10px]">
            <p class="om-rise text-label uppercase text-text-3" :style="om(40, 520)">
              Total gasto em {{ selectedMonthLong }}
            </p>

            <div class="flex items-baseline gap-[14px] flex-wrap">
              <span
                v-if="loading"
                class="block w-[300px] h-[74px] rounded-control bg-rule"
                aria-hidden="true"
              ></span>
              <span
                v-else
                class="om-rise maskable font-display text-hero max-xl:text-[64px] max-lg:text-[52px] text-ink num"
                :style="om(90, 760)"
              >R$ {{ formatNumber(total) }}</span>

              <span
                v-if="!loading && totalDelta.kind !== 'flat'"
                class="om-rise inline-flex items-center px-2.5 py-1 rounded-control text-[12.5px] font-bold"
                :class="totalDelta.kind === 'new'
                  ? 'bg-warn-wash text-warn'
                  : totalDelta.cls === 'text-neg-text' ? 'bg-neg-wash text-neg-text' : 'bg-accent-wash text-pos-text'"
                :style="om(320, 520)"
              >{{ totalDelta.label }}</span>
            </div>

            <div class="om-rise flex flex-wrap gap-22 mt-1 text-body text-text-2" :style="om(240, 560)">
              <span><b class="font-semibold text-ink num">{{ totalTransactions }}</b> transações</span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span><b class="font-semibold text-ink num">{{ categories.length }}</b> categorias</span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span class="maskable num">{{ formatCurrency(perDay) }} por dia</span>
            </div>

            <!-- Composição: substitui o donut -->
            <div class="mt-3">
              <CompositionBar v-if="categories.length" :segments="compositionSegments" :delay="400" />
            </div>
          </div>

          <!-- Maior categoria + requer atenção -->
          <div class="flex flex-col gap-[14px] pl-30 border-l border-[color:var(--border)] max-lg:pl-0 max-lg:border-l-0 max-lg:pt-18 max-lg:border-t">
            <div v-if="biggest" class="om-rise flex flex-col gap-1.5" :style="om(300, 620)">
              <p class="text-label uppercase text-text-3">Maior categoria</p>
              <div class="flex items-baseline justify-between gap-2.5">
                <span class="maskable font-display text-hero-2 text-ink num">
                  {{ formatCurrency(biggest.current) }}
                </span>
                <NuxtLink
                  :to="{ path: '/transactions', query: { destination: biggest.name } }"
                  class="text-body-sm font-semibold text-accent hover:text-pos-text whitespace-nowrap"
                >ver transações →</NuxtLink>
              </div>
              <p class="text-body-sm text-text-2">
                {{ biggest.name }} · {{ sharePct(biggest.current) }}% do mês ·
                {{ biggest.count }} {{ biggest.count === 1 ? 'lançamento' : 'lançamentos' }}
              </p>
            </div>

            <div class="h-px bg-[color:var(--border)]"></div>

            <div v-if="attention.length" class="om-rise flex flex-col gap-3" :style="om(420, 620)">
              <p class="text-label uppercase text-text-3">Requer atenção</p>
              <div v-for="item in attention" :key="item.title" class="flex items-start gap-[10px]">
                <span
                  class="w-[7px] h-[7px] mt-1.5 flex-none rounded-full"
                  :class="item.tone === 'neg' ? 'bg-neg' : 'bg-warn'"
                  aria-hidden="true"
                ></span>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[14.5px] font-semibold text-ink">{{ item.title }}</span>
                  <span class="maskable text-body-sm text-text-2 [text-wrap:pretty]">
                    {{ item.detail }}
                    <NuxtLink
                      v-if="item.action"
                      :to="item.action.to"
                      class="font-semibold text-accent hover:text-pos-text whitespace-nowrap"
                    >{{ item.action.label }} →</NuxtLink>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ TABELA ═══ -->
        <section class="flex flex-col gap-[14px]">
          <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(520, 560)">
            <div class="flex items-baseline gap-3">
              <h2 class="font-display text-section text-ink">Todas as categorias</h2>
              <span class="text-meta text-text-3">
                {{ selectedMonthLong.toLowerCase() }} {{ selectedMonth.split('-')[0] }} · comparado com {{ previousMonthLong.toLowerCase() }}
              </span>
            </div>
            <SortTabs v-model="sortBy" :options="sortOptions" aria-label="Ordenar categorias" />
          </div>

          <EmptyState
            v-if="categories.length === 0"
            icon="—"
            title="Nenhum gasto neste mês"
            description="Não há gastos registrados no período selecionado."
          />

          <div v-else>
            <!-- Cabeçalho -->
            <div
              class="grid grid-cols-[260px_1fr_54px_108px_132px_18px] max-xl:grid-cols-[200px_1fr_48px_96px_120px_18px] max-lg:hidden gap-18 items-center pb-2 pr-1 border-b border-rule-strong text-[10px] font-bold tracking-[0.14em] uppercase text-text-3"
            >
              <span>Categoria</span>
              <span>Participação no mês</span>
              <span class="text-right">%</span>
              <span class="text-right">Gasto</span>
              <span class="text-right">vs. {{ previousMonthLong.toLowerCase() }}</span>
              <span></span>
            </div>

            <!-- Linhas -->
            <NuxtLink
              v-for="(cat, i) in sortedCategories"
              :key="cat.key"
              :to="{ path: '/transactions', query: { destination: cat.name } }"
              class="om-rise grid grid-cols-[260px_1fr_54px_108px_132px_18px] max-xl:grid-cols-[200px_1fr_48px_96px_120px_18px] max-lg:grid-cols-[1fr_auto] gap-18 max-lg:gap-2 items-center py-[11px] pr-1 border-b border-rule hover:bg-surface-2 transition-colors duration-[120ms] ease-ease"
              :style="om(600 + i * 38, 560)"
            >
              <!-- 1. Categoria -->
              <div class="min-w-0">
                <p
                  class="text-[14.5px] font-medium truncate"
                  :class="cat.isUncategorized ? 'text-warn' : 'text-ink'"
                >{{ cat.name }}</p>
                <p class="text-micro text-text-3 mt-0.5">
                  {{ cat.count }} {{ cat.count === 1 ? 'transação' : 'transações' }} ·
                  <span class="maskable">média {{ formatCurrency(cat.current / cat.count) }}</span>
                </p>
              </div>

              <!-- 2. Barra de participação -->
              <div class="h-1.5 rounded-full bg-rule overflow-hidden max-lg:hidden">
                <div
                  class="om-grow-x h-full rounded-full"
                  :style="{
                    width: `${(cat.current / maxCurrent) * 100}%`,
                    background: cat.color,
                    ...om(660 + i * 38, 760)
                  }"
                ></div>
              </div>

              <!-- 3. % -->
              <span class="text-body-sm text-text-2 num text-right max-lg:hidden">{{ sharePct(cat.current) }}%</span>

              <!-- 4. Gasto -->
              <span class="maskable text-value text-ink num text-right whitespace-nowrap">
                {{ formatCurrency(cat.current) }}
              </span>

              <!-- 5. Variação -->
              <div class="text-right max-lg:hidden">
                <p class="text-body-sm num" :class="[cat.delta.cls, cat.delta.kind === 'up' || cat.delta.kind === 'down' ? 'font-bold' : '']">
                  {{ cat.delta.label }}
                </p>
                <p class="maskable text-[11.5px] text-text-4 num whitespace-nowrap">
                  {{ cat.previous > 0
                    ? `${previousMonthLong.toLowerCase()} ${formatCurrency(cat.previous)}`
                    : `não existia em ${previousMonthLong.toLowerCase()}` }}
                </p>
              </div>

              <span class="text-body-sm text-text-4 max-lg:hidden" aria-hidden="true">›</span>
            </NuxtLink>
          </div>
        </section>
      </template>
    </main>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Transaction } from '~/types/transaction'
import { monthKeyOf, currentMonthKey, addMonthsToKey, monthIndexOfKey, daysInMonthKey } from '~/shared/dates'
import { isRealExpense, categoryNameOf, expenseAmount, UNCATEGORIZED } from '~/shared/expenseRules'
import { inkScale } from '~/shared/inkScale'
import { computeDelta } from '~/shared/delta'

const { transactions, loading, error } = useTransactions()
const { selectedPerson } = usePersonFilter()
const { formatCurrency, formatNumber, formatMonthName } = useFormatters()
const { om } = useEntryMotion()

const selectedMonth = ref(currentMonthKey())
const previousMonth = computed(() => addMonthsToKey(selectedMonth.value, -1))
const selectedMonthLong = computed(() => formatMonthName(monthIndexOfKey(selectedMonth.value)))
const previousMonthLong = computed(() => formatMonthName(monthIndexOfKey(previousMonth.value)))

const personTransactions = computed(() =>
  selectedPerson.value === 'Ambos'
    ? transactions.value
    : transactions.value.filter(t => t.person === selectedPerson.value)
)

const aggregateMonth = (monthKey: string) => {
  const map = new Map<string, { total: number; count: number }>()
  personTransactions.value
    .filter(t => monthKeyOf(t.date) === monthKey && isRealExpense(t))
    .forEach((t: Transaction) => {
      const name = categoryNameOf(t)
      const e = map.get(name) || { total: 0, count: 0 }
      e.total += expenseAmount(t)
      e.count += 1
      map.set(name, e)
    })
  return map
}

interface Category {
  key: string
  name: string
  isUncategorized: boolean
  color: string
  current: number
  previous: number
  count: number
  delta: ReturnType<typeof computeDelta>
}

/**
 * One model per category, ranked by value.
 *
 * Colour comes from the VALUE rank, never from the displayed order — switching
 * the sort must not repaint the table, or the colours stop meaning "size".
 */
const categories = computed<Category[]>(() => {
  const cur = aggregateMonth(selectedMonth.value)
  const prev = aggregateMonth(previousMonth.value)

  return Array.from(cur.entries())
    .map(([name, data]) => ({ name, ...data, previous: prev.get(name)?.total || 0 }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((c, rank) => {
      const isUncategorized = c.name === UNCATEGORIZED
      return {
        key: c.name,
        name: c.name,
        isUncategorized,
        // "Sem categoria" keeps the warn tone: it is a pending action, the one
        // place colour carries meaning on this screen.
        color: isUncategorized ? 'var(--warn)' : inkScale(rank),
        current: c.total,
        previous: c.previous,
        count: c.count,
        delta: computeDelta(c.total, c.previous, 'expense'),
      }
    })
})

const total = computed(() => categories.value.reduce((s, c) => s + c.current, 0))
const previousTotal = computed(() => categories.value.reduce((s, c) => s + c.previous, 0))
const totalTransactions = computed(() => categories.value.reduce((s, c) => s + c.count, 0))
const totalDelta = computed(() => computeDelta(total.value, previousTotal.value, 'expense'))
const maxCurrent = computed(() => Math.max(1, ...categories.value.map(c => c.current)))
const biggest = computed(() => categories.value[0] || null)

const sharePct = (v: number) => (total.value > 0 ? Math.round((v / total.value) * 100) : 0)

/** Spend per elapsed day: the month so far if it is still running. */
const perDay = computed(() => {
  const now = new Date()
  const days = selectedMonth.value === currentMonthKey(now)
    ? now.getDate()
    : daysInMonthKey(selectedMonth.value)
  return days > 0 ? total.value / days : 0
})

const compositionSegments = computed(() =>
  categories.value.map(c => ({
    key: c.key,
    name: c.name,
    share: total.value > 0 ? (c.current / total.value) * 100 : 0,
    color: c.color,
  }))
)

/**
 * At most two conclusions, derived from the data: the biggest absolute rise and
 * the classification backlog. Never a list of insights, never a coloured box.
 */
const attention = computed(() => {
  const items: { tone: 'neg' | 'warn'; title: string; detail: string; action?: { label: string; to: any } }[] = []

  const topRise = categories.value
    .filter(c => c.previous > 0 && c.current > c.previous)
    .sort((a, b) => b.delta.absolute - a.delta.absolute)[0]

  if (topRise) {
    const pct = Math.round((topRise.delta.absolute / topRise.previous) * 100)
    if (pct >= 30) {
      items.push({
        tone: 'neg',
        title: `${topRise.name} subiu ${pct}%`,
        detail: `De ${formatCurrency(topRise.previous)} para ${formatCurrency(topRise.current)} — sozinha responde por ${formatCurrency(topRise.delta.absolute)} da alta do mês.`,
      })
    }
  }

  const uncategorized = categories.value.find(c => c.isUncategorized)
  if (uncategorized) {
    items.push({
      tone: 'warn',
      title: `${uncategorized.count} ${uncategorized.count === 1 ? 'lançamento' : 'lançamentos'} sem categoria`,
      detail: `${formatCurrency(uncategorized.current)} ainda não classificados — ${sharePct(uncategorized.current)}% do mês.`,
      action: { label: 'classificar agora', to: { path: '/transactions', query: { destination: UNCATEGORIZED } } },
    })
  }

  return items.slice(0, 2)
})

// --- Ordenação ---
const sortBy = ref('valor')
const sortOptions = [
  { value: 'valor', label: 'maior gasto' },
  { value: 'alta', label: 'maior alta' },
]

const sortedCategories = computed(() => {
  const list = [...categories.value]
  // "Maior alta" sorts by absolute change in reais, not percentage — otherwise a
  // R$ 25 category that doubled leads the table.
  if (sortBy.value === 'alta') return list.sort((a, b) => b.delta.absolute - a.delta.absolute)
  return list.sort((a, b) => b.current - a.current)
})
</script>
