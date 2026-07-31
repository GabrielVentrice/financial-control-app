<template>
  <Sidemenu>
    <main class="min-h-screen max-w-app px-30 pt-26 pb-34 max-lg:px-5 flex flex-col gap-26">
      <div class="flex flex-wrap items-center justify-end gap-3">
        <MonthSelector v-model="selectedMonth" />
        <SyncButton />
      </div>

      <ErrorState v-if="error" :message="error" />

      <EmptyState
        v-else-if="!loading && activeSeries.length === 0"
        icon="—"
        title="Nenhuma parcela ativa"
        description="Você não tem parcelas ou financiamentos em aberto neste mês."
      />

      <template v-else>
        <!-- ═══ HERO ═══ -->
        <section class="grid grid-cols-[1.35fr_1fr] max-xl:grid-cols-2 max-lg:grid-cols-1 gap-30 max-lg:gap-18 pb-26 border-b border-[color:var(--border)]">
          <div class="flex flex-col gap-[10px]">
            <p class="om-rise text-label uppercase text-text-3" :style="om(40, 520)">
              Comprometido em {{ selectedMonthLong }}
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
              >R$ {{ formatNumber(committedThisMonth) }}</span>

              <!-- Chip positivo: a cor segue o julgamento, não a direção. Comprometer
                   20% quando o teto é 30% é boa notícia. -->
              <span
                v-if="!loading && referenceIncome > 0"
                class="om-rise inline-flex items-center px-2.5 py-1 rounded-control text-[12.5px] font-bold"
                :class="overLimit ? 'bg-neg-wash text-neg-text' : 'bg-accent-wash text-pos-text'"
                :style="om(320, 520)"
              >{{ committedPct }}% da renda</span>
            </div>

            <div class="om-rise flex flex-wrap gap-22 mt-1 text-body text-text-2" :style="om(240, 560)">
              <span><b class="font-semibold text-ink num">{{ activeSeries.length }}</b> parcelas ativas</span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span>devendo <b class="maskable font-semibold text-ink num">{{ formatCurrency(totalDebt) }}</b></span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span>quita em <b class="font-semibold text-ink">{{ endLabel }}</b></span>
            </div>

            <!-- Barra de folga: escalada pelo teto, o vazio à direita é a informação -->
            <div class="mt-3">
              <CeilingBar
                v-if="referenceIncome > 0"
                :value="committedThisMonth"
                :ceiling="healthyLimit"
                :used-pct="committedPct"
                :delay="400"
              >
                <template #default>
                  a barra vai até o limite saudável de
                  <b class="font-semibold text-ink">30% da renda</b>
                  (<span class="maskable num">{{ formatCurrency(healthyLimit) }}</span>) —
                  você está usando {{ committedPct }}%
                </template>
              </CeilingBar>
              <p v-else class="text-meta text-text-3">renda do mês indisponível para calcular o limite</p>
            </div>
          </div>

          <!-- Próximo alívio + o que muda -->
          <div class="flex flex-col gap-[14px] pl-30 border-l border-[color:var(--border)] max-lg:pl-0 max-lg:border-l-0 max-lg:pt-18 max-lg:border-t">
            <div v-if="nextRelief" class="om-rise flex flex-col gap-1.5" :style="om(300, 620)">
              <p class="text-label uppercase text-text-3">Próximo alívio</p>
              <div class="flex items-baseline justify-between gap-2.5">
                <span class="maskable font-display text-hero-2 text-pos-text num">
                  − {{ formatCurrency(nextRelief.freed) }}
                </span>
                <span class="text-body-sm font-semibold text-text-2 whitespace-nowrap">
                  em {{ monthName(nextRelief.monthKey).toLowerCase() }}
                </span>
              </div>
              <p class="maskable text-body-sm text-text-2 [text-wrap:pretty]">
                {{ nextRelief.names }} encerra{{ nextRelief.count > 1 ? 'm' : '' }} —
                a mensalidade cai para {{ formatCurrency(nextRelief.after) }}
              </p>
            </div>

            <div class="h-px bg-[color:var(--border)]"></div>

            <div v-if="whatChanges.length" class="om-rise flex flex-col gap-3" :style="om(420, 620)">
              <p class="text-label uppercase text-text-3">O que muda daqui pra frente</p>
              <div v-for="item in whatChanges" :key="item.title" class="flex items-start gap-[10px]">
                <span
                  class="w-[7px] h-[7px] mt-1.5 flex-none rounded-full"
                  :class="item.tone === 'accent' ? 'bg-accent' : 'bg-ink'"
                  aria-hidden="true"
                ></span>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[14.5px] font-semibold text-ink">{{ item.title }}</span>
                  <span class="maskable text-body-sm text-text-2 [text-wrap:pretty]">{{ item.detail }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ PROJEÇÃO ═══ -->
        <InstallmentsProjectionChart :months="projection" :ceiling="healthyLimit" />

        <!-- ═══ TABELA ═══ -->
        <section class="flex flex-col gap-[14px]">
          <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(540, 560)">
            <div class="flex items-baseline gap-3">
              <h2 class="font-display text-section text-ink">Suas {{ activeSeries.length }} parcelas</h2>
              <span class="maskable text-meta text-text-3">
                {{ formatCurrency(totalDebt) }} a pagar até {{ endLabel }}
              </span>
            </div>
            <SortTabs v-model="sortBy" :options="sortOptions" aria-label="Ordenar parcelas" />
          </div>

          <div>
            <div
              class="grid grid-cols-[250px_1fr_108px_116px_116px_18px] max-xl:grid-cols-[190px_1fr_96px_104px_104px_18px] max-lg:hidden gap-18 items-center pb-2 pr-1 border-b border-rule-strong text-[10px] font-bold tracking-[0.14em] uppercase text-text-3"
            >
              <span>Compra</span>
              <span>Progresso</span>
              <span>Termina em</span>
              <span class="text-right">Por mês</span>
              <span class="text-right">Falta pagar</span>
              <span></span>
            </div>

            <div
              v-for="(s, i) in sortedSeries"
              :key="s.key"
              class="om-rise grid grid-cols-[250px_1fr_108px_116px_116px_18px] max-xl:grid-cols-[190px_1fr_96px_104px_104px_18px] max-lg:grid-cols-[1fr_auto] gap-18 max-lg:gap-2 items-center py-[11px] pr-1 border-b border-rule hover:bg-surface-2 transition-colors duration-[120ms] ease-ease"
              :style="om(620 + i * 40, 560)"
            >
              <!-- 1. Compra -->
              <div class="min-w-0">
                <p class="text-item text-ink truncate">{{ s.name }}</p>
                <p class="text-micro text-text-3 mt-0.5 truncate">{{ s.category }}</p>
              </div>

              <!-- 2. Progresso: mesma cor em todas — é fração, não magnitude -->
              <div class="max-lg:hidden">
                <div class="h-1.5 rounded-full bg-rule overflow-hidden">
                  <div
                    class="om-grow-x h-full rounded-full bg-ink-2"
                    :style="{ width: `${s.pctPaid}%`, ...om(680 + i * 40, 760) }"
                  ></div>
                </div>
                <p class="text-micro text-text-3 mt-1">{{ s.paid }} de {{ s.total }} pagas</p>
              </div>

              <!-- 3. Termina em -->
              <div class="max-lg:hidden">
                <p
                  class="text-body-sm font-semibold"
                  :class="s.remaining <= 2 ? 'text-pos-text' : 'text-ink'"
                >{{ monthYear(s.lastMonth) }}</p>
                <p class="text-[11.5px] text-text-4">
                  {{ s.remaining === 1 ? 'última parcela' : `${s.remaining} restantes` }}
                </p>
              </div>

              <!-- 4. Por mês -->
              <span class="maskable text-value text-ink num text-right whitespace-nowrap">
                {{ formatCurrency(s.amount) }}/mês
              </span>

              <!-- 5. Falta pagar -->
              <span class="maskable text-body-sm text-text-2 num text-right whitespace-nowrap max-lg:hidden">
                faltam {{ formatCurrency(s.toPay) }}
              </span>

              <span class="text-body-sm text-text-4 max-lg:hidden" aria-hidden="true">›</span>
            </div>
          </div>
        </section>
      </template>
    </main>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  monthKeyOf,
  currentMonthKey,
  addMonthsToKey,
  monthKeyToIdx,
  idxToMonthKey,
  monthIndexOfKey,
} from '~/shared/dates'
import { isIncome, isExcludedCategory } from '~/shared/expenseRules'

