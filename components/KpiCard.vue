<template>
  <div class="bg-background-card border border-border-subtle rounded-lg px-6 py-6 transition-all duration-200 hover:border-border-base">
    <!-- Label -->
    <p class="text-[13px] text-text-muted font-medium uppercase tracking-wider mb-3">
      {{ label }}
    </p>

    <!-- Valor Principal -->
    <div class="flex items-baseline gap-2 mb-3">
      <p
        :class="[
          'text-[40px] font-normal font-serif tracking-tight leading-none',
          valueColorClass
        ]"
      >
        {{ formattedValue }}
      </p>

      <!-- Trend/Variação (opcional) -->
      <div v-if="trend" class="flex items-center gap-1 text-[13px] font-medium">
        <span v-if="trend.direction === 'up'" class="text-accent-success">↑</span>
        <span v-else-if="trend.direction === 'down'" class="text-accent-danger">↓</span>
        <span v-else class="text-text-muted">→</span>
        <span :class="trendColorClass">{{ trend.value }}</span>
      </div>
    </div>

    <!-- Subtitle/Descrição -->
    <p v-if="subtitle" class="text-[13px] text-text-muted">
      {{ subtitle }}
    </p>

    <!-- Sparkline/Mini gráfico (slot opcional) -->
    <div v-if="$slots.sparkline" class="mt-4 h-12">
      <slot name="sparkline" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Trend {
  direction: 'up' | 'down' | 'neutral'
  value: string
}

interface Props {
  label: string
  value: number | string
  subtitle?: string
  valueColor?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'primary'
  trend?: Trend
  format?: 'currency' | 'number' | 'percentage' | 'text'
}

const props = withDefaults(defineProps<Props>(), {
  valueColor: 'default',
  format: 'text'
})

// Formatação do valor
const formattedValue = computed(() => {
  if (props.format === 'text') return props.value

  const numValue = typeof props.value === 'number' ? props.value : parseFloat(props.value as string)

  if (props.format === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  if (props.format === 'percentage') {
    return `${numValue.toFixed(1)}%`
  }

  if (props.format === 'number') {
    return new Intl.NumberFormat('pt-BR').format(numValue)
  }

  return props.value
})

// Classes de cor do valor
const valueColorClass = computed(() => {
  const colorMap = {
    default: 'text-text-primary',
    success: 'text-accent-success',
    danger: 'text-accent-danger',
    warning: 'text-accent-warning',
    info: 'text-accent-info',
    primary: 'text-accent-primary'
  }
  return colorMap[props.valueColor]
})

// Classes de cor do trend
const trendColorClass = computed(() => {
  if (!props.trend) return ''

  const directionMap = {
    up: 'text-accent-success',
    down: 'text-accent-danger',
    neutral: 'text-text-muted'
  }
  return directionMap[props.trend.direction]
})
</script>
