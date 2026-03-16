<template>
  <div class="py-6 px-6" role="region" :aria-label="ariaDescription">
    <!-- Label - 13px, regular, accessible gray -->
    <p class="text-[13px] font-normal text-gray-500 mb-2">
      {{ label }}
    </p>

    <!-- Hero Value -->
    <p :class="['leading-tight', valueSizeClass, valueColorClass]">
      {{ formattedValue }}
    </p>

    <!-- Context line - trend as colored dot + percentage, or secondary stat -->
    <div class="mt-2">
      <p v-if="trend !== undefined" class="text-[12px] text-gray-500 flex items-center gap-1.5">
        <span :class="['w-1.5 h-1.5 rounded-full inline-block', trendDotColor]"></span>
        {{ formattedTrend }}
      </p>
      <p v-if="secondaryStat" class="text-[13px] font-normal text-gray-500">
        <span v-if="secondaryStat.value">{{ secondaryStat.value }}</span>
        <span v-if="secondaryStat.value && secondaryStat.label"> · </span>
        <span v-if="secondaryStat.label">{{ secondaryStat.label }}</span>
      </p>
    </div>

    <!-- Bottom Slot -->
    <div v-if="$slots.bottom" class="mt-4">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Format = 'currency' | 'number' | 'percentage' | 'text'
type ValueColor = 'positive' | 'negative' | 'neutral' | 'warning' | 'default' | 'success'
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
  trend?: number
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

const valueSizeClass = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'text-kpi-sm',
    md: 'text-kpi-md',
    lg: 'text-kpi-lg'
  }
  return sizes[props.size]
})

const valueColorClass = computed(() => {
  const colors: Record<ValueColor, string> = {
    positive: 'text-positive',
    negative: 'text-negative',
    neutral: 'text-[#111111]',
    warning: 'text-warning',
    success: 'text-positive',
    default: 'text-[#111111]'
  }
  return colors[props.valueColor]
})

const trendDotColor = computed(() => {
  if (props.trend === undefined) return ''
  const isPositive = props.trend >= 0
  const shouldBeGreen = props.invertTrendColors ? !isPositive : isPositive
  return shouldBeGreen ? 'bg-emerald-400' : 'bg-rose-400'
})

const formattedTrend = computed(() => {
  if (props.trend === undefined) return ''
  const abs = Math.abs(props.trend)
  const capped = abs > 999 ? '+999' : abs.toFixed(1)
  return `${capped}% vs mes anterior`
})

const ariaDescription = computed(() => {
  let desc = `${props.label}: ${formattedValue.value}`
  if (props.trend !== undefined) {
    const abs = Math.abs(props.trend)
    const direction = props.trend >= 0 ? 'aumento' : 'reducao'
    const cappedValue = abs > 999 ? '+999' : abs.toFixed(1)
    desc += `, ${direction} de ${cappedValue}% em relacao ao mes anterior`
  }
  return desc
})
</script>
