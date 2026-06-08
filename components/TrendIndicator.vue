<template>
  <div class="inline-flex items-center gap-1">
    <!-- Directional arrow (shape + color redundancy) -->
    <span class="text-[11px] leading-none font-semibold" :class="colorClass" aria-hidden="true">{{ arrow }}</span>

    <!-- Percentage -->
    <span class="text-[12px] leading-none font-normal text-text-muted">
      {{ formattedValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TrendType = 'positive' | 'negative' | 'neutral'

interface Props {
  value: number
  type?: TrendType
  label?: string
  size?: 'sm' | 'md'
  invertColors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  invertColors: false
})

const trendType = computed<TrendType>(() => {
  if (props.type) return props.type
  if (props.value > 0) return 'positive'
  if (props.value < 0) return 'negative'
  return 'neutral'
})

const formattedValue = computed(() => {
  const absValue = Math.abs(props.value)
  if (absValue > 999) return '+999%'
  return `${absValue.toFixed(1)}%`
})

const arrow = computed(() => {
  if (trendType.value === 'neutral') return '→'
  return trendType.value === 'positive' ? '↑' : '↓'
})

const colorClass = computed(() => {
  if (trendType.value === 'neutral') return 'text-text-muted'

  const isPositiveTrend = trendType.value === 'positive'
  const shouldBeGreen = props.invertColors ? !isPositiveTrend : isPositiveTrend

  return shouldBeGreen ? 'text-positive' : 'text-negative'
})
</script>
