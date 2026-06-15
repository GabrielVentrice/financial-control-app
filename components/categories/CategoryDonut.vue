<template>
  <div class="relative" :style="{ width: `${box}px`, height: `${box}px` }">
    <svg
      :viewBox="`0 0 ${box} ${box}`"
      class="w-full h-full -rotate-90"
      role="img"
      :aria-label="ariaLabel"
    >
      <circle :cx="c" :cy="c" :r="r" fill="none" stroke="#F3F4F6" :stroke-width="stroke" />
      <circle
        v-for="seg in arcs"
        :key="seg.key"
        :cx="c"
        :cy="c"
        :r="r"
        fill="none"
        :stroke="seg.color"
        :stroke-width="highlightKey === seg.key ? stroke + 3 : stroke"
        :stroke-dasharray="`${seg.len} ${circumference - seg.len}`"
        :stroke-dashoffset="-seg.offset"
        :style="{ opacity: highlightKey && highlightKey !== seg.key ? 0.3 : 1, transition: 'opacity .15s, stroke-width .15s' }"
        stroke-linecap="butt"
        class="cursor-pointer"
        @mouseenter="$emit('hover', seg.key)"
        @mouseleave="$emit('hover', null)"
      />
    </svg>

    <!-- Center hole label -->
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
      <span class="text-[11px] text-text-muted uppercase tracking-wider">{{ centerLabel }}</span>
      <span class="text-kpi-sm text-text-primary leading-tight">{{ centerValue }}</span>
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

interface Props {
  segments: Segment[]
  total: number
  centerValue: string
  centerLabel?: string
  highlightKey?: string | null
  box?: number
}
const props = withDefaults(defineProps<Props>(), {
  centerLabel: 'total',
  highlightKey: null,
  box: 210
})
defineEmits<{ hover: [key: string | null] }>()

const stroke = 18
const c = computed(() => props.box / 2)
const r = computed(() => props.box / 2 - stroke / 2 - 2)
const circumference = computed(() => 2 * Math.PI * r.value)

const arcs = computed(() => {
  let acc = 0
  return props.segments
    .filter(s => s.value > 0)
    .map(s => {
      const frac = props.total > 0 ? s.value / props.total : 0
      const len = frac * circumference.value
      const arc = { key: s.key, color: s.color, len, offset: acc }
      acc += len
      return arc
    })
})

const ariaLabel = computed(() => {
  const parts = props.segments
    .filter(s => s.value > 0)
    .map(s => `${s.name} ${props.total > 0 ? Math.round((s.value / props.total) * 100) : 0}%`)
  return `Distribuição de gastos por categoria: ${parts.join(', ')}.`
})
</script>
