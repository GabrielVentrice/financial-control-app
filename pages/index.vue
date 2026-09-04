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
          class="grid grid-cols-[1.35fr_1fr] max-xl:grid-cols-2 max-lg:grid-cols-1 gap-30 max-lg:gap-18 pb-26 border-b border-[color:var(--border)]"
        >
          <div class="flex flex-col gap-[10px]">
            <p class="om-rise text-label uppercase text-text-3" :style="om(40, 520)">
              {{ pace.isCurrent ? 'Disponível para o resto do mês' : 'Sobrou no mês' }}
            </p>

            <div class="flex items-baseline gap-[14px] flex-wrap">
              <span v-if="loading" class="block w-[300px] h-[74px] rounded-control bg-rule" aria-hidden="true"></span>
              <span
                v-else
                class="om-rise maskable font-display text-hero max-xl:text-[64px] max-lg:text-[52px] num"
                :class="totals.available < 0 ? 'text-neg-text' : 'text-ink'"
                :style="om(90, 760)"
              >{{ formatCurrency(totals.available) }}</span>
            </div>

            <p class="om-rise text-body text-text-2 [text-wrap:pretty]" :style="om(240, 560)">
              <template v-if="pace.isCurrent && pace.daysLeft > 0">
                Faltam <b class="font-semibold text-ink num">{{ pace.daysLeft }}</b>
                {{ pace.daysLeft === 1 ? 'dia' : 'dias' }} —
                <b class="font-semibold text-ink num maskable">{{ formatCurrency(totals.dailyAllowance) }}</b> por dia.
              </template>
              <template v-else>
                Mês fechado: entrou
                <b class="font-semibold text-ink num maskable">{{ formatCurrency(totals.income) }}</b>,
                saiu <b class="font-semibold text-ink num maskable">{{ formatCurrency(totals.spent) }}</b>.
              </template>
            </p>

            <!-- Ritmo: gasto realizado contra a fração do mês já vivida. -->
            <div v-if="pace.isCurrent && signal.budgeted > 0" class="om-rise mt-2 max-w-[420px]" :style="om(320, 560)">
              <CeilingBar :value="signal.spent" :ceiling="signal.budgeted" :used-pct="pace.ratio * 100" :delay="380">
                <template v-if="signal.onPace">
                  No ritmo — <span class="maskable num">{{ formatCurrency(Math.abs(signal.excess)) }}</span>
                  abaixo do esperado para o dia {{ pace.daysElapsed }}.
                </template>
                <template v-else>
                  <span class="text-neg-text">
                    <span class="maskable num">{{ formatCurrency(signal.excess) }}</span>
                    acima do ritmo do dia {{ pace.daysElapsed }}.
                  </span>
                </template>
              </CeilingBar>
            </div>
          </div>

          <!-- Coluna direita: as três parcelas do número grande. -->
          <div class="flex flex-col gap-[18px] pl-30 max-lg:pl-0 border-l max-lg:border-l-0 border-[color:var(--border)]">
            <div v-for="(tile, i) in tiles" :key="tile.label" class="om-rise flex flex-col gap-1" :style="om(300 + i * 60, 560)">
              <p class="text-label uppercase text-text-3">{{ tile.label }}</p>
              <p class="maskable num font-display text-hero-2" :class="tile.cls">{{ formatCurrency(tile.value) }}</p>
              <p class="text-meta text-text-3">{{ tile.note }}</p>
            </div>
          </div>
        </section>

        <!-- ═══ CATEGORIAS ═══ -->
        <section class="flex flex-col gap-18">
          <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(440, 560)">
            <h2 class="font-display text-section text-ink">Onde o mês está indo</h2>
            <span class="text-meta text-text-3">
              ordenado por quem está mais perto de estourar
            </span>
          </div>

          <p v-if="saveError" role="alert" class="text-body-sm text-neg-text">{{ saveError }}</p>

          <EmptyState
            v-if="!snapshot.lines.length"
            title="Nenhum gasto neste mês"
            description="Sincronize o livro ou escolha outro mês."
          />

          <div v-else class="flex flex-col">
            <div
              class="grid grid-cols-[minmax(0,1fr)_260px_150px] max-xl:grid-cols-[minmax(0,1fr)_200px_130px] max-lg:hidden gap-18 items-center pb-2 border-b border-rule-strong text-[10px] font-bold tracking-[0.14em] uppercase text-text-3"
            >
              <span>Categoria</span>
              <span>Gasto sobre a meta</span>
              <span class="text-right">Ainda cabe</span>
            </div>

            <MonthCategoryBudgetRow
              v-for="(line, i) in snapshot.lines"
              :key="line.category"
              :line="line"
              :delay="600 + i * 38"
              :busy="saving === line.category"
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

/**
 * "Meu Mês" — a tela principal.
 *
 * Responde, nesta ordem: quanto ainda posso gastar, onde o mês está indo, e
 * estou no trilho do plano de mudança. O número grande é de CAIXA (renda menos
 * o que saiu menos o que ainda vai cair), não de orçamento — orçamento é um
 * acordo, caixa é o que existe, e quando os dois discordam quem manda é o caixa.
 *
 * Nada é recalculado aqui: /api/month devolve o mês inteiro medido, e salvar
 * uma meta devolve o mês recomputado. A tela e o servidor não têm como
 * discordar sobre um total.
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

const tiles = computed(() => [
  {
    label: 'Entrou',
    value: totals.value.income,
    cls: 'text-pos-text',
    note: 'salário e outras entradas do mês',
  },
  {
    label: 'Já saiu',
    value: totals.value.spent,
    cls: 'text-ink',
    note: `${snapshot.value?.lines.reduce((n, l) => n + l.count, 0) ?? 0} lançamentos realizados`,
  },
  {
    label: 'Ainda vai cair',
    value: totals.value.committed,
    cls: totals.value.committed > 0 ? 'text-warn' : 'text-text-3',
    note: 'parcelas projetadas para este mês',
  },
  {
    label: 'Folga no orçamento',
    value: totals.value.budgetRemaining,
    cls: totals.value.budgetRemaining < 0 ? 'text-neg-text' : 'text-ink',
    note: `de ${formatCurrency(totals.value.budgeted)} orçados`,
  },
])
</script>
