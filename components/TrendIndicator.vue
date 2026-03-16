<template>
  <div class="inline-flex items-center gap-1.5">
    <!-- Colored dot instead of arrow -->
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>

    <!-- Percentage -->
    <span class="text-[12px] leading-none font-normal text-[#9CA3AF]">
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

// Determine trend type
const trendType = computed<TrendType>(() => {
  if (props.type) return props.type
  if (props.value > 0) return 'positive'
  if (props.value < 0) return 'negative'
  return 'neutral'
})

// Format value - cap at 999%
const formattedValue = computed(() => {
  const absValue = Math.abs(props.value)
  if (absValue > 999) return '+999%'
  return `${absValue.toFixed(1)}%`
})

// Dot color
const dotClass = computed(() => {
  if (trendType.value === 'neutral') return 'bg-gray-300'

  const isPositiveTrend = trendType.value === 'positive'
  const shouldBeGreen = props.invertColors ? !isPositiveTrend : isPositiveTrend

  return shouldBeGreen ? 'bg-emerald-400' : 'bg-rose-400'
})
</script>
