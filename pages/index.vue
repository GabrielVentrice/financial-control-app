<template>
  <Sidemenu>
    <main class="min-h-screen max-w-app px-30 pt-26 pb-34 max-lg:px-5 flex flex-col gap-26">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector v-model="monthKey" />
        <SyncButton />
      </div>

      <ErrorState v-if="error" :message="error" />

      <template v-else-if="snapshot">
        <!-- ═══ HERO — a única pergunta que importa ao abrir o app ═══ -->
        <section
          class="grid grid-cols-[1.15fr_1fr] max-xl:grid-cols-2 max-lg:grid-cols-1 gap-30 max-lg:gap-18 pb-26 border-b border-[color:var(--border)]"
        >
          <div class="flex flex-col">
            <p class="om-rise text-label uppercase text-text-3" :style="om(40, 520)">
              {{ pace.isCurrent ? 'Disponível para o resto do mês' : 'Sobrou no mês' }}
            </p>

            <div class="flex items-baseline gap-[18px] flex-wrap mt-1.5">
              <span v-if="loading" class="block w-[300px] h-[74px] rounded-control bg-rule" aria-hidden="true"></span>
              <span
                v-else
                class="om-rise maskable font-display text-hero max-xl:text-[64px] max-lg:text-[52px] num"
                :class="totals.available < 0 ? 'text-neg-text' : 'text-ink'"
                :style="om(90, 760)"
              >{{ formatCurrency(totals.available) }}</span>

              <MonthStatusChip
                v-if="paceVerdict"
                :tone="paceVerdict.tone"
                dot
                class="om-rise"
                :style="om(200, 520)"
              >
                <span class="maskable num">{{ formatCurrency(paceVerdict.amount) }}</span>
                {{ paceVerdict.label }}
              </MonthStatusChip>
            </div>

            <!-- O número grande traduzido para as duas decisões que ele permite. -->
            <div
              v-if="showsDaily || totals.budgeted > 0"
              class="om-rise grid grid-cols-2 gap-[24px] max-w-[460px] mt-22"
              :style="om(240, 560)"
            >
              <div v-if="showsDaily" class="flex flex-col gap-0.5">
                <p class="maskable num font-display text-hero-3 text-ink">
                  {{ formatCurrency(totals.dailyAllowance) }}
                </p>
                <p class="text-body-sm text-text-3">
                  por dia, pelos próximos
                  <b class="font-semibold text-ink num">{{ pace.daysLeft }}</b>
                  {{ pace.daysLeft === 1 ? 'dia' : 'dias' }}
                </p>
              </div>

              <div v-if="totals.budgeted > 0" class="flex flex-col gap-0.5">
                <p
                  class="maskable num font-display text-hero-3"
                  :class="totals.budgetRemaining < 0 ? 'text-neg-text' : 'text-ink'"
                >{{ formatCurrency(Math.abs(totals.budgetRemaining)) }}</p>
                <p class="text-body-sm text-text-3">
                  {{ totals.budgetRemaining < 0 ? 'além dos' : 'de folga sobre' }}
                  <span class="maskable num">{{ formatCurrency(totals.budgeted) }}</span> orçados
                </p>
              </div>
            </div>

            <!-- Quanto da renda já foi, contra quanto do mês já foi. -->
            <div v-if="totals.income > 0" class="om-rise max-w-[460px] mt-22" :style="om(320, 560)">
              <MonthPaceBar
                :used="totals.spent + totals.committed"
                :income="totals.income"
                :pace="pace"
                :over-pace="!signal.onPace"
                :delay="380"
              />
            </div>
          </div>

          <!-- Coluna direita: o número grande escrito como a conta que ele é. -->
          <div class="pl-34 max-lg:pl-0 border-l max-lg:border-l-0 border-[color:var(--border)]">
            <MonthCashEquation :totals="totals" :count="realizedCount" :delay="300" />
          </div>
        </section>

        <!-- ═══ CATEGORIAS ═══ -->
        <section class="flex flex-col gap-18">
          <div class="om-rise flex flex-wrap items-baseline justify-between gap-x-18 gap-y-2" :style="om(440, 560)">
            <h2 class="font-display text-section text-ink">Onde o mês está indo</h2>

            <div class="flex flex-wrap gap-x-18 gap-y-1 text-body-sm text-text-3">
              <span v-for="item in legend" :key="item.key">
                <span
                  class="inline-block w-[9px] h-[9px] rounded-bar mr-1.5"
                  :style="{ background: item.swatch }"
                  aria-hidden="true"
                ></span>{{ item.text }}
                <b v-if="item.amount" class="maskable num font-semibold" :style="{ color: item.amountColor }">{{ item.amount }}</b>
                {{ item.suffix }}
              </span>
            </div>
          </div>

          <p v-if="saveError" role="alert" class="text-body-sm text-neg-text">{{ saveError }}</p>

          <EmptyState
            v-if="!snapshot.lines.length"
            title="Nenhum gasto neste mês"
            description="Sincronize o livro ou escolha outro mês."
          />

          <div v-else class="flex flex-col gap-26">
            <MonthCategoryGroup
              v-for="(group, i) in groups"
              :key="group.key"
              :group="group"
              :delay="500 + i * 60"
              :busy="saving"
              @save="saveTarget"
            />
          </div>
        </section>

        <MonthPlanStrip :plan="snapshot.plan" />
      </template>
    </main>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { currentMonthKey } from '~/shared/dates'
