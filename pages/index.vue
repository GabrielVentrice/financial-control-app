<template>
  <Sidemenu>
    <main class="min-h-screen max-w-app px-30 pt-26 pb-34 max-lg:px-5 flex flex-col gap-26">
      <!-- Controles do período. Ficam discretos de propósito: o número do hero é
           o que manda na tela. -->
      <div class="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          @click="togglePrivacy"
          :aria-pressed="isPrivate"
          class="px-2.5 py-1.5 rounded-control border border-[color:var(--border)] bg-surface-1 text-body-sm font-semibold text-ink hover:bg-surface-2 transition-colors duration-[120ms] ease-ease"
        >{{ isPrivate ? 'mostrar valores' : 'ocultar valores' }}</button>
        <MonthSelector v-model="selectedMonth" />
        <SyncButton />
      </div>

      <!-- Erro de sincronização: faixa acima do hero, nunca modal nem toast -->
      <div
        v-if="syncError"
        role="alert"
        class="px-4 py-3 rounded-control border border-[color:var(--border)] bg-warn-wash text-body text-ink"
      >
        Não foi possível sincronizar: {{ syncError }}.
        <button type="button" @click="syncNow()" class="font-semibold text-accent hover:text-pos-text">
          tentar novamente →
        </button>
      </div>

      <!-- Mês sem nada sincronizado: as parcelas projetadas não são gasto realizado -->
      <div
        v-else-if="isMonthEmpty"
        class="px-4 py-3 rounded-control border border-[color:var(--border)] bg-warn-wash text-body text-ink"
      >
        Nenhum lançamento sincronizado em {{ selectedMonthLong }}.
        <template v-if="projectedOnlyTotal > 0">
          Os {{ formatCurrency(projectedOnlyTotal) }} abaixo são parcelas projetadas, não gastos realizados.
        </template>
        <button type="button" @click="syncNow()" class="font-semibold text-accent hover:text-pos-text">
          sincronizar →
        </button>
      </div>

      <ErrorState v-if="error" :message="error" />

      <template v-else>
        <!-- ═══ HERO ═══ -->
        <section class="grid grid-cols-[1.35fr_1fr] max-xl:grid-cols-2 max-lg:grid-cols-1 gap-30 max-lg:gap-18 pb-26 border-b border-[color:var(--border)]">
          <!-- Saldo -->
          <div class="flex flex-col gap-[10px]">
            <p class="om-rise text-label uppercase text-text-3" :style="om(40, 520)">
              Saldo disponível hoje
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
              >{{ heroValue }}</span>

              <span
                v-if="!loading && balanceTrend"
                class="om-rise inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-[12.5px] font-bold"
                :class="balanceTrend.positive ? 'bg-accent-wash text-pos-text' : 'bg-neg-wash text-neg-text'"
                :style="om(320, 520)"
              >{{ balanceTrend.label }}</span>
            </div>

            <div class="om-rise flex flex-wrap gap-22 mt-1 text-body text-text-2" :style="om(240, 560)">
              <span>
                <b class="maskable font-semibold text-ink num">{{ formatCurrency(monthlyStats.income) }}</b> entradas
              </span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span>
                <b class="maskable font-semibold text-ink num">{{ formatCurrency(monthlyStats.expenses) }}</b> saídas
              </span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span class="num">{{ monthlyStats.transactionCount }} transações</span>
            </div>

            <!-- Consumo da receita -->
            <div class="mt-3 flex items-center gap-[10px] max-sm:flex-col max-sm:items-stretch">
              <div class="flex-1 h-2 rounded-full bg-rule overflow-hidden flex">
                <div
                  class="om-grow-x h-full rounded-full"
                  :style="{ width: `${spendBar.width}%`, background: spendBar.color, ...om(400, 760) }"
                ></div>
              </div>
              <span class="text-meta text-text-2 whitespace-nowrap">{{ spendBar.legend }}</span>
            </div>
          </div>

          <!-- Fatura + sinal -->
          <div class="flex flex-col gap-[14px] pl-30 border-l border-[color:var(--border)] max-lg:pl-0 max-lg:border-l-0 max-lg:pt-18 max-lg:border-t">
            <div class="om-rise flex flex-col gap-1.5" :style="om(300, 620)">
              <p class="text-label uppercase text-text-3">Fatura do cartão · {{ invoiceOwner }}</p>
              <div class="flex items-baseline justify-between gap-2.5">
                <span class="maskable font-display text-hero-2 text-ink num">
                  {{ formatCurrency(creditCardInvoice.total, { decimals: true }) }}
                </span>
                <NuxtLink
                  :to="{ path: '/transactions', query: { origin: invoiceCardOrigin } }"
                  class="text-body-sm font-semibold text-accent hover:text-pos-text whitespace-nowrap"
                >ver fatura →</NuxtLink>
              </div>
              <p class="text-body-sm text-text-2">
                {{ creditCardInvoice.count }}
                {{ creditCardInvoice.count === 1 ? 'lançamento' : 'lançamentos' }}
                · vence em {{ dueLabel }}
              </p>
            </div>

            <div class="h-px bg-[color:var(--border)]"></div>

            <div v-if="monthSignal" class="om-rise flex flex-col gap-2" :style="om(420, 620)">
              <p class="text-label uppercase text-text-3">Sinal do mês</p>
              <div class="flex items-start gap-[10px]">
                <span
                  class="w-[7px] h-[7px] mt-1.5 flex-none rounded-full"
                  :class="monthSignal.positive ? 'bg-accent' : 'bg-neg'"
                  aria-hidden="true"
                ></span>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[14.5px] font-semibold text-ink">{{ monthSignal.title }}</span>
                  <span class="maskable text-body-sm text-text-2 [text-wrap:pretty]">{{ monthSignal.detail }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ FLUXO DE CAIXA ═══ -->
        <DashboardCashFlowChart :series="cashFlow.series" :axis-top="cashFlow.axisTop" />

        <!-- ═══ BASE ═══ -->
        <section class="grid grid-cols-[0.85fr_1.15fr] max-lg:grid-cols-1 gap-30 max-lg:gap-26 pt-26 border-t border-[color:var(--border)]">
          <!-- Para onde foi -->
          <div class="flex flex-col gap-[14px]">
            <div class="om-rise flex items-baseline justify-between gap-3" :style="om(660, 560)">
              <h2 class="font-display text-section text-ink">Para onde foi</h2>
              <span class="text-meta text-text-3">
                {{ allCategories.length }} {{ allCategories.length === 1 ? 'categoria' : 'categorias' }}
              </span>
            </div>

            <p v-if="allCategories.length === 0" class="text-body text-text-3">
              Nenhum gasto neste mês.
            </p>

            <ul v-else class="flex flex-col">
              <li v-for="(cat, i) in displayedCategories" :key="cat.name">
                <NuxtLink
                  :to="{ path: '/transactions', query: { destination: cat.name } }"
                  class="om-rise flex flex-col gap-[7px] py-[11px] border-b border-rule hover:bg-surface-2 transition-colors duration-[120ms] ease-ease"
                  :style="om(700 + i * 45, 560)"
                >
                  <div class="flex items-baseline justify-between gap-2.5">
                    <span class="text-[14.5px] font-medium text-ink truncate">{{ cat.name }}</span>
                    <span class="flex items-baseline gap-2.5 flex-none">
                      <span class="text-micro text-text-4 num">{{ cat.count }}×</span>
                      <span class="maskable text-[14.5px] font-semibold text-ink num">
                        {{ formatCurrency(cat.total) }}
                      </span>
                    </span>
                  </div>
                  <div class="h-1 rounded-full bg-rule overflow-hidden">
                    <div
                      class="om-grow-x h-full rounded-full"
                      :style="{
                        width: `${(cat.total / maxCategoryTotal) * 100}%`,
                        background: inkScale(i),
                        ...om(780 + i * 45, 760)
                      }"
                    ></div>
                  </div>
                </NuxtLink>
              </li>

              <li v-if="collapsedCategories.count > 0" class="flex items-baseline justify-between gap-2.5 py-[11px] border-b border-rule">
                <span class="text-[14.5px] text-text-3">outras {{ collapsedCategories.count }}</span>
                <span class="maskable text-[14.5px] font-semibold text-text-3 num">
                  {{ formatCurrency(collapsedCategories.total) }}
                </span>
              </li>
            </ul>
          </div>

          <!-- Últimos lançamentos -->
          <div class="flex flex-col gap-[14px]">
            <div class="om-rise flex items-center justify-between gap-[16px] max-sm:flex-col max-sm:items-stretch" :style="om(740, 560)">
              <h2 class="font-display text-section text-ink whitespace-nowrap">Últimos lançamentos</h2>
              <input
                v-model="txQueryInput"
                type="search"
                aria-label="Buscar lançamentos"
                placeholder="buscar descrição ou valor…"
                class="flex-1 max-w-[260px] max-sm:max-w-none px-3 py-2 rounded-control bg-surface-2 border border-[color:var(--border)] text-body text-ink placeholder:text-text-4"
              />
            </div>

            <p v-if="displayedTransactions.length === 0" class="text-body text-text-3">
              {{ txQuery ? 'Nenhum lançamento encontrado.' : 'Nenhum lançamento neste mês.' }}
            </p>

            <ul v-else class="flex flex-col">
              <li
                v-for="(t, i) in displayedTransactions"
                :key="t.transactionId"
                class="om-rise flex items-center gap-[16px] py-[11px] pr-1 border-b border-rule hover:bg-surface-2 transition-colors duration-[120ms] ease-ease"
                :style="om(780 + i * 45, 560)"
              >
                <span class="w-[42px] flex-none text-micro font-semibold text-text-4 num">
                  {{ shortDate(t.date) }}
                </span>
                <span class="flex-1 min-w-0 flex flex-col gap-px">
                  <span class="text-item text-ink truncate">{{ t.description }}</span>
                  <span
                    class="text-micro"
                    :class="isUncategorized(t) ? 'text-warn' : 'text-text-3'"
                  >{{ categoryNameOf(t) }}</span>
                </span>
                <span class="maskable text-value text-neg-text num whitespace-nowrap">
                  − {{ formatCurrency(Math.abs(t.amount)) }}
                </span>
              </li>
            </ul>

            <NuxtLink
              v-if="monthExpenses.length > 0"
              to="/transactions"
              class="self-start text-body font-semibold text-accent hover:text-pos-text"
            >ver todos os {{ monthExpenses.length }} lançamentos →</NuxtLink>
          </div>
        </section>
      </template>
    </main>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { currentMonthKey, monthIndexOfKey, monthKeyOf } from '~/shared/dates'
