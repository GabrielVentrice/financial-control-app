<template>
  <div class="inline-flex items-end gap-[2px]" :style="{ height: height + 'px' }">
    <div
      v-for="(value, index) in normalizedValues"
      :key="index"
      :class="['rounded-sm transition-all duration-200', barColorClass]"
      :style="{
        height: (value * height) + 'px',
        width: barWidth + 'px',
        opacity: index === normalizedValues.length - 1 ? 1 : 0.6
      }"
      :title="`${data[index]}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SparklineColor = 'primary' | 'success' | 'danger' | 'info' | 'muted'

interface Props {
  data: number[] // Array of values to plot
  height?: number // Height in pixels
  barWidth?: number // Width of each bar in pixels
  color?: SparklineColor
}

const props = withDefaults(defineProps<Props>(), {
  height: 24,
  barWidth: 3,
  color: 'primary'
})

// Normalize values to 0-1 range
const normalizedValues = computed(() => {
  if (props.data.length === 0) return []

  const min = Math.min(...props.data)
  const max = Math.max(...props.data)
  const range = max - min

  if (range === 0) return props.data.map(() => 0.5)

  return props.data.map(value => (value - min) / range)
})

// Bar color class
const barColorClass = computed(() => {
  const colors: Record<SparklineColor, string> = {
    primary: 'bg-accent-primary',
    success: 'bg-accent-success',
    danger: 'bg-accent-danger',
    info: 'bg-accent-info',
    muted: 'bg-text-muted'
  }
  return colors[props.color]
})
</script>
