<template>
  <section class="flex flex-col gap-18">
    <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(460, 560)">
      <div class="flex items-baseline gap-3">
        <h2 class="font-display text-section text-ink">A dívida caindo</h2>
        <span class="text-meta text-text-3">
          saldo devedor no fim de cada mês, no ritmo atual
        </span>
      </div>
      <span class="text-meta text-text-3 whitespace-nowrap">
        barra clara = juros do mês
      </span>
    </div>

    <div class="flex gap-[14px] items-stretch">
      <!-- Eixo Y -->
      <div
        class="w-[66px] max-sm:w-[44px] flex-none flex flex-col justify-between items-end pb-[44px] text-[11.5px] text-text-4 num"
        aria-hidden="true"
      >
        <span v-for="tick in ticks" :key="tick.label">{{ tick.label }}</span>
      </div>

      <div class="flex-1 min-w-0 relative h-[232px]">
        <div class="absolute left-0 right-0 top-0 bottom-[44px] flex flex-col justify-between" aria-hidden="true">
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-strong"></div>
        </div>

        <div class="relative h-full flex items-stretch">
          <div v-for="(m, i) in visible" :key="m.monthKey" class="flex-1 flex flex-col min-w-0">
            <div class="flex-1 flex items-end justify-center px-1">
              <!-- Uma barra por mês: o saldo que sobra. O topo claro é o quanto
                   daquele saldo é juros novo — a parcela da barra que não é
                   dívida sua, é preço de carregar a dívida. -->
              <div class="w-full max-w-[44px] flex flex-col justify-end" :style="{ height: barHeight(m.closing) }">
                <div
                  class="om-grow-y w-full rounded-t-bar"
                  :style="{ height: interestShare(m), background: 'var(--warn)', ...om(520 + i * 55, 780) }"
                ></div>
                <div
                  class="om-grow-y w-full"
                  :style="{ height: `calc(100% - ${interestShare(m)})`, background: barColor(i), ...om(520 + i * 55, 780) }"
                ></div>
              </div>
            </div>
            <div class="h-[44px] box-border pt-1.5 flex flex-col items-center gap-0.5">
              <span
                class="text-body-sm num"
                :class="m.closing > 0 ? (i === 0 ? 'font-bold text-ink' : 'font-medium text-text-2') : 'font-bold text-pos-text'"
              >{{ m.closing > 0 ? formatNumber(m.closing) : '0' }}</span>
              <span class="text-[11px] tracking-[0.10em] uppercase text-text-4">{{ label(m.monthKey) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PayoffMonth } from '~/shared/debt'
import { monthIndexOfKey } from '~/shared/dates'

/**
 * The debt going down, one bar per month.
 *
 * Deliberately the mirror image of the installments projection: same bar
 * language, but here shrinking is the good news. The amber cap is the month's
 * interest — it is the only part of the balance that is not the user's own
 * spending, and seeing it sit on top of every bar is the argument for paying
 * faster.
 */
const props = defineProps<{
  months: PayoffMonth[]
  /** How many months to draw. The tail after payoff carries no information. */
  limit?: number
}>()

const { formatNumber, formatMonthName } = useFormatters()
const { om } = useEntryMotion()

const visible = computed(() => props.months.slice(0, props.limit ?? 12))

const label = (key: string) => formatMonthName(monthIndexOfKey(key), true)

const scaleTop = computed(() => Math.max(1, ...visible.value.map(m => m.closing)) * 1.1)

const ticks = computed(() => {
  const top = scaleTop.value
  return [top, (top * 2) / 3, top / 3, 0].map(v => ({
    label: v >= 1000 ? `R$ ${formatNumber(v)}` : String(Math.round(v)),
  }))
})

const barHeight = (v: number) => `${Math.max(0, Math.min(100, (v / scaleTop.value) * 100))}%`

/** Interest as a share of the bar it sits on, so the cap stays proportional. */
const interestShare = (m: PayoffMonth) =>
  m.closing > 0 ? `${Math.min(100, (m.interest / m.closing) * 100)}%` : '0%'

const barColor = (i: number) => {
  if (i === 0) return 'var(--ink)'
  if (i <= 4) return 'oklch(0.46 0.012 60 / 0.62)'
  return 'oklch(0.46 0.012 60 / 0.34)'
}
</script>