import { categoryNameOf, UNCATEGORIZED } from '~/shared/expenseRules'
import { inkScale } from '~/shared/inkScale'
import type { Transaction } from '~/types/transaction'

const { transactions, loading, error } = useTransactions()
const { selectedPerson } = usePersonFilter()
const { syncError, syncNow } = useSync()
const { isPrivate, toggle: togglePrivacy } = usePrivacyMode()
const { om } = useEntryMotion()
const { formatCurrency, formatNumber, formatMonthName } = useFormatters()

const {
  getCurrentMonthStats,
  getAllCategories,
  getMonthExpenses,
  getCashFlow,
  getMonthSignal,
  getCreditCardInvoice,
} = useDashboardAnalytics()

const selectedMonth = ref(currentMonthKey())
const selectedMonthLong = computed(() => formatMonthName(monthIndexOfKey(selectedMonth.value)))

const filteredTransactions = computed(() =>
  selectedPerson.value === 'Ambos'
    ? transactions.value
    : transactions.value.filter(t => t.person === selectedPerson.value)
)

const monthlyStats = computed(() => getCurrentMonthStats(filteredTransactions.value, selectedMonth.value))
const allCategories = computed(() => getAllCategories(filteredTransactions.value, selectedMonth.value))
const monthExpenses = computed(() => getMonthExpenses(filteredTransactions.value, selectedMonth.value))
const cashFlow = computed(() => getCashFlow(filteredTransactions.value, selectedMonth.value))
const monthSignal = computed(() => getMonthSignal(filteredTransactions.value, selectedMonth.value))

