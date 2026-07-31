<template>
  <section class="flex flex-col gap-18">
    <div class="om-rise flex flex-wrap items-baseline justify-between gap-3" :style="om(460, 560)">
      <div class="flex items-baseline gap-3">
        <h2 class="font-display text-section text-ink">Quando isso acaba</h2>
        <span class="text-meta text-text-3">próximos 12 meses, se você não parcelar mais nada</span>
      </div>
      <span v-if="ceiling > 0" class="text-meta text-warn whitespace-nowrap">
        — — limite saudável · {{ formatCurrency(ceiling) }}
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
        <!-- Gridlines: a primeira é o limite -->
        <div class="absolute left-0 right-0 top-0 bottom-[44px] flex flex-col justify-between" aria-hidden="true">
          <div class="border-t border-dashed border-[color:var(--warn)]"></div>
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-soft"></div>
          <div class="h-px bg-rule-strong"></div>
        </div>

        <!-- Uma barra por mês, valor único -->
        <div class="relative h-full flex items-stretch">
          <div v-for="(m, i) in months" :key="m.key" class="flex-1 flex flex-col min-w-0">
            <div class="flex-1 flex items-end justify-center px-1">
              <div
                class="om-grow-y w-full max-w-[44px] rounded-t-bar"
                :style="{ height: barHeight(m.value), background: barColor(i), ...om(520 + i * 55, 780) }"
              ></div>
            </div>
            <!-- border-box: sem ele o bloco empurra as barras 5px acima da baseline -->
            <div class="h-[44px] box-border pt-1.5 flex flex-col items-center gap-0.5">
              <span
                class="text-body-sm num"
                :class="i === 0 ? 'font-bold text-ink' : m.value > 0 ? 'font-medium text-text-2' : 'text-text-4'"
              >{{ m.value > 0 ? formatNumber(m.value) : '—' }}</span>
              <span class="text-[11px] tracking-[0.10em] uppercase text-text-4">{{ m.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * One bar per month, single value.
 *
 * Stacking a segment per merchant is banned by the system, and rightly: the
 * previous version drew 12 grey bands per month plus a 12-name legend nobody
 * reads. The question this screen answers is "when does it end", which is a
 * shape over time, not a breakdown by store — the table below covers that.
 *
 * The scale is fixed at the healthy ceiling so the distance to the dashed line
 * stays readable; present vs. projection is carried by alpha of the same grey,
 * never by a second colour.
 */
const props = defineProps<{
  months: { key: string; label: string; value: number }[]
  ceiling: number
}>()

const { formatCurrency, formatNumber } = useFormatters()
const { om } = useEntryMotion()

/** Fall back to the peak when there is no income to derive a ceiling from. */
const scaleTop = computed(() => {
  if (props.ceiling > 0) return props.ceiling
  return Math.max(1, ...props.months.map(m => m.value)) * 1.1
})

const ticks = computed(() => {
  const top = scaleTop.value
  return [top, (top * 2) / 3, top / 3, 0].map(v => ({
    label: v >= 1000 ? `R$ ${formatNumber(v)}` : String(Math.round(v)),
  }))
})

const barHeight = (v: number) => `${Math.max(0, Math.min(100, (v / scaleTop.value) * 100))}%`

/** Current month is full ink; the near future fades, the far future fades more. */
const barColor = (i: number) => {
  if (i === 0) return 'var(--ink)'
  if (i <= 4) return 'oklch(0.46 0.012 60 / 0.62)'
  return 'oklch(0.46 0.012 60 / 0.34)'
}
</script>