// The server already expands installments into their monthly schedule.
const { transactions, loading, error } = useTransactions()
const { selectedPerson } = usePersonFilter()
const { parseInstallment, isInstallmentTransaction } = useInstallments()
const { formatCurrency, formatNumber, formatMonthName } = useFormatters()
const { om } = useEntryMotion()

const selectedMonth = ref(currentMonthKey())
const selectedMonthLong = computed(() => formatMonthName(monthIndexOfKey(selectedMonth.value)))
const monthName = (key: string) => formatMonthName(monthIndexOfKey(key))
const monthYear = (key: string) =>
  key ? `${formatMonthName(monthIndexOfKey(key), true).toLowerCase()}/${key.split('-')[0]}` : '—'

const personTransactions = computed(() =>
  selectedPerson.value === 'Ambos'
    ? transactions.value
    : transactions.value.filter(t => t.person === selectedPerson.value)
)

const installmentTransactions = computed(() =>
  personTransactions.value.filter(t => isInstallmentTransaction(t))
)

const categoryOf = (destination: string): string => {
  const d = (destination || '').trim()
  if (!d || /installments\s*\/\s*financing/i.test(d)) return 'Parcelamento'
  return d
}

interface Series {
  key: string
  name: string
  category: string
  amount: number
  total: number
  paid: number
  remaining: number
  pctPaid: number
  toPay: number
  startIdx: number
  lastMonth: string
}

