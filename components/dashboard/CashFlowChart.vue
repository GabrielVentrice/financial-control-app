<template>
  <section class="flex flex-col gap-18">
    <!-- Cabeçalho + legenda -->
    <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(480, 560)">
      <div class="flex items-baseline gap-3">
        <h2 class="font-display text-section text-ink">Fluxo de caixa</h2>
        <span class="text-meta text-text-3">últimos {{ series.length }} meses</span>
      </div>

      <div class="flex gap-18 text-meta text-text-2">
        <span class="inline-flex items-center gap-1.5">
          <span class="w-[9px] h-[9px] rounded-bar bg-accent" aria-hidden="true"></span>entradas
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="w-[9px] h-[9px] rounded-bar bg-neg-swatch" aria-hidden="true"></span>saídas
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="w-[14px] h-[2px] bg-ink" aria-hidden="true"></span>sobra
        </span>
      </div>
    </div>

    <!-- Plot -->
    <div class="flex gap-[14px] items-stretch">
      <!-- Eixo Y -->
      <div
        class="w-[66px] max-sm:w-[44px] flex-none flex flex-col justify-between items-end pb-26 text-[11.5px] text-text-4 num"
        aria-hidden="true"
      >
        <span v-for="tick in axisTicks" :key="tick">{{ tick }}</span>
      </div>

      <div class="flex-1 min-w-0 relative h-[236px]">
        <!-- Gridlines; a última é a baseline -->
        <div class="absolute left-0 right-0 top-0 bottom-26 flex flex-col justify-between" aria-hidden="true">
          <div class="h-px bg-rule"></div>
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-strong"></div>
        </div>

        <!-- Uma coluna por mês -->
        <div class="relative h-full flex items-stretch">
          <div v-for="(m, i) in series" :key="m.key" class="flex-1 flex flex-col">
            <div class="flex-1 flex items-end justify-center gap-[7px] px-2.5">
              <div
                class="om-grow-y w-[30%] max-w-[30px] max-lg:max-w-[22px] rounded-t-bar bg-accent"
                :style="{ height: barHeight(m.income), ...om(540 + i * 80, 780) }"
              ></div>
              <div
                class="om-grow-y w-[30%] max-w-[30px] max-lg:max-w-[22px] rounded-t-bar bg-neg-bar"
                :style="{ height: barHeight(m.expenses), ...om(540 + i * 80, 780) }"
              ></div>
            </div>
            <div class="h-26 flex items-center justify-center text-meta font-medium text-text-2">
              {{ monthLabel(m.key) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Faixa de sobra: a métrica derivada fica explícita, não escondida em tooltip -->
    <div class="flex ml-[80px] max-sm:ml-[58px] pt-[14px] border-t border-[color:var(--border)]">
      <div
        v-for="(m, i) in series"
        :key="m.key"
        class="om-rise flex-1 flex flex-col items-center gap-0.5"
        :style="om(920 + i * 45, 520)"
      >
        <span class="text-caption uppercase text-text-4">sobra</span>
        <span
          class="maskable text-[14px] font-semibold num"
          :class="m.net >= 0 ? 'text-pos-text' : 'text-neg-text'"
        >{{ signedBRL(m.net) }}</span>
      </div>
    </div>

    <!-- Alternativa textual ao gráfico -->
    <p class="sr-only">
      <span v-for="m in series" :key="m.key">
        {{ monthLabel(m.key) }}: entradas {{ formatCurrency(m.income) }},
        saídas {{ formatCurrency(m.expenses) }},
        sobra {{ signedBRL(m.net) }}.
      </span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CashFlowMonth } from '~/composables/useDashboardAnalytics'
import { monthIndexOfKey } from '~/shared/dates'

const props = defineProps<{
  series: CashFlowMonth[]
  axisTop: number
}>()

const { formatCurrency, formatMonthName } = useFormatters()
const { om } = useEntryMotion()

const monthLabel = (key: string) => formatMonthName(monthIndexOfKey(key), true)

/** Four ticks, top to bottom, matching the four gridlines. */
const axisTicks = computed(() => {
  const top = props.axisTop
  return [
    `R$ ${Math.round(top / 1000)}k`,
    `${Math.round((top * 2) / 3000)}k`,
    `${Math.round(top / 3000)}k`,
    '0',
  ]
})

const barHeight = (value: number) =>
  `${Math.max(0, Math.min(100, (value / props.axisTop) * 100))}%`

/** "+ R$ 6.550" / "− R$ 1.200" — explicit sign with minus U+2212. */
const signedBRL = (v: number) =>
  `${v < 0 ? '−' : '+'} R$ ${Math.abs(Math.round(v)).toLocaleString('pt-BR')}`
</script>
