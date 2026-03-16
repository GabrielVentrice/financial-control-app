<template>
  <div class="inline-flex items-center gap-1.5">
    <!-- Colored dot -->
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>

    <!-- Percentage -->
    <span class="text-[12px] leading-none font-normal text-gray-500">
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

const dotClass = computed(() => {
  if (trendType.value === 'neutral') return 'bg-gray-300'

  const isPositiveTrend = trendType.value === 'positive'
  const shouldBeGreen = props.invertColors ? !isPositiveTrend : isPositiveTrend

  return shouldBeGreen ? 'bg-emerald-400' : 'bg-rose-400'
})
</script>
