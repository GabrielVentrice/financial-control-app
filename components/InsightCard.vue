<template>
  <div
    :class="[
      'flex items-start gap-3 px-3 py-2.5 rounded-md border',
      backgroundClass,
      borderClass
    ]"
  >
    <!-- Icon -->
    <div :class="['flex-shrink-0 text-[16px] leading-none mt-0.5', iconColorClass]">
      {{ icon }}
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-medium text-text-primary leading-tight">
            {{ title }}
          </p>
          <p class="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
            {{ message }}
          </p>
        </div>

        <!-- Value Badge (optional) -->
        <div v-if="value !== undefined" class="flex-shrink-0">
          <span :class="['text-[12px] font-semibold whitespace-nowrap', iconColorClass]">
            {{ formattedValue }}
          </span>
        </div>
      </div>

      <!-- Action slot -->
      <div v-if="$slots.action" class="mt-2">
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type InsightType = 'success' | 'warning' | 'danger' | 'info'

interface Props {
  type: InsightType
  title: string
  message: string
  value?: number // Optional monetary value
  customIcon?: string
}

const props = defineProps<Props>()

// Icons based on type
const icon = computed(() => {
  if (props.customIcon) return props.customIcon

  const icons: Record<InsightType, string> = {
    success: '✓',
    warning: '⚠',
    danger: '✕',
    info: 'ℹ'
  }
  return icons[props.type]
})

// Color classes
const iconColorClass = computed(() => {
  const colors: Record<InsightType, string> = {
    success: 'text-accent-success',
    warning: 'text-accent-warning',
    danger: 'text-accent-danger',
    info: 'text-accent-info'
  }
  return colors[props.type]
})

const backgroundClass = computed(() => {
  const backgrounds: Record<InsightType, string> = {
    success: 'bg-accent-success/5',
    warning: 'bg-accent-warning/5',
    danger: 'bg-accent-danger/5',
    info: 'bg-accent-info/5'
  }
  return backgrounds[props.type]
})

const borderClass = computed(() => {
  const borders: Record<InsightType, string> = {
    success: 'border-accent-success/20',
    warning: 'border-accent-warning/20',
    danger: 'border-accent-danger/20',
    info: 'border-accent-info/20'
  }
  return borders[props.type]
})

// Format value
const formattedValue = computed(() => {
  if (props.value === undefined) return ''

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(props.value)
})
</script>
