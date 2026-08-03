<template>
  <Sidemenu>
    <main class="min-h-screen max-w-app px-30 pt-26 pb-34 max-lg:px-5 flex flex-col gap-26">
      <div class="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          @click="editing = !editing"
          :aria-expanded="editing"
          class="px-2.5 py-1.5 rounded-control border border-[color:var(--border)] bg-surface-1 text-body-sm font-semibold text-ink hover:bg-surface-2 transition-colors duration-[120ms] ease-ease"
        >{{ editing ? 'fechar ajustes' : 'ajustar plano' }}</button>
        <SyncButton />
      </div>

      <ErrorState v-if="error" :message="error" />

      <!-- Sem plano: o saldo do cheque especial não existe no extrato como
           lançamento, então alguém precisa dizer qual é uma vez. -->
      <section v-else-if="!loading && !snapshot" class="flex flex-col gap-18 max-w-[560px]">
        <div class="flex flex-col gap-2">
          <h1 class="font-display text-section text-ink">Acompanhar uma dívida</h1>
          <p class="text-body text-text-2 [text-wrap:pretty]">
            O saldo do cheque especial é um estado da conta, não um lançamento — ele não
            aparece no extrato. Diga quanto você deve hoje e, a partir daí, cada
            sincronização atualiza o número sozinha.
          </p>
        </div>
        <form class="flex flex-col gap-[14px]" @submit.prevent="createPlan">
          <label class="flex flex-col gap-1.5">
            <span class="text-label uppercase text-text-3">Quanto você deve hoje</span>
            <input
              v-model.number="form.anchorBalance"
              type="number" step="0.01" min="0" required
              class="px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-body text-ink num"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-label uppercase text-text-3">Juros ao mês (%)</span>
            <input
              v-model.number="form.ratePct"
              type="number" step="0.01" min="0" max="100"
              class="px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-body text-ink num"
            />
          </label>
          <button
            type="submit" :disabled="saving"
            class="self-start px-4 py-2 rounded-control bg-ink text-surface-1 text-body-sm font-bold disabled:opacity-50"
          >{{ saving ? 'salvando…' : 'começar a acompanhar' }}</button>
          <p v-if="saveError" role="alert" class="text-body-sm text-neg-text">{{ saveError }}</p>
        </form>
      </section>

      <template v-else-if="snapshot">
        <!-- ═══ HERO ═══ -->
        <section class="grid grid-cols-[1.35fr_1fr] max-xl:grid-cols-2 max-lg:grid-cols-1 gap-30 max-lg:gap-18 pb-26 border-b border-[color:var(--border)]">
          <div class="flex flex-col gap-[10px]">
            <p class="om-rise text-label uppercase text-text-3" :style="om(40, 520)">
              {{ snapshot.plan.name }} · você deve hoje
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
              >R$ {{ formatNumber(snapshot.currentBalance) }}</span>

              <span
                v-if="!loading && Math.abs(snapshot.movedSinceAnchor) >= 1"
                class="om-rise inline-flex items-center px-2.5 py-1 rounded-control text-[12.5px] font-bold"
                :class="snapshot.movedSinceAnchor > 0 ? 'bg-accent-wash text-pos-text' : 'bg-neg-wash text-neg-text'"
                :style="om(320, 520)"
              >
                {{ snapshot.movedSinceAnchor > 0 ? '−' : '+' }}{{ formatCurrency(Math.abs(snapshot.movedSinceAnchor)) }}
                desde {{ shortDate(snapshot.plan.anchorDate) }}
              </span>
            </div>

            <div class="om-rise flex flex-wrap gap-22 mt-1 text-body text-text-2" :style="om(240, 560)">
              <span>
                <b class="maskable font-semibold text-ink num">{{ formatCurrency(snapshot.interestLast12m) }}</b>
                de juros em 12 meses
              </span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span><b class="font-semibold text-ink num">{{ ratePct }}%</b> ao mês</span>
              <span class="text-rule-strong" aria-hidden="true">/</span>
              <span>
                sobra hoje
                <b class="maskable font-semibold num" :class="snapshot.capacityNow > 0 ? 'text-pos-text' : 'text-neg-text'">
                  {{ formatCurrency(snapshot.capacityNow) }}
                </b>/mês
              </span>
            </div>

            <!-- O custo de não fazer nada. É o argumento inteiro da tela: um
                 saldo parado não é neutro, ele sangra. -->
            <div class="mt-3 px-3.5 py-3 rounded-control bg-warn-wash">
              <p class="text-body text-ink [text-wrap:pretty]">
                Parado do jeito que está, esse saldo custa
                <b class="maskable num">{{ formatCurrency(snapshot.costOfInaction) }}</b>
                de juros nos próximos 12 meses — sem você comprar nada.
              </p>
            </div>
          </div>

          <!-- Quitação -->
          <div class="flex flex-col gap-[14px] pl-30 border-l border-[color:var(--border)] max-lg:pl-0 max-lg:border-l-0 max-lg:pt-18 max-lg:border-t">
            <div class="om-rise flex flex-col gap-1.5" :style="om(300, 620)">
              <p class="text-label uppercase text-text-3">Quitada em</p>
              <div class="flex items-baseline justify-between gap-2.5">
                <span
                  class="font-display text-hero-2 num"
                  :class="projection.neverPaysOff ? 'text-neg-text' : 'text-pos-text'"
                >{{ payoffLabel }}</span>
                <span v-if="!projection.neverPaysOff" class="text-body-sm font-semibold text-text-2 whitespace-nowrap">
                  {{ projection.monthsToPayoff }} {{ projection.monthsToPayoff === 1 ? 'mês' : 'meses' }}
                </span>
              </div>
              <p v-if="projection.neverPaysOff" class="text-body-sm text-neg-text [text-wrap:pretty]">
                No ritmo atual a dívida não zera: o que sobra por mês não cobre
                nem os juros. Os passos abaixo mudam isso.
              </p>
              <p v-else class="maskable text-body-sm text-text-2 [text-wrap:pretty]">
                pagando <b class="font-semibold text-ink num">{{ formatCurrency(projection.totalInterest) }}</b>
                de juros no caminho
              </p>
            </div>

            <div class="h-px bg-[color:var(--border)]"></div>

            <div v-if="relief" class="om-rise flex flex-col gap-1.5" :style="om(380, 620)">
              <p class="text-label uppercase text-text-3">Quando o caixa abre</p>
              <div class="flex items-baseline justify-between gap-2.5">
                <span class="maskable font-display text-hero-2 text-pos-text num">
                  + {{ formatCurrency(relief.freed) }}
                </span>
                <span class="text-body-sm font-semibold text-text-2 whitespace-nowrap">
                  em {{ monthName(relief.monthKey).toLowerCase() }}
                </span>
              </div>
              <p class="maskable text-body-sm text-text-2 [text-wrap:pretty]">
                as parcelas caem de {{ formatCurrency(relief.today) }} para
                {{ formatCurrency(relief.then) }} por mês — esse é o dinheiro que quita a dívida
              </p>
            </div>
          </div>
        </section>

        <!-- ═══ PROJEÇÃO ═══ -->
        <DebtPayoffChart v-if="projection.months.length" :months="projection.months" :limit="12" />

        <!-- ═══ O PLANO ═══ -->
        <section class="flex flex-col gap-[14px]">
          <div class="om-rise flex items-baseline gap-3" :style="om(540, 560)">
            <h2 class="font-display text-section text-ink">O plano</h2>
            <span class="text-meta text-text-3">em ordem de impacto</span>
          </div>

          <ol class="flex flex-col">
            <li
              v-for="(step, i) in steps"
              :key="step.title"
              class="om-rise grid grid-cols-[28px_1fr_auto] max-lg:grid-cols-[24px_1fr] gap-18 max-lg:gap-3 items-baseline py-[14px] border-b border-rule"
              :style="om(620 + i * 45, 560)"
            >
              <span class="font-display text-body-sm text-text-4 num">{{ i + 1 }}</span>
              <div class="flex flex-col gap-1 min-w-0">
                <span class="text-item text-ink">{{ step.title }}</span>
                <span class="maskable text-body-sm text-text-2 [text-wrap:pretty]">{{ step.detail }}</span>
              </div>
              <span
                v-if="step.impact"
                class="maskable text-value num whitespace-nowrap text-right max-lg:col-start-2"
                :class="step.tone === 'pos' ? 'text-pos-text' : 'text-ink'"
              >{{ step.impact }}</span>
            </li>
          </ol>
        </section>

        <!-- ═══ AJUSTES ═══ -->
        <section v-if="editing" class="flex flex-col gap-[14px] pt-22 border-t border-[color:var(--border)]">
          <div class="flex items-baseline gap-3">
            <h2 class="font-display text-section text-ink">Ajustar o plano</h2>
            <span class="text-meta text-text-3">reancore sempre que o app e o banco divergirem</span>
          </div>

          <form class="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-18" @submit.prevent="submitPlan">
            <label class="flex flex-col gap-1.5">
              <span class="text-label uppercase text-text-3">Devo hoje</span>
              <input
                v-model.number="form.anchorBalance" type="number" step="0.01" min="0"
                class="px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-body text-ink num"
              />
              <span class="text-micro text-text-4">ancorado em {{ shortDate(snapshot.plan.anchorDate) }}</span>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-label uppercase text-text-3">Juros % a.m.</span>
              <input
                v-model.number="form.ratePct" type="number" step="0.01" min="0" max="100"
                class="px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-body text-ink num"
              />
              <span class="text-micro text-text-4">confira no extrato</span>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-label uppercase text-text-3">Corte mensal</span>
              <input
                v-model.number="form.monthlyCut" type="number" step="10" min="0"
                class="px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-body text-ink num"
              />
              <span class="text-micro text-text-4">quanto você se compromete a cortar</span>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-label uppercase text-text-3">Meta (opcional)</span>
              <input
                v-model="form.targetMonth" type="month"
                class="px-3 py-2 rounded-control border border-[color:var(--border)] bg-surface-1 text-body text-ink num"
              />
              <span v-if="snapshot.targetPayment" class="maskable text-micro text-text-4">
                exigiria {{ formatCurrency(snapshot.targetPayment) }}/mês
              </span>
            </label>

            <div class="col-span-full flex items-center gap-3">
              <button
                type="submit" :disabled="saving"
                class="px-4 py-2 rounded-control bg-ink text-surface-1 text-body-sm font-bold disabled:opacity-50"
              >{{ saving ? 'salvando…' : 'salvar' }}</button>
              <p v-if="saveError" role="alert" class="text-body-sm text-neg-text">{{ saveError }}</p>
            </div>
          </form>
        </section>
      </template>
    </main>
  </Sidemenu>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { currentMonthKey, monthKeyToIdx, idxToMonthKey, monthIndexOfKey } from '~/shared/dates'
