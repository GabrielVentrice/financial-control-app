<template>
  <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" :class="pillClasses">
    <!-- Arrow Icon -->
    <span class="text-[10px] leading-none">
      {{ icon }}
    </span>

    <!-- Percentage -->
    <span class="text-xs leading-none font-medium">
      {{ formattedValue }}
    </span>

    <!-- Optional label -->
    <span v-if="label" class="text-[10px] leading-none opacity-70 ml-0.5">
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
  label?: string // Optional label like "vs mes anterior"
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

// Format value - cap at 999%
const formattedValue = computed(() => {
  const absValue = Math.abs(props.value)
  if (absValue > 999) return '+999%'
  return `${absValue.toFixed(1)}%`
})

// Pill background + text color classes
const pillClasses = computed(() => {
  if (trendType.value === 'neutral') return 'bg-gray-100 text-gray-500'

  const isPositiveTrend = trendType.value === 'positive'
  const shouldBeGreen = props.invertColors ? !isPositiveTrend : isPositiveTrend

  return shouldBeGreen
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-red-50 text-red-700'
})
</script>