/**
 * paid/remaining come from DATE ARITHMETIC on the installment number, never from
 * counting how many months the data carries — the sheet often clusters every
 * installment row on one date, which would make finished series look active.
 */
const rawSeries = computed<Series[]>(() => {
  const map = new Map<string, {
    key: string; name: string; category: string; total: number
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
        total: info.total,
        rows: [],
      })
    }
    map.get(key)!.rows.push({
      cur: info.current,
      monthIdx: monthKeyToIdx(monthKeyOf(t.date)),
      amount: Math.abs(t.amount),
    })
  })

  const refIdx = monthKeyToIdx(selectedMonth.value)

  return Array.from(map.values()).map(s => {
    const anchor = s.rows.reduce((a, b) => (b.cur < a.cur ? b : a))
    const startIdx = anchor.monthIdx - (anchor.cur - 1)
    const amount = anchor.amount
    const paid = Math.max(0, Math.min(refIdx - startIdx, s.total))
    const remaining = s.total - paid

    return {
      key: s.key,
      name: s.name,
      category: s.category,
      amount,
      total: s.total,
      paid,
      remaining,
      pctPaid: Math.round((paid / s.total) * 100),
      toPay: remaining * amount,
      startIdx,
      lastMonth: idxToMonthKey(startIdx + s.total - 1),
    }
  })
})

const activeSeries = computed(() => rawSeries.value.filter(s => s.remaining > 0))

// --- Renda de referência e limite ---
const monthIncome = (monthKey: string): number =>
  personTransactions.value
    .filter(t => monthKeyOf(t.date) === monthKey)
    .filter(t => isIncome(t) && !isExcludedCategory(t))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

const referenceIncome = computed(() => {
  const direct = monthIncome(selectedMonth.value)
  if (direct > 0) return direct
  for (let i = 1; i <= 6; i++) {
    const v = monthIncome(addMonthsToKey(selectedMonth.value, -i))
    if (v > 0) return v
  }
  return 0
})

const healthyLimit = computed(() => referenceIncome.value * 0.3)

// --- Projeção: uma barra por mês, valor único ---
const projection = computed(() => {
  const refIdx = monthKeyToIdx(selectedMonth.value)
  return Array.from({ length: 12 }, (_, i) => {
    const dueIdx = refIdx + i
    const key = idxToMonthKey(dueIdx)
    const value = activeSeries.value
      .filter(s => dueIdx >= s.startIdx && dueIdx < s.startIdx + s.total)
      .reduce((sum, s) => sum + s.amount, 0)
    return { key, label: formatMonthName(monthIndexOfKey(key), true), value }
  })
})

const committedThisMonth = computed(() => projection.value[0]?.value ?? 0)
const committedPct = computed(() =>
  referenceIncome.value > 0 ? Math.round((committedThisMonth.value / referenceIncome.value) * 100) : 0
)
const overLimit = computed(() => referenceIncome.value > 0 && committedThisMonth.value > healthyLimit.value)
const totalDebt = computed(() => activeSeries.value.reduce((sum, s) => sum + s.toPay, 0))