import { projectPayoff } from '~/shared/debt'

const { snapshot, loading, error, saving, saveError, savePlan } = useDebtPlan()
const { formatCurrency, formatNumber, formatMonthName } = useFormatters()
const { om } = useEntryMotion()

const editing = ref(false)

const form = reactive({
  anchorBalance: 0,
  ratePct: 3.1,
  monthlyCut: 0,
  targetMonth: '',
})

// Keep the form in step with whatever the server last confirmed, so opening
// "ajustar" never shows a stale number next to a fresh one in the hero.
watch(
  snapshot,
  s => {
    if (!s) return
    form.anchorBalance = Number(s.currentBalance.toFixed(2))
    form.ratePct = Number((s.plan.monthlyRate * 100).toFixed(2))
    form.monthlyCut = s.plan.monthlyCut
    form.targetMonth = s.plan.targetMonth ?? ''
  },
  { immediate: true }
)

const ratePct = computed(() =>
  snapshot.value ? (snapshot.value.plan.monthlyRate * 100).toFixed(2).replace('.', ',') : '—'
)

const projection = computed(
  () => snapshot.value?.projection ?? { months: [], payoffMonth: null, monthsToPayoff: null, totalInterest: 0, neverPaysOff: true }
)

const monthName = (key: string) => formatMonthName(monthIndexOfKey(key))
const monthYear = (key: string) =>
  key ? `${formatMonthName(monthIndexOfKey(key), true).toLowerCase()}/${key.split('-')[0]}` : '—'