// A month holding nothing but projected installments is an un-synced month, not
// a month where you spent that much.
const isMonthEmpty = computed(() =>
  filteredTransactions.value.filter(
    t => monthKeyOf(t.date) === selectedMonth.value && !t.projected
  ).length === 0
)
const projectedOnlyTotal = computed(() => (isMonthEmpty.value ? monthlyStats.value.expenses : 0))

/**
 * "R$ 1.163" — thin space after the currency so the serif doesn't crowd, and an
 * explicit minus U+2212 (not a hyphen) when the month closed in the red.
 */
const heroValue = computed(() => {
  const v = monthlyStats.value.balance
  const digits = formatNumber(Math.abs(v))
  return `${v < 0 ? '− ' : ''}R$ ${digits}`
})

/**
 * The chip reads as the user experiences it: a balance that fell is bad news,
 * regardless of the arithmetic sign of the delta.
 */
const balanceTrend = computed(() => {
  const pct = monthlyStats.value.trend.balance
  if (!isFinite(pct) || Math.round(Math.abs(pct) * 10) === 0) return null
  const up = pct > 0
  return {
    positive: up,
    label: `${up ? '▴' : '▾'} ${Math.abs(pct).toFixed(1).replace('.', ',')}%`,
  }
})

/** Below 70% of income spent is healthy, 70–90% deserves attention, above is red. */
const spendBar = computed(() => {
  const { income, expenses } = monthlyStats.value
  const pct = income > 0 ? (expenses / income) * 100 : 0
  const color =
    pct > 90 ? 'var(--neg-fill)' : pct >= 70 ? 'var(--warn)' : 'var(--accent)'

  return {
    width: Math.min(100, pct),
    color,
    legend: income > 0
      ? `${Math.round(pct)}% da receita já gasta`
      : 'sem receita registrada no mês',
  }
})

