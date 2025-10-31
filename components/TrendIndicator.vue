<template>
  <div class="inline-flex items-center gap-1" :class="containerClasses">
    <!-- Arrow Icon -->
    <span :class="iconClasses" class="text-[11px] leading-none font-bold">
      {{ icon }}
    </span>

    <!-- Percentage -->
    <span :class="textClasses" class="text-[11px] leading-none font-semibold">
      {{ formattedValue }}
    </span>

    <!-- Optional label -->
    <span v-if="label" class="text-[10px] leading-none text-text-muted ml-0.5">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TrendType = 'positive' | 'negative' | 'neutral'

interface Props {
  value: number // Percentage value (e.g., 15.5 for 15.5%)
  type?: TrendType // Override automatic detection
  label?: string // Optional label like "vs mês anterior"
  size?: 'sm' | 'md'
  invertColors?: boolean // For cases where decrease is good (expenses)
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  invertColors: false
})

// Determine trend type
const trendType = computed<TrendType>(() => {
  if (props.type) return props.type

  if (props.value > 0) return 'positive'
  if (props.value < 0) return 'negative'
  return 'neutral'
})

// Icon based on trend
const icon = computed(() => {
  if (trendType.value === 'positive') return '▲'
  if (trendType.value === 'negative') return '▼'
  return '●'
})

// Format value
const formattedValue = computed(() => {
  const absValue = Math.abs(props.value)
  return `${absValue.toFixed(1)}%`
})

// Color classes based on trend and invertColors
const colorClass = computed(() => {
  if (trendType.value === 'neutral') return 'text-text-muted'

  const isPositiveTrend = trendType.value === 'positive'
  const shouldBeGreen = props.invertColors ? !isPositiveTrend : isPositiveTrend

  return shouldBeGreen ? 'text-accent-success' : 'text-accent-danger'
})

const containerClasses = computed(() => {
  return props.size === 'sm' ? 'text-[11px]' : 'text-[13px]'
})

const iconClasses = computed(() => colorClass.value)
const textClasses = computed(() => colorClass.value)
</script>