const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const payoffLabel = computed(() =>
  projection.value.payoffMonth ? monthYear(projection.value.payoffMonth) : 'não zera'
)

/**
 * The month by which most of the relief has arrived.
 *
 * `freed` is measured against TODAY, not against the previous month, because
 * that is what the projection actually spends — `capacityForMonth` adds up
 * every installment that has ended since. Reporting the biggest single step
 * instead would put a smaller number on screen than the plan is built on, and
 * the two readings would quietly disagree.
 *
 * The month chosen is the first to reach 80% of the total relief available over
 * the next year: past that point the load is essentially flat, so it is the
 * month the new steady state begins — more useful than either the first small
 * drop or the trivial endpoint where everything has ended.
 */
const relief = computed(() => {
  const s = snapshot.value
  if (!s) return null
  const start = currentMonthKey()
  const today = s.installmentsByMonth[start] ?? 0
  if (today <= 0) return null

  const horizon = Array.from({ length: 12 }, (_, i) => {
    const key = idxToMonthKey(monthKeyToIdx(start) + i + 1)
    return { monthKey: key, then: s.installmentsByMonth[key] ?? 0 }
  })

  const maxFreed = today - Math.min(...horizon.map(h => h.then))
  if (maxFreed <= 0) return null

  const target = maxFreed * 0.8
  const hit = horizon.find(h => today - h.then >= target)
  if (!hit) return null

  return { monthKey: hit.monthKey, then: hit.then, freed: today - hit.then, today }
})