const endLabel = computed(() => {
  if (!activeSeries.value.length) return '—'
  return monthYear(idxToMonthKey(Math.max(...activeSeries.value.map(s => s.startIdx + s.total - 1))))
})

/** First month a series ends and frees money up. */
const nextRelief = computed(() => {
  if (!activeSeries.value.length) return null
  const refIdx = monthKeyToIdx(selectedMonth.value)
  const offsets = activeSeries.value.map(s => s.startIdx + s.total - refIdx).filter(o => o >= 1 && o <= 12)
  if (!offsets.length) return null

  const reliefOffset = Math.min(...offsets)
  const ending = activeSeries.value.filter(s => s.startIdx + s.total - refIdx === reliefOffset)
  const freed = ending.reduce((sum, s) => sum + s.amount, 0)

  return {
    monthKey: idxToMonthKey(refIdx + reliefOffset),
    freed,
    count: ending.length,
    names: ending.map(s => s.name).join(', '),
    after: committedThisMonth.value - freed,
  }
})

/** Two conclusions: when the monthly cost drops, and how concentrated it is. */
const whatChanges = computed(() => {
  const items: { tone: 'accent' | 'ink'; title: string; detail: string }[] = []
  if (!activeSeries.value.length) return items

  // The month the monthly cost PLUNGES: the biggest step down from the month
  // before, measured relatively.
  //
  // Two things this deliberately does not do. It doesn't use the cumulative drop
  // from today, which always elects the month everything reaches zero. And it
  // ignores the tail where almost nothing is left — "em maio você não deve mais
  // nada" is the trivial endpoint of any amortisation. The useful signal is the
  // last big step while there is still a commitment to talk about, so months
  // landing under a tenth of today's value are out of the running.
  const floor = committedThisMonth.value * 0.1
  const plunge = projection.value
    .map((m, i) => ({
      ...m,
      i,
      fall: i > 0 && projection.value[i - 1].value > 0
        ? (projection.value[i - 1].value - m.value) / projection.value[i - 1].value
        : 0,
    }))
    .filter(m => m.i > 0 && m.fall > 0.2 && m.value >= floor)
    .sort((a, b) => b.fall - a.fall)[0]

  if (plunge) {
    const plungeIdx = monthKeyToIdx(plunge.key)
    const ending = activeSeries.value.filter(s => s.startIdx + s.total <= plungeIdx).length
    const previousKey = projection.value[plunge.i - 1].key
    items.push({
      tone: 'accent',
      title: `Em ${monthName(plunge.key).toLowerCase()} sobra ${formatCurrency(committedThisMonth.value - plunge.value)} por mês`,
      detail: `${ending} parcela${ending === 1 ? '' : 's'} encerra${ending === 1 ? '' : 'm'} até ${monthName(previousKey).toLowerCase()} e o comprometimento cai de ${formatCurrency(committedThisMonth.value)} para ${formatCurrency(plunge.value)}.`,
    })
  }

  const topTwo = [...activeSeries.value].sort((a, b) => b.amount - a.amount).slice(0, 2)
  if (topTwo.length === 2 && committedThisMonth.value > 0) {
    const sum = topTwo.reduce((s, x) => s + x.amount, 0)
    const pct = Math.round((sum / committedThisMonth.value) * 100)
    if (pct >= 30) {
      items.push({
        tone: 'ink',
        title: `Duas compras respondem por ${pct}%`,
        detail: `${topTwo.map(s => s.name).join(' e ')} somam ${formatCurrency(sum)} dos ${formatCurrency(committedThisMonth.value)} do mês.`,
      })
    }
  }

  return items.slice(0, 2)
})

// --- Ordenação ---
const sortBy = ref('valor')
const sortOptions = [
  { value: 'valor', label: 'maior parcela' },
  { value: 'termina', label: 'termina antes' },
  { value: 'falta', label: 'falta mais' },
]

const sortedSeries = computed(() => {
  const list = [...activeSeries.value]
  switch (sortBy.value) {
    case 'termina':
      return list.sort((a, b) => a.remaining - b.remaining || b.amount - a.amount)
    case 'falta':
      return list.sort((a, b) => b.toPay - a.toPay)
    default:
      return list.sort((a, b) => b.amount - a.amount)
  }
})
</script>