import { groupBudgetLines } from '~/shared/monthBudget'

/**
 * "Meu Mês" — a tela principal.
 *
 * Responde, nesta ordem: quanto ainda posso gastar, como esse número se forma,
 * onde o mês está indo, e estou no trilho do plano de mudança. O número grande é
 * de CAIXA (renda menos o que saiu menos o que ainda vai cair), não de
 * orçamento — orçamento é um acordo, caixa é o que existe, e quando os dois
 * discordam quem manda é o caixa.
 *
 * Nada é medido aqui: /api/month devolve o mês inteiro medido, e salvar uma meta
 * devolve o mês recomputado. A tela e o servidor não têm como discordar sobre um
 * total. O agrupamento das categorias é ordenação, não medição — vive em
 * shared/monthBudget.ts, puro e testado, e não em um computed nesta página.
 */
useHead({ title: 'Meu Mês — Controle Financeiro' })

const monthKey = ref(currentMonthKey())
const { snapshot, loading, error, saving, saveError, saveTarget } = useMonthPlan(monthKey)

const { formatCurrency } = useFormatters()
const { om } = useEntryMotion()

const EMPTY_TOTALS = {
  income: 0, spent: 0, committed: 0, available: 0,
  budgeted: 0, budgetRemaining: 0, dailyAllowance: 0,
}

const totals = computed(() => snapshot.value?.totals ?? EMPTY_TOTALS)
const pace = computed(
  () => snapshot.value?.pace ?? { monthKey: monthKey.value, daysInMonth: 30, daysElapsed: 0, daysLeft: 0, ratio: 0, isCurrent: false }
)
const signal = computed(
  () => snapshot.value?.signal ?? { spent: 0, budgeted: 0, expected: 0, excess: 0, onPace: true }
)

/** A closed month has no "por dia" left to allow. */
const showsDaily = computed(() => pace.value.isCurrent && pace.value.daysLeft > 0)

const groups = computed(() => groupBudgetLines(snapshot.value?.lines ?? []))
const realizedCount = computed(() => snapshot.value?.lines.reduce((n, l) => n + l.count, 0) ?? 0)

/**
 * The verdict next to the headline.
 *
 * The same comparison reads differently depending on the month: while it is
 * running, spending is measured against the fraction of the month already
 * lived; once it is closed, the fraction is 1 and the comparison is simply
 * against the budget. A month that has not started yet has nothing to say.
 */
const paceVerdict = computed(() => {
  if (signal.value.budgeted <= 0) return null
  if (monthKey.value > currentMonthKey()) return null

  const over = !signal.value.onPace
  const against = pace.value.isCurrent ? 'do ritmo' : 'do orçado'

  return {
    tone: (over ? 'neg' : 'pos') as 'neg' | 'pos',
    amount: Math.abs(signal.value.excess),
    label: `${over ? 'acima' : 'abaixo'} ${against}`,
  }
})

/** The three situations, summarised on the section's own heading line. */
const LEGEND_STYLE = {
  over: { swatch: 'var(--neg)', amountColor: 'var(--neg-text)' },
  within: { swatch: 'var(--accent)', amountColor: 'var(--pos-text)' },
  untouched: { swatch: 'var(--rule-strong)', amountColor: 'var(--text-2)' },
} as const

const legend = computed(() =>
  groups.value
    .filter(group => group.key !== 'untargeted')
    .map(group => {
      const style = LEGEND_STYLE[group.key as keyof typeof LEGEND_STYLE]
      const n = group.lines.length

      if (group.key === 'over') {
        return { key: group.key, ...style, text: `${n} ${n === 1 ? 'estourou' : 'estouraram'} ·`, amount: `-${formatCurrency(group.amount)}`, suffix: '' }
      }
      if (group.key === 'within') {
        return { key: group.key, ...style, text: `${n} dentro da meta`, amount: '', suffix: '' }
      }
      return { key: group.key, ...style, text: `${n} sem gasto ·`, amount: formatCurrency(group.amount), suffix: 'livres' }
    })
)
</script>