/**
 * The plan, derived rather than written down.
 *
 * Each step carries the number that makes it worth doing, computed from the
 * user's own data — a plan whose steps are prose is a plan nobody checks
 * against reality next month.
 */
const steps = computed(() => {
  const s = snapshot.value
  if (!s) return []
  const out: { title: string; detail: string; impact?: string; tone?: 'pos' | 'ink' }[] = []

  // 1. Rate. Always first when the rate is high: it is the only lever that
  // costs nothing to pull and compounds every single month.
  if (s.plan.monthlyRate > 0.015) {
    const cheaper = projectPayoff({
      balance: s.currentBalance,
      monthlyRate: 0.015,
      startMonth: currentMonthKey(),
      baseSurplus: s.cashflow.surplus,
      installmentsByMonth: s.installmentsByMonth,
      monthlyCut: s.plan.monthlyCut,
    })
    const saved = s.projection.totalInterest - cheaper.totalInterest
    out.push({
      title: 'Troque o cheque especial por uma linha mais barata',
      detail:
        `A ${ratePct.value}% ao mês você já pagou ${formatCurrency(s.interestLast12m)} de juros em 12 meses. ` +
        `Peça ao banco o parcelamento do limite (ele é obrigado a oferecer quando o uso passa de R$ 500 por 30 dias), ` +
        `crédito pessoal ou consignado. A 1,5% ao mês a mesma dívida sai por bem menos.`,
      impact: saved > 0 ? `− ${formatCurrency(saved)}` : undefined,
      tone: 'pos',
    })
  }

  // 2. Stop feeding it. The roll-off only helps if nothing refills it.
  if (relief.value) {
    out.push({
      title: 'Não parcele mais nada até quitar',
      detail:
        `Suas parcelas somam ${formatCurrency(relief.value.today)} este mês e caem para ` +
        `${formatCurrency(relief.value.then)} em ${monthName(relief.value.monthKey).toLowerCase()}. ` +
        `Cada compra nova parcelada adia essa queda e devolve a dívida ao ponto de partida.`,
      impact: `+ ${formatCurrency(relief.value.freed)}/mês`,
      tone: 'pos',
    })
  }

  // 3. Point the freed money at the debt on purpose. Money that frees up and
  // isn't assigned gets spent — that is how the balance survived this long.
  if (relief.value) {
    out.push({
      title: `Em ${monthName(relief.value.monthKey).toLowerCase()}, mande a folga inteira para a dívida`,
      detail:
        `Quando as parcelas caírem, esses ${formatCurrency(relief.value.freed)} por mês precisam ter destino ` +
        `no dia em que entram. Folga sem destino vira gasto — foi assim que o saldo chegou até aqui.`,
      impact: payoffLabel.value !== 'não zera' ? `quita ${payoffLabel.value}` : undefined,
    })
  }

  // 4. The gap, when there is one. Only shown if the plan doesn't close.
  if (s.projection.neverPaysOff || (s.projection.monthsToPayoff ?? 0) > 12) {
    const need = s.currentBalance / 12 + s.currentBalance * s.plan.monthlyRate
    const gap = Math.max(0, need - s.capacityNow)
    out.push({
      title: 'Abra caixa agora, não só em dezembro',
      detail:
        `Sua sobra recorrente é ${formatCurrency(s.cashflow.surplus)} por mês (média dos últimos ` +
        `${s.cashflow.months} meses fechados). Para quitar em 12 meses faltam cerca de ` +
        `${formatCurrency(gap)} por mês — venha de corte, de renda extra ou dos dois. ` +
        `Use o campo "corte mensal" nos ajustes para ver o efeito antes de se comprometer.`,
      impact: gap > 0 ? `${formatCurrency(gap)}/mês` : undefined,
    })
  }

  return out
})

const submitPlan = async () => {
  const ok = await savePlan({
    anchorBalance: form.anchorBalance,
    monthlyRate: form.ratePct / 100,
    monthlyCut: form.monthlyCut,
    targetMonth: form.targetMonth || null,
  })
  if (ok) editing.value = false
}

const createPlan = () => savePlan({ anchorBalance: form.anchorBalance, monthlyRate: form.ratePct / 100 })

useHead({ title: 'Quitar dívida · Controle Financeiro' })
</script>
