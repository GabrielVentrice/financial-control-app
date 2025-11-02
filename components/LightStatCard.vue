<template>
  <div class="bg-gray-50/50 rounded-xl px-6 py-5 transition-colors duration-200 hover:bg-gray-50">
    <!-- Label - Suave e pequeno -->
    <p class="text-xs font-medium text-gray-400 mb-3 tracking-wide uppercase">
      {{ label }}
    </p>

    <!-- Main Value - Hierarquia por TAMANHO, não peso -->
    <div class="flex items-baseline gap-3 mb-3">
      <p :class="['font-light leading-none tracking-tight', valueSizeClass, valueColorClass]">
        {{ formattedValue }}
      </p>

      <!-- Trend Indicator - Minimalista -->
      <TrendIndicator
        v-if="trend !== undefined"
        :value="trend"
        :invert-colors="invertTrendColors"
        size="sm"
        class="opacity-60"
      />
    </div>

    <!-- Secondary Stats - Respirável -->
    <div v-if="hasSecondaryStats" class="flex items-center gap-4 pt-2 border-t border-gray-100">
      <div v-if="secondaryStat" class="flex-1 pt-2">
        <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
          {{ secondaryStat.label }}
        </p>
        <p class="text-sm font-normal text-gray-600">
          {{ secondaryStat.value }}
        </p>
      </div>

      <div v-if="tertiaryStat" class="flex-1 pt-2">
        <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
          {{ tertiaryStat.label }}
        </p>
        <p class="text-sm font-normal text-gray-600">
          {{ tertiaryStat.value }}
        </p>
      </div>
    </div>

    <!-- Bottom Slot - Para sparklines, etc -->
    <div v-if="$slots.bottom" class="pt-3 mt-3 border-t border-gray-100">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Format = 'currency' | 'number' | 'percentage' | 'text'
type ValueColor = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'default'
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
      // Sem símbolo R$ para visual mais limpo
      return new Intl.NumberFormat('pt-BR', {
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

// Value size - Hierarquia por tamanho, não peso!
const valueSizeClass = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl'
  }
  return sizes[props.size]
})

// Value color - Cores SUAVES (dessaturadas)
const valueColorClass = computed(() => {
  const colors: Record<ValueColor, string> = {
    primary: 'text-blue-500',      // Azul suave
    success: 'text-emerald-500',   // Verde suave
    danger: 'text-rose-400',       // Vermelho suave (não red-500!)
    info: 'text-sky-500',          // Azul info suave
    warning: 'text-amber-500',     // Amarelo suave
    default: 'text-gray-700'       // Cinza escuro, não preto
  }
  return colors[props.valueColor]
})

// Check if has secondary stats
const hasSecondaryStats = computed(() => {
  return props.secondaryStat || props.tertiaryStat
})
</script>