const invoiceCardOrigin = computed(() =>
  selectedPerson.value === 'Juliana' ? 'Credit Card Juliana' : 'Credit Card Gabriel'
)
const invoiceOwner = computed(() => (selectedPerson.value === 'Juliana' ? 'Juliana' : 'Gabriel'))
const creditCardInvoice = computed(() =>
  getCreditCardInvoice(transactions.value, { cardOrigin: invoiceCardOrigin.value })
)
const dueLabel = computed(() => formatMonthName(creditCardInvoice.value.dueMonth))

// --- Categorias: as 8 maiores, o resto colapsa ---
const TOP_CATEGORIES = 8
const maxCategoryTotal = computed(() => Math.max(1, ...allCategories.value.map(c => c.total)))
const displayedCategories = computed(() => allCategories.value.slice(0, TOP_CATEGORIES))
const collapsedCategories = computed(() => {
  const rest = allCategories.value.slice(TOP_CATEGORIES)
  return { count: rest.length, total: rest.reduce((sum, c) => sum + c.total, 0) }
})


// --- Lançamentos: busca com debounce de 200ms ---
const TOP_TRANSACTIONS = 8
const txQueryInput = ref('')
const txQuery = ref('')
let debounce: ReturnType<typeof setTimeout>

watch(txQueryInput, value => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { txQuery.value = value.trim().toLowerCase() }, 200)
})

const displayedTransactions = computed(() => {
  const q = txQuery.value
  const list = q
    ? monthExpenses.value.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        categoryNameOf(t).toLowerCase().includes(q) ||
        String(Math.abs(t.amount)).includes(q) ||
        formatCurrency(Math.abs(t.amount)).toLowerCase().includes(q)
      )
    : monthExpenses.value
  return list.slice(0, TOP_TRANSACTIONS)
})

// The one splash of colour in the list: an uncategorized row is a pending action.
const isUncategorized = (t: Transaction) => categoryNameOf(t) === UNCATEGORIZED

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
</script>
