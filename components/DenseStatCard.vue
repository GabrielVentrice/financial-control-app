<template>
  <div class="border-l-2 pl-3 py-2 space-y-1.5" :class="borderColorClass">
    <!-- Label -->
    <div class="flex items-center justify-between gap-2">
      <p class="text-[10px] font-medium text-text-muted uppercase tracking-wider">
        {{ label }}
      </p>
      <slot name="badge" />
    </div>

    <!-- Main Value -->
    <div class="flex items-baseline gap-2">
      <p :class="['text-[26px] font-normal font-serif leading-none tracking-tight', valueColorClass]">
        {{ formattedValue }}
      </p>
      <TrendIndicator
        v-if="trend !== undefined"
        :value="trend"
        :invert-colors="invertTrendColors"
        size="sm"
      />
    </div>

    <!-- Secondary Stats Row -->
    <div v-if="hasSecondaryStats" class="flex items-center gap-3 pt-0.5">
      <div v-if="secondaryStat" class="flex-1">
        <p class="text-[9px] text-text-muted uppercase tracking-wide">{{ secondaryStat.label }}</p>
        <p class="text-[12px] font-medium text-text-primary mt-0.5">{{ secondaryStat.value }}</p>
      </div>
      <div v-if="tertiaryStat" class="flex-1">
        <p class="text-[9px] text-text-muted uppercase tracking-wide">{{ tertiaryStat.label }}</p>
        <p class="text-[12px] font-medium text-text-primary mt-0.5">{{ tertiaryStat.value }}</p>
      </div>
    </div>

    <!-- Bottom Slot for additional content -->
    <div v-if="$slots.bottom" class="pt-1">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Format = 'currency' | 'number' | 'percentage' | 'text'
type ValueColor = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'default'

interface SecondaryStat {
  label: string
  value: string | number
}

interface Props {
  label: string
  value: number | string
  format?: Format
  valueColor?: ValueColor
  trend?: number // Percentage change
  invertTrendColors?: boolean
  secondaryStat?: SecondaryStat
  tertiaryStat?: SecondaryStat
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  valueColor: 'default',
  invertTrendColors: false
})

// Format value based on type
const formattedValue = computed(() => {
  if (props.format === 'text') return String(props.value)

  const numValue = Number(props.value)

  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue)

    case 'percentage':
      return `${numValue.toFixed(1)}%`

    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR').format(numValue)
  }
})

// Value color class
const valueColorClass = computed(() => {
  const colors: Record<ValueColor, string> = {
    primary: 'text-accent-primary',
    success: 'text-accent-success',
    danger: 'text-accent-danger',
    info: 'text-accent-info',
    warning: 'text-accent-warning',
    default: 'text-text-primary'
  }
  return colors[props.valueColor]
})

// Border color class
const borderColorClass = computed(() => {
  const colors: Record<ValueColor, string> = {
    primary: 'border-l-accent-primary',
    success: 'border-l-accent-success',
    danger: 'border-l-accent-danger',
    info: 'border-l-accent-info',
    warning: 'border-l-accent-warning',
    default: 'border-l-border-base'
  }
  return colors[props.valueColor]
})

// Check if has secondary stats
const hasSecondaryStats = computed(() => {
  return props.secondaryStat || props.tertiaryStat
})
</script>
