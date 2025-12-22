<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
    <!-- Label - Small, uppercase, consistent -->
    <div class="flex items-center gap-2 mb-1">
      <span v-if="icon" class="text-base">{{ icon }}</span>
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {{ label }}
      </p>
    </div>

    <!-- Main Value - Professional sizing with good contrast -->
    <div class="flex items-baseline gap-2">
      <p :class="['leading-tight', valueSizeClass, valueColorClass]">
        {{ formattedValue }}
      </p>

      <!-- Trend Indicator - Compact -->
      <TrendIndicator
        v-if="trend !== undefined"
        :value="trend"
        :invert-colors="invertTrendColors"
        size="sm"
      />
    </div>

    <!-- Secondary Stats - Compact, readable -->
    <div v-if="hasSecondaryStats" class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
      <div v-if="secondaryStat" class="flex-1">
        <p class="text-xs text-gray-500 mb-0.5">
          {{ secondaryStat.label }}
        </p>
        <p class="text-sm font-medium text-gray-900">
          {{ secondaryStat.value }}
        </p>
      </div>

      <div v-if="tertiaryStat" class="flex-1">
        <p class="text-xs text-gray-500 mb-0.5">
          {{ tertiaryStat.label }}
        </p>
        <p class="text-sm font-medium text-gray-900">
          {{ tertiaryStat.value }}
        </p>
      </div>
    </div>

    <!-- Bottom Slot - For sparklines, charts, etc -->
    <div v-if="$slots.bottom" class="mt-3 pt-3 border-t border-gray-100">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Format = 'currency' | 'number' | 'percentage' | 'text'
type ValueColor = 'positive' | 'negative' | 'neutral' | 'warning' | 'default'
type Size = 'sm' | 'md' | 'lg'

interface SecondaryStat {
  label: string
  value: string | number
}

interface Props {
  label: string
  value: number | string
  format?: Format
  valueColor?: ValueColor
  size?: Size
  trend?: number // Percentage change
  invertTrendColors?: boolean
  secondaryStat?: SecondaryStat
  tertiaryStat?: SecondaryStat
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  valueColor: 'default',
  size: 'lg',
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

// Professional KPI sizing - maximum text-3xl
const valueSizeClass = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'text-kpi-sm',  // 20px - font-semibold
    md: 'text-kpi-md',  // 24px - font-semibold
    lg: 'text-kpi-lg'   // 30px - font-semibold (maximum)
  }
  return sizes[props.size]
})

// Semantic colors from design system
const valueColorClass = computed(() => {
  const colors: Record<ValueColor, string> = {
    positive: 'text-positive',     // emerald-600 - Income
    negative: 'text-negative',     // red-600 - Expenses
    neutral: 'text-neutral',       // blue-600 - Info
    warning: 'text-warning',       // amber-600 - Alerts
    default: 'text-gray-900'       // Dark gray for general values
  }
  return colors[props.valueColor]
})

// Check if has secondary stats
const hasSecondaryStats = computed(() => {
  return props.secondaryStat || props.tertiaryStat
})
</script>
