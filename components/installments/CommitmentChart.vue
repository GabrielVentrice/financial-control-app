<template>
  <div class="bg-background-card border border-border-subtle rounded-xl p-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-1">
      <h2 class="text-xs font-medium text-text-muted uppercase tracking-wider">
        Comprometimento mês a mês
      </h2>
      <div class="flex items-center gap-2 text-[11px] text-text-muted">
        <span class="inline-block w-4 h-0 border-t border-dashed border-gray-400" aria-hidden="true"></span>
        projeção
      </div>
    </div>
    <p class="text-[13px] text-text-secondary mb-5">Próximos 12 meses · a pilha encolhe conforme as parcelas encerram</p>

    <!-- Plot -->
    <div class="relative">
      <!-- Healthy-limit reference line (30% of income) -->
      <div
        v-if="limit > 0 && limitPct <= 100"
        class="absolute left-0 right-0 z-10 pointer-events-none"
        :style="{ bottom: `${limitPct}%` }"
      >
        <div class="border-t border-dashed border-warning/70"></div>
        <span class="absolute right-0 -top-2 bg-background-card px-1 text-[10px] font-medium text-warning whitespace-nowrap">
          {{ limitLabel }}
        </span>
      </div>

      <!-- Bars -->
      <div class="flex items-stretch gap-1.5 h-[220px]" role="img" :aria-label="ariaLabel">
        <div
          v-for="(month, i) in months"
          :key="month.key"
          class="flex-1 flex flex-col justify-end min-w-0"
          :class="i === firstFutureIndex ? 'border-l border-dashed border-gray-300 pl-1 -ml-1' : ''"
        >
          <!-- The bar (stack) -->
          <div
            class="flex flex-col-reverse gap-px rounded-t-[3px] overflow-hidden w-full"
            :class="month.isFuture ? 'border border-dashed border-gray-300 opacity-80' : ''"
            :style="{ height: `${barHeightPct(month.total)}%` }"
          >
            <div
              v-for="seg in month.segments"
              :key="seg.key"
              :style="{ height: month.total > 0 ? `${(seg.value / month.total) * 100}%` : '0%', backgroundColor: seg.color }"
              :title="`${seg.name}: ${fmt(seg.value)}`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Column labels -->
      <div class="flex gap-1.5 mt-2">
        <div
          v-for="month in months"
          :key="month.key"
          class="flex-1 min-w-0 text-center"
        >
          <p class="text-[11px] font-medium tabular-nums" :class="month.isCurrent ? 'text-text-primary' : 'text-text-muted'">
            {{ compact(month.total) }}
          </p>
          <p class="text-[10px] uppercase tracking-wide truncate" :class="month.isCurrent ? 'text-text-primary font-semibold' : 'text-text-muted'">
            {{ month.label }}
          </p>
        </div>
      </div>
    </div>

    <!-- Legend: color → parcela -->
    <div v-if="legend.length" class="mt-5 pt-4 border-t border-border-subtle flex flex-wrap gap-x-4 gap-y-2">
      <div v-for="item in legend" :key="item.key" class="flex items-center gap-1.5 min-w-0">
        <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ backgroundColor: item.color }" aria-hidden="true"></span>
        <span class="text-[12px] text-text-secondary truncate">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Segment {
  key: string
  name: string
  color: string
  value: number
}

interface MonthColumn {
  key: string
  label: string
  total: number
  isCurrent: boolean
  isFuture: boolean
  segments: Segment[]
}

interface LegendItem {
  key: string
  name: string
  color: string
}

interface Props {
  months: MonthColumn[]
  yMax: number
  limit?: number
  limitLabel?: string
  legend?: LegendItem[]
}

const props = withDefaults(defineProps<Props>(), {
  limit: 0,
  limitLabel: '',
  legend: () => []
})

const { formatCurrency } = useFormatters()

const fmt = (v: number) => formatCurrency(v)
const compact = (v: number) => (v > 0 ? formatCurrency(v, { compact: true }).replace('R$', '').trim() : '–')

const barHeightPct = (total: number) => (props.yMax > 0 ? (total / props.yMax) * 100 : 0)
const limitPct = computed(() => (props.yMax > 0 ? (props.limit / props.yMax) * 100 : 0))

const firstFutureIndex = computed(() => props.months.findIndex(m => m.isFuture))

const ariaLabel = computed(() => {
  const parts = props.months.map(m => `${m.label}: ${fmt(m.total)}`)
  return `Comprometimento com parcelas por mês nos próximos 12 meses. ${parts.join('; ')}.`
})
</script>
