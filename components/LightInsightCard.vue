<template>
  <div
    :class="[
      'flex items-start gap-4 px-5 py-4 rounded-xl transition-all duration-300',
      backgroundClass,
      'hover:shadow-sm'
    ]"
  >
    <!-- Icon - Minimalista e PEQUENO -->
    <div :class="['flex-shrink-0 text-sm leading-none mt-1 opacity-70', iconColorClass]">
      {{ icon }}
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <!-- Title - Font-weight NORMAL, não bold -->
          <p class="text-sm font-normal text-gray-700 leading-relaxed mb-1">
            {{ title }}
          </p>

          <!-- Message - Cor suave -->
          <p class="text-[13px] text-gray-500 leading-relaxed">
            {{ message }}
          </p>
        </div>

        <!-- Value Badge - Pequeno e suave -->
        <div v-if="value !== undefined" class="flex-shrink-0">
          <span :class="['text-sm font-medium whitespace-nowrap', iconColorClass]">
            {{ formattedValue }}
          </span>
        </div>
      </div>

      <!-- Action slot -->
      <div v-if="$slots.action" class="mt-3">
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

// Icons based on type - Símbolos simples
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

// Color classes - SUAVES, dessaturadas
const iconColorClass = computed(() => {
  const colors: Record<InsightType, string> = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-400',     // rose-400, não red-500!
    info: 'text-blue-500'
  }
  return colors[props.type]
})

// Background - SEM BORDAS, apenas bg suave
const backgroundClass = computed(() => {
  const backgrounds: Record<InsightType, string> = {
    success: 'bg-emerald-50/30',   // Muito suave, quase invisível
    warning: 'bg-amber-50/30',
    danger: 'bg-rose-50/30',
    info: 'bg-blue-50/30'
  }
  return backgrounds[props.type]
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
